/* Shared data definitions: app name, colours, categories (with subcategories), expense groups,
   priorities (Eisenhower), repeat options, themes. Names live in core/i18n.js under cat.* / sub.* / grp.* / prio.* / rep.* keys. */

App.NAME = 'Uri Planner';

// Category colours: fixed categorical order, validated for CVD separation in both modes.
// Light steps are soft for the pastel UI; dark mode swaps each slot for its darker step (same hue).
App.PALETTE = ['#5b9be6', '#f0895a', '#35b88c', '#e3a529', '#e584ad', '#58a957', '#8b7ce0', '#e46c6c'];
App.PALETTE_DARK = ['#4f8fdc', '#d9703a', '#22a079', '#bf830e', '#d8689a', '#4f9a4e', '#8577dd', '#dc5e5e'];
App.NEUTRAL = '#a3abb8'; // "other" — recedes next to the palette
App.color = (hex) => {
  if (document.documentElement.dataset.mode !== 'dark') return hex;
  if (hex === App.NEUTRAL) return '#7d8796';
  const i = App.PALETTE.indexOf(hex);
  return i === -1 ? hex : App.PALETTE_DARK[i];
};

// Expense groups. Every expense category takes its group's colour, so charts stay within a few hues.
App.EXPENSE_GROUPS = [
  { id: 'needs', key: 'grp.needs', color: App.PALETTE[0] },
  { id: 'wants', key: 'grp.wants', color: App.PALETTE[1] },
  { id: 'savings', key: 'grp.savings', color: App.PALETTE[2] },
  { id: 'other', key: 'grp.other', color: App.NEUTRAL },
];
const grpColor = (g) => App.EXPENSE_GROUPS.find((x) => x.id === g).color;

