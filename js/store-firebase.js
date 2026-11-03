/* FirebaseAdapter — Firebase Auth (email/password) + Cloud Firestore with live onSnapshot updates.
   Used only when js/firebase-config.js has a config. The SDK is loaded on demand. */
App.FirebaseAdapter = (() => {
  const SDK = '10.12.2';
  const KINDS = ['activities', 'transactions', 'categories'];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('load ' + src));
      document.head.appendChild(s);
    });
  }

  async function create(config) {
    const base = `https://www.gstatic.com/firebasejs/${SDK}`;
    await loadScript(`${base}/firebase-app-compat.js`);
    await Promise.all([loadScript(`${base}/firebase-auth-compat.js`), loadScript(`${base}/firebase-firestore-compat.js`)]);

    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    const auth = app.auth();
    const fs = app.firestore();
    const FV = firebase.firestore.FieldValue;
    try { await fs.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* offline cache optional */ }

    const root = (scope) => (scope.type === 'team' ? fs.collection('teams').doc(scope.id) : fs.collection('users').doc(scope.id));
    const col = (scope, kind) => root(scope).collection(kind);
    const err = (code) => { const e = new Error(code); e.code = code; return e; };

    async function loadProfile(fbUser) {
      const ref = fs.collection('users').doc(fbUser.uid);
      const snap = await ref.get();
      if (snap.exists) return { id: fbUser.uid, ...snap.data() };
      // Profile missing (e.g. created from the console) → create a default one.
      const p = { name: fbUser.displayName || fbUser.email.split('@')[0], email: fbUser.email, gender: 'unspecified', theme: 'lavender', mode: 'auto', lang: App.prefs.get().lang, createdAt: Date.now() };
      await ref.set(p);
      return { id: fbUser.uid, ...p };
    }

    async function deleteCollection(ref) {
      const snap = await ref.get();
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = fs.batch();
        snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }

    return {
      kind: 'firebase',
      init() {
        return new Promise((resolve) => {
          const off = auth.onAuthStateChanged(async (u) => {
            off();
            resolve(u ? await loadProfile(u) : null);
          });
        });
      },
      async signUp({ name, email, password, gender }) {
        const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
        await cred.user.updateProfile({ displayName: name.trim() });
        const p = { name: name.trim(), email: email.trim().toLowerCase(), gender, theme: App.themeForGender(gender), mode: 'auto', lang: App.prefs.get().lang, createdAt: Date.now() };
        await fs.collection('users').doc(cred.user.uid).set(p);
        return { id: cred.user.uid, ...p };
      },
      async signIn({ email, password }) {
        const cred = await auth.signInWithEmailAndPassword(email.trim(), password);
        return loadProfile(cred.user);
      },
      signOut() { return auth.signOut(); },
      async updateProfile(uid, patch) {
        const ref = fs.collection('users').doc(uid);
        await ref.set(patch, { merge: true });
        if (patch.name) {
          // keep the display name in teams up to date
          const teams = await fs.collection('teams').where('memberIds', 'array-contains', uid).get();
          await Promise.all(teams.docs.map((d) => d.ref.update({ [`memberNames.${uid}`]: patch.name })));
        }
        return { id: uid, ...(await ref.get()).data() };
      },

      // ---- teams ----
      watchTeams(uid, cb) {
        return fs.collection('teams').where('memberIds', 'array-contains', uid)
          .onSnapshot((snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => { console.error(e); cb([]); });
      },
      async createTeam(user, name) {
        const ref = fs.collection('teams').doc();
        const t = { name: name.trim(), ownerId: user.id, memberIds: [user.id], memberNames: { [user.id]: user.name }, createdAt: Date.now() };
        await ref.set(t);
        return { id: ref.id, ...t };
      },
      async joinTeam(user, code) {
        if (!/^[A-Za-z0-9]{10,40}$/.test(code)) throw err('team/not-found');
        const ref = fs.collection('teams').doc(code);
        let snap;
        try { snap = await ref.get(); } catch (e) { throw err('team/not-found'); }
        if (!snap.exists) throw err('team/not-found');
        if ((snap.data().memberIds || []).includes(user.id)) throw err('team/already-member');
        await ref.update({ memberIds: FV.arrayUnion(user.id), [`memberNames.${user.id}`]: user.name });
        return { id: code, ...snap.data() };
      },
      leaveTeam(user, id) {
        return fs.collection('teams').doc(id).update({ memberIds: FV.arrayRemove(user.id), [`memberNames.${user.id}`]: FV.delete() });
      },
      removeMember(teamId, uid) {
        return fs.collection('teams').doc(teamId).update({ memberIds: FV.arrayRemove(uid), [`memberNames.${uid}`]: FV.delete() });
      },
      async deleteTeam(id) {
        const scope = { type: 'team', id };
        for (const k of KINDS) await deleteCollection(col(scope, k));
        await fs.collection('teams').doc(id).delete();
      },

      // ---- records ----
      watch(scope, cb) {
        const unsubs = [];
        const ready = Promise.all(KINDS.map((kind) => new Promise((resolve) => {
          unsubs.push(col(scope, kind).onSnapshot((snap) => {
            cb(kind, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            resolve();
          }, (e) => { console.error(kind, e); cb(kind, []); resolve(); }));
        })));
        return { ready, unsub: () => unsubs.forEach((u) => u()) };
      },
      add(scope, kind, doc) { const { id, ...data } = doc; return col(scope, kind).doc(id).set(data); },
      async addMany(scope, kind, docs) {
        for (let i = 0; i < docs.length; i += 400) {
          const batch = fs.batch();
          docs.slice(i, i + 400).forEach(({ id, ...data }) => batch.set(col(scope, kind).doc(id), data));
          await batch.commit();
        }
      },
      update(scope, kind, id, patch) { return col(scope, kind).doc(id).update(patch); },
      remove(scope, kind, id) { return col(scope, kind).doc(id).delete(); },
      async clearScope(scope) { for (const k of KINDS) await deleteCollection(col(scope, k)); },
    };
  }

  return { create };
})();
