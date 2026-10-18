# KAVACH — plain HTML / CSS / JS frontend

No React, no build step. Open `index.html` or serve the folder with any static server
(`python3 -m http.server 8080`, nginx, Apache, etc.).

## Pages
| File | Was (React route) |
|---|---|
| index.html | `/` Home |
| features.html · how-it-works.html · raksha-ai.html · security.html | `/features` `/how-it-works` `/raksha-ai` `/security` |
| about.html · download.html · contact.html · get-started.html | `/about` `/download` `/contact` `/get-started` |
| privacy.html · terms.html · 404.html | `/privacy` `/terms` + not-found |
| login.html | `/login` (credentials → 6-digit OTP → redirect by role) |
| dashboard.html | `/user` Bento user dashboard |
| analyst.html | `/analyst` SOC console (overview, alerts, incidents, fleet, collectors, SOAR, URL scanner, Raksha AI) |

## Connecting to your backend
`js/api.js` calls the same `/api/v1/...` endpoints as the React client (auth/login-init, auth/verify-otp,
dashboard/summary, alerts, incidents, devices, collectors, soar, url/scan, raksha/chat).
Serve the frontend behind the same origin / proxy `/api` to FastAPI on :8000, or set before loading api.js:

    <script>window.KAVACH_CONFIG = { apiBase: 'http://127.0.0.1:8000/api/v1', demoFallback: false };</script>

`demoFallback` (default **true**) shows sample data when the backend is unreachable, and accepts OTP `123456`.
**Set it to false in production.**

## Structure
css/style.css (design system + public site) · css/app.css (login + dashboards)
js/main.js (nav, reveal, counters, particle background, tilt) · js/home.js · js/api.js · js/login.js · js/dashboard.js · js/analyst.js
