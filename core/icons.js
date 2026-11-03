/* Inline line icons (24px grid). Modules use App.icons.<name>. */
App.icons = (() => {
  const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    logo: P('<rect x="3.5" y="4.5" width="17" height="16" rx="4"/><path d="M8 2.5v4M16 2.5v4M7.5 11h9M7.5 15h5"/>'),
    calendar: P('<rect x="3.5" y="4.5" width="17" height="16" rx="4"/><path d="M8 2.5v4M16 2.5v4M3.5 9.5h17"/>'),
    wallet: P('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="7.5" width="17" height="12" rx="3"/><path d="M16 13.5h1.5"/>'),
    chart: P('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),
    users: P('<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><circle cx="17" cy="7.5" r="2.5"/><path d="M17.5 13c2 .3 3.4 1.7 4 4"/>'),
    user: P('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1-3.6 4-5.5 7.5-5.5s6.5 1.9 7.5 5.5"/>'),
    settings: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    x: P('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: P('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    chevL: P('<path d="M15 6l-6 6 6 6"/>'),
    chevR: P('<path d="M9 6l6 6-6 6"/>'),
    chevD: P('<path d="M6 9l6 6 6-6"/>'),
    copy: P('<rect x="8.5" y="8.5" width="12" height="12" rx="3"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>'),
    trash: P('<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 1.8h7a2 2 0 0 0 2-1.8l1-12M9 7V4.5h6V7"/>'),
    logout: P('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>'),
    info: P('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'),
    download: P('<path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15"/>'),
    upload: P('<path d="M12 15.5V4.5M7 9l5-5 5 5M4.5 19.5h15"/>'),
    sparkle: P('<path d="M12 3.5l1.8 5 5 1.8-5 1.8-1.8 5-1.8-5-5-1.8 5-1.8z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
    cloud: P('<path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9a4.8 4.8 0 0 1-.5 9.5z"/>'),
    device: P('<rect x="3.5" y="5" width="17" height="11.5" rx="2.5"/><path d="M9 20h6M12 16.5V20"/>'),
    clock: P('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  };
})();
