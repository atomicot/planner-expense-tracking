/* Shared data definitions: app name, category colours, default categories, themes. */

App.NAME = 'Uri Planner';

// Category colours: fixed categorical order, validated for CVD separation in both modes.
// Light steps are soft for the pastel UI; dark mode swaps each slot for its darker step (same hue).
App.PALETTE = ['#5b9be6', '#f0895a', '#35b88c', '#e3a529', '#e584ad', '#58a957', '#8b7ce0', '#e46c6c'];
App.PALETTE_DARK = ['#4f8fdc', '#d9703a', '#22a079', '#bf830e', '#d8689a', '#4f9a4e', '#8577dd', '#dc5e5e'];
App.color = (hex) => {
  if (document.documentElement.dataset.mode !== 'dark') return hex;
  const i = App.PALETTE.indexOf(hex);
  return i === -1 ? hex : App.PALETTE_DARK[i];
};

App.DEFAULT_CATEGORIES = [
  // activities
  { id: 'a-work', kind: 'activity', key: 'cat.work', emoji: '💼', color: App.PALETTE[0] },
  { id: 'a-study', kind: 'activity', key: 'cat.study', emoji: '📚', color: App.PALETTE[1] },
  { id: 'a-exercise', kind: 'activity', key: 'cat.exercise', emoji: '🏃', color: App.PALETTE[2] },
  { id: 'a-rest', kind: 'activity', key: 'cat.rest', emoji: '☕', color: App.PALETTE[3] },
  { id: 'a-family', kind: 'activity', key: 'cat.family', emoji: '🏡', color: App.PALETTE[4] },
  { id: 'a-travel', kind: 'activity', key: 'cat.travel', emoji: '🚗', color: App.PALETTE[5] },
  { id: 'a-social', kind: 'activity', key: 'cat.social', emoji: '🎉', color: App.PALETTE[6] },
  { id: 'a-other', kind: 'activity', key: 'cat.other', emoji: '✨', color: App.PALETTE[7] },
  // expenses
  { id: 'e-food', kind: 'expense', key: 'cat.food', emoji: '🍜', color: App.PALETTE[0] },
  { id: 'e-transport', kind: 'expense', key: 'cat.transport', emoji: '🚌', color: App.PALETTE[1] },
  { id: 'e-shopping', kind: 'expense', key: 'cat.shopping', emoji: '🛍️', color: App.PALETTE[2] },
  { id: 'e-bills', kind: 'expense', key: 'cat.bills', emoji: '🧾', color: App.PALETTE[3] },
  { id: 'e-fun', kind: 'expense', key: 'cat.fun', emoji: '🎬', color: App.PALETTE[4] },
  { id: 'e-health', kind: 'expense', key: 'cat.health', emoji: '💊', color: App.PALETTE[5] },
  { id: 'e-other', kind: 'expense', key: 'cat.other', emoji: '📦', color: App.PALETTE[7] },
  // income
  { id: 'i-salary', kind: 'income', key: 'cat.salary', emoji: '💰', color: App.PALETTE[0] },
  { id: 'i-freelance', kind: 'income', key: 'cat.freelance', emoji: '💻', color: App.PALETTE[1] },
  { id: 'i-sales', kind: 'income', key: 'cat.sales', emoji: '🏷️', color: App.PALETTE[2] },
  { id: 'i-other', kind: 'income', key: 'cat.other', emoji: '🎁', color: App.PALETTE[7] },
];

App.THEMES = {
  sky: { primary: '#4f8ad8', soft: '#dde9fa' },
  sakura: { primary: '#d9638f', soft: '#fbe0ea' },
  mint: { primary: '#3a9d7c', soft: '#d7f0e5' },
  lavender: { primary: '#8370d6', soft: '#e7e1fa' },
  peach: { primary: '#e07b4f', soft: '#fbe4d7' },
};
App.DEFAULT_THEME = 'sky'; // new accounts start on pastel blue; changeable in Settings
