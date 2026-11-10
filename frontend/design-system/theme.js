export const THEME_KEY = "cinq-theme";
export const MOTION_KEY = "cinq-motion";

const CANVAS = { dark: "#0c0b0a", light: "#efe9dd" };

export function readTheme() {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage can be blocked */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = CANVAS[theme];
}

export function toggleTheme() {
  applyTheme(readTheme() === "light" ? "dark" : "light");
}

export function readMotion() {
  return document.documentElement.getAttribute("data-motion") === "reduced" ? "reduced" : "full";
}

export function applyMotion(motion) {
  const root = document.documentElement;
  if (motion === "reduced") root.setAttribute("data-motion", "reduced");
  else root.removeAttribute("data-motion");
  try {
    localStorage.setItem(MOTION_KEY, motion);
  } catch {
    /* storage can be blocked */
  }
}

export function toggleMotion() {
  applyMotion(readMotion() === "reduced" ? "full" : "reduced");
}

export function readTokens(names) {
  const style = getComputedStyle(document.documentElement);
  const values = {};
  for (const name of names) values[name] = style.getPropertyValue(name).trim();
  return values;
}
