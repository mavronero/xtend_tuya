/** SPA navigation inside the current dashboard: push the URL and let HA's
 * router pick it up (the standard custom-card pattern). */
export function navigate(path: string): void {
  const base = window.location.pathname.split("/")[1] || "lovelace";
  window.history.pushState(null, "", path.startsWith("/") ? path : `/${base}/${path}`);
  window.dispatchEvent(new Event("location-changed"));
}
