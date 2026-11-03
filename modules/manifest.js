/* Which modules the app loads, and each module's script files (loaded in this order).
   Every module folder also has style.css, loaded automatically (set css: false to skip).
   To remove a feature, delete its line here. To add one, create modules/<id>/ and add a line. */
App.MANIFEST = [
  { id: 'auth', files: ['i18n.js', 'auth.js'] },
  { id: 'planner', files: ['i18n.js', 'activity-form.js', 'planner.js'] },
  { id: 'money', files: ['i18n.js', 'transaction-form.js', 'money.js'] },
  { id: 'dashboard', files: ['i18n.js', 'dashboard.js'] },
  { id: 'teams', files: ['i18n.js', 'teams.js'] },
  { id: 'settings', files: ['i18n.js', 'sample-data.js', 'backup.js', 'settings.js'] },
];
