/**
 * Consult Builder attribution helper.
 *
 * Drop into the <head> of every page on your site:
 *   <script src="https://www.consultintake.com/track.js" defer></script>
 *
 * Captures utm_*, gclid, fbclid, referrer, and landing_page on the
 * visitor's FIRST page of a browser session and persists them in
 * sessionStorage. Never overwrites once set — the original capture
 * survives subsequent navigation within the same session, so UTMs that
 * land on /spring-offer aren't lost when the visitor clicks to /consult
 * and submits the form there.
 *
 * The consult-builder widget reads sessionStorage["tb_attribution"]
 * before falling back to the current page URL.
 */
(function () {
  if (typeof window === 'undefined') return;
  var KEY = 'tb_attribution';
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (sessionStorage.getItem(KEY)) return;

    var params = new URLSearchParams(window.location.search);
    var data = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      gclid: params.get('gclid'),
      fbclid: params.get('fbclid'),
      referrer: document.referrer || null,
      landing_page: window.location.href,
      captured_at: new Date().toISOString(),
    };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // sessionStorage may be unavailable (privacy mode, sandboxed contexts).
    // Silently no-op; widget falls back to URL/referrer at submit time.
  }
})();