// subs: subcategory ids; a subcategory's name is the i18n key sub.<categoryId>.<subId>.
App.DEFAULT_CATEGORIES = [
  // ---- activities (main categories, in palette order) ----
  { id: 'a-work', kind: 'activity', emoji: '💼', color: App.PALETTE[0], subs: ['meeting', 'assignment', 'deadline', 'project'] },
  { id: 'a-health', kind: 'activity', emoji: '🩺', color: App.PALETTE[1], subs: ['exercise', 'doctor', 'sleep', 'medicine'] },
  { id: 'a-finance', kind: 'activity', emoji: '💰', color: App.PALETTE[2], subs: ['bills', 'saving', 'invest', 'tax', 'insurance'] },
  { id: 'a-errands', kind: 'activity', emoji: '🏠', color: App.PALETTE[3], subs: ['shopping', 'cleaning', 'repair', 'office'] },
  { id: 'a-family', kind: 'activity', emoji: '💞', color: App.PALETTE[4], subs: ['birthday', 'friends', 'familytime'] },
  { id: 'a-growth', kind: 'activity', emoji: '🌱', color: App.PALETTE[5], subs: ['reading', 'course', 'skill'] },
  { id: 'a-leisure', kind: 'activity', emoji: '🎨', color: App.PALETTE[6], subs: ['trip', 'movie', 'hobby'] },
  { id: 'a-inbox', kind: 'activity', emoji: '📥', color: App.PALETTE[7], subs: [] },

  // ---- income ----
  { id: 'i-salary', kind: 'income', emoji: '💼', color: App.PALETTE[0], subs: [] },
  { id: 'i-side', kind: 'income', emoji: '💻', color: App.PALETTE[1], subs: ['freelance', 'sales'] },
  { id: 'i-bonus', kind: 'income', emoji: '🎉', color: App.PALETTE[2], subs: ['bonus', 'commission'] },
  { id: 'i-invest', kind: 'income', emoji: '📈', color: App.PALETTE[3], subs: ['interest', 'dividend', 'gain'] },
  { id: 'i-received', kind: 'income', emoji: '🎁', color: App.PALETTE[4], subs: ['gift', 'family', 'taxrefund'] },
  { id: 'i-other', kind: 'income', emoji: '✨', color: App.PALETTE[7], subs: [] },

  // ---- expenses: needs ----
  { id: 'e-housing', kind: 'expense', group: 'needs', emoji: '🏠', subs: ['rent', 'common'] },
  { id: 'e-utilities', kind: 'expense', group: 'needs', emoji: '💡', subs: ['electricity', 'water', 'internet', 'phone'] },
  { id: 'e-food', kind: 'expense', group: 'needs', emoji: '🍜', subs: ['groceries', 'eatout'] },
  { id: 'e-transport', kind: 'expense', group: 'needs', emoji: '🚗', subs: ['fuel', 'transit', 'taxi', 'toll', 'carrepair'] },
  { id: 'e-health', kind: 'expense', group: 'needs', emoji: '💊', subs: ['doctor', 'medicine', 'insurance'] },
  { id: 'e-debt', kind: 'expense', group: 'needs', emoji: '💳', subs: ['car', 'card', 'loan'] },
  { id: 'e-family', kind: 'expense', group: 'needs', emoji: '👨‍👩‍👧', subs: ['parents', 'school', 'pets'] },
  // ---- expenses: wants ----
  { id: 'e-shopping', kind: 'expense', group: 'wants', emoji: '🛍️', subs: ['clothes', 'goods', 'gadget'] },
  { id: 'e-fun', kind: 'expense', group: 'wants', emoji: '🎬', subs: ['movie', 'games', 'concert'] },
  { id: 'e-subs', kind: 'expense', group: 'wants', emoji: '🔁', subs: ['netflix', 'spotify', 'icloud', 'apps'] },
  { id: 'e-travel', kind: 'expense', group: 'wants', emoji: '✈️', subs: [] },
  { id: 'e-social', kind: 'expense', group: 'wants', emoji: '🎁', subs: ['wedding', 'gift', 'merit', 'donate'] },
  // ---- expenses: savings ----
  { id: 'e-saving', kind: 'expense', group: 'savings', emoji: '🐷', subs: ['saving', 'emergency'] },
  { id: 'e-invest', kind: 'expense', group: 'savings', emoji: '📈', subs: ['fund', 'stock', 'ssfrmf', 'lifeins'] },
  // ---- expenses: anything else ----
  { id: 'e-other', kind: 'expense', group: 'other', emoji: '📦', subs: [] },
].map((c) => ({ ...c, key: `cat.${c.id}`, color: c.color || grpColor(c.group) }));

// Categories from before subcategories existed → [new category, subcategory]. Applied when data is read.
App.LEGACY_CATEGORIES = {
  'a-study': ['a-work', null],
  'a-exercise': ['a-health', 'exercise'],
  'a-rest': ['a-leisure', null],
  'a-travel': ['a-errands', null],
  'a-social': ['a-family', 'friends'],
  'a-other': ['a-inbox', null],
  'e-bills': ['e-utilities', null],
  'i-freelance': ['i-side', 'freelance'],
  'i-sales': ['i-side', 'sales'],
};

// Eisenhower matrix: urgent × important.
App.PRIORITIES = [
  { id: 'do', urgent: true, important: true, emoji: '🔥' },
  { id: 'plan', urgent: false, important: true, emoji: '📅' },
  { id: 'delegate', urgent: true, important: false, emoji: '🤝' },
  { id: 'later', urgent: false, important: false, emoji: '🍃' },
];

// One-off or recurring.
App.REPEATS = ['none', 'daily', 'weekdays', 'weekly', 'monthly'];

App.THEMES = {
  sky: { primary: '#4f8ad8', soft: '#dde9fa' },
  sakura: { primary: '#d9638f', soft: '#fbe0ea' },
  mint: { primary: '#3a9d7c', soft: '#d7f0e5' },
  lavender: { primary: '#8370d6', soft: '#e7e1fa' },
  peach: { primary: '#e07b4f', soft: '#fbe4d7' },
};
App.DEFAULT_THEME = 'sky'; // new accounts start on pastel blue; changeable in Settings
