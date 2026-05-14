// Loaded inside the form iframe right after a third-party (e.g. GHL) form
// submission. Its only job is to signal the parent widget so it can transition
// to the success flow. Renders nothing visible — the user sees this for ~50ms
// before the widget swaps the view.
//
// Practices paste the URL to this route into their form provider's
// "Redirect URL after submission" field.

const HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Submitted</title>
<meta name="robots" content="noindex,nofollow">
<style>html,body{margin:0;padding:0;background:transparent}</style>
</head>
<body>
<script>try{window.parent.postMessage('tb:embed-submitted','*');}catch(e){}</script>
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
