// Loaded inside the form iframe right after a third-party (e.g. GHL) form
// submission. Its only job is to signal the parent widget so it can transition
// to the success flow. Renders nothing visible — the user sees this for ~50ms
// before the widget swaps the view.
//
// Practices paste the URL to this route into their form provider's
// "Redirect URL after submission" field.

// Two roles:
//   1. Loaded inside the form iframe → posts the signal so the widget can
//      advance to the success flow.
//   2. Loaded top-level (form provider did a `window.top` redirect instead of
//      keeping the navigation inside its iframe) → shows a usable thank-you
//      page so the visitor doesn't see a blank screen.
const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Thank you</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<style>
  html,body{margin:0;padding:0;height:100%;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#0f172a}
  .wrap{min-height:100%;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{max-width:440px;text-align:center;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
  .check{width:48px;height:48px;border-radius:50%;background:#dcfce7;color:#166534;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;font-weight:700}
  h1{font-size:20px;margin:0 0 8px;font-weight:600}
  p{font-size:14px;color:#64748b;margin:0;line-height:1.5}
</style>
</head>
<body>
<div class="wrap"><div class="card">
  <div class="check">&#10003;</div>
  <h1>Thank you</h1>
  <p>Your submission has been received. We&rsquo;ll be in touch shortly.</p>
</div></div>
<script>
  try { window.parent.postMessage('tb:embed-submitted','*'); } catch (e) {}
</script>
</body>
</html>`;

export function GET() {
  return new Response(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Allow this route to be embedded as an iframe on any origin —
      // the form provider's iframe will load it from the practice's site.
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *",
      'Cache-Control': 'public, max-age=300',
    },
  });
}
