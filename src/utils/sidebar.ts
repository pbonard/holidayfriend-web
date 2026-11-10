// whether the desktop sidebar is collapsed, kept through a reload.
// the choice is in localStorage and shows as <html data-sidebar="collapsed">: Sidebar.tsx styles the collapsed
// sidebar off that attribute (stylex.when.ancestor), so it's right from the first paint, before react has loaded.
// document.documentElement is <html>, and its dataset.sidebar is how javascript reads and writes data-sidebar:
// setting it adds the attribute, delete removes it, and reading it gives its value or undefined

const STORAGE_KEY = 'sidebar';
const COLLAPSED = 'collapsed';

// runs in <head> before the page paints, the pages are prerendered and can't know the choice themselves.
// localStorage can throw (blocked site data), then the sidebar just starts open
export const SIDEBAR_SCRIPT = `try{if(localStorage.getItem('${STORAGE_KEY}')==='${COLLAPSED}')document.documentElement.dataset.sidebar='${COLLAPSED}'}catch(e){}`;

const listeners = new Set<() => void>();

export function subscribeSidebar(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isSidebarCollapsed() {
  return document.documentElement.dataset.sidebar === COLLAPSED;
}

export function setSidebarCollapsed(collapsed: boolean) {
  const root = document.documentElement;
  if (collapsed) {
    root.dataset.sidebar = COLLAPSED;
  } else {
    delete root.dataset.sidebar;
  }
  try {
    if (collapsed) {
      localStorage.setItem(STORAGE_KEY, COLLAPSED);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // not remembered, it still toggles for this visit
  }
  listeners.forEach((listener) => listener());
}
