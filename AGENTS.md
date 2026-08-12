# sukuyo-compatibility agent notes

This repository is a static HTML/CSS/JavaScript app, not a Next.js app.

- Main entry point: `index.html`
- Auxiliary pages: `senseiban.html`, `sukuyo-about.html`
- Capacitor/iOS sync target: `www/`
- Deployment: Vercel static site with `framework: null`

Do not introduce a build step or framework dependency without confirming the project direction first.
