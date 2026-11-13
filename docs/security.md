# Security

Read before a key, a header, or anything a visitor's browser must not hold.

## Security (every build, `integrations/op-system.mjs`)
- The build fails when `dist/` holds a secret key (a private key; an AWS, GitHub, Stripe live, Slack, OpenAI,
  Anthropic, Resend or Supabase secret key; a service_role JWT), naming the file and the kind, never the value:
  Cloudflare then deploys nothing. Never commit a key or put one in `src/`, `public/` or op.config.json: a key the site
  needs lives in Cloudflare (the Worker's Variables and Secrets), read by server code only. A Google API key only warns
  (a browser key, public by design: restricted to the site's domain).
- `dist/_headers` gives every file nosniff, a referrer policy, no camera, microphone or location, frames from the same
  site only and HSTS for a year (no subdomains). A page that needs one otherwise (a map asking for the location, a site
  framed elsewhere): that header in `public/_headers`, which the build then leaves to it. OP System's proxy drops the
  frame and HSTS headers for the review.
