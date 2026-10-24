# Solluce

**Grow with clarity.** A mobile-friendly crop observation and water-planning app for Central Valley growers, built for SierraHacks 2026.

React + Vite on the frontend, Node.js Vercel Functions on the backend, Firebase Authentication and Firestore for accounts and saved records, Gemini for photo analysis, and Open-Meteo for weather.

## Run locally

Use Node.js 22 or newer.

~~~sh
npm install
cp .env.example .env
npm run dev
~~~

Open **http://localhost:5173**. Vite proxies /api to the local API on port 3001. Restart the development command after changing server files or environment variables. The frontend updates automatically. The preview command serves only the production frontend; use the development command or a Vercel deployment to run API requests.

The app works without credentials as a **clearly labeled sample experience**. Guests can use live weather immediately. Real photo analysis requires a Gemini key. Accounts and cloud persistence require Firebase configuration. Missing keys never cause a sample report to be passed off as a live analysis.

## Connect Gemini

1. Create a key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Set **GEMINI_API_KEY** in .env locally and in Vercel’s server environment variables.
3. Set **GEMINI_MODEL** to a multimodal model available to your account. The default is **gemini-3.5-flash**; this is configurable without code changes.
4. Restart the local server or redeploy Vercel after changing environment variables.

**Never name this key VITE_GEMINI_API_KEY.** Variables prefixed with VITE_ are public browser configuration. The .env file is ignored by Git.

The server uses Gemini’s generateContent API with inline image data and a JSON response schema. Both user input and model output are validated with Zod. Unsupported images, missing keys, timeouts, blocked responses, quota errors, and invalid JSON return explicit errors.

## Connect Firebase

1. Create a project in the [Firebase Console](https://console.firebase.google.com/), then register a web app.
2. Copy its web configuration values into the matching **VITE_FIREBASE_*** variables in .env. These identifiers are intended to be public; do not put service-account private keys in any VITE_ variable.
3. Under **Authentication → Sign-in method**, enable **Google** and **Email/Password**.
4. Under **Authentication → Settings → Authorized domains**, add **localhost**, your production Vercel domain, and any preview domain you want to use for sign-in.
5. Create a **Cloud Firestore** database.
6. Deploy the included rules, either by pasting **firestore.rules** into Firestore’s Rules editor and publishing, or with:

~~~sh
npx firebase-tools login
npx firebase-tools deploy --only firestore --project YOUR_FIREBASE_PROJECT_ID
~~~

7. Restart the local app. Create an account and verify that fields, report history, and completed actions persist after refreshing.

Records are scoped to **users/{uid}/fields/{id}** and **users/{uid}/analyses/{id}**. Rules require the authenticated user to own the path. There are no public database reads or writes. Reports are user-owned planning notes, not independently certified records. Original photos are never persisted in Firestore.

Guest access does not create a Firebase account or save field/report data to local storage. Guest state is kept in memory and disappears on reload. Signing in lets the user save the current real report explicitly.

## Deploy through GitHub to Vercel

1. Commit and push this project to your GitHub repository.
2. In Vercel, choose **Add New → Project**, import the repository, and select the **Vite** framework preset. Keep the repository root as the root directory.
3. Use **npm run build** and output directory **dist**; vercel.json already declares them. Use Node.js 22 or 24.
4. Add the environment variables from .env.example. Put the Gemini key in **GEMINI_API_KEY**, and the public Firebase web configuration in the matching **VITE_FIREBASE_*** entries.
5. Deploy, then add the returned domain to Firebase’s authorized domains.
6. Redeploy when changing build-time VITE_ values.

Vercel automatically deploys the three files in **api/** as Node.js functions. Routes use hash navigation (/#check, /#history), so a catch-all rewrite that would interfere with /api/* is unnecessary.

For a public deployment with an active paid Gemini key, enable Vercel Firewall rate limiting on /api/analyze, set a Google API budget/quota, and optionally set **both VITE_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY**. The included per-instance rate limiter is burst protection, not a durable global quota. Turnstile is verified on the server and fails closed.

## What is implemented

- Responsive dashboard, mobile navigation, keyboard access, reduced-motion support, and photo capture from a mobile device.
- A three-step crop check: up to three photos, field/soil/irrigation/stage details, crop condition, grower observations, and a location-confirmed review.
- Client-side photo resizing and metadata removal before sending images to the server.
- Live California city lookup through Open-Meteo; street address resolution through the U.S. Census Geocoder; direct latitude/longitude forecasts for farms without an address. Coordinate-only fields can be saved and reused.
- Server-fetched temperature, rain, wind, sunlight, humidity, and FAO reference evapotranspiration.
- Gemini reports with observations, possible causes, evidence strength, alternatives, verification steps, prioritized actions, and a follow-up timeline. The analysis workspace now includes source-backed counts, a field snapshot, an interactive forecast snapshot, filterable actions with completion progress, expandable evidence, and selectable checkpoints.
- Expandable recommendations and completion tracking.
- An interactive seven-day water budget with colorful daily bars, daily selection, acreage, crop coefficient, and irrigation efficiency controls.
- A forecast explorer with selectable temperature, rainfall, sunshine, and reference evapotranspiration charts. Selecting a day updates a clear reading panel.
- An About Us page describing the mission, product, and team: Parteek Deol, Jacob Fells, Xian Dimaandal, and Dhanesh Gopichandran.
- Google and email/password sign-in, account creation, password reset, sign-out, private saved fields, editable field details, and searchable report history.
- A deterministic, clearly labeled tomato-farm sample for demos before credentials or crop photos are ready.

English/Spanish translation, printable reports, comparison photos, sensor integrations, and measured water-savings tracking are intentionally deferred.

## Water estimate

For each day:

~~~text
crop demand (mm) = forecast ET₀ × adjustable crop coefficient
effective rain (mm) = 0.8 × forecast precipitation
gross irrigation depth (mm) = max(0, crop demand − effective rain) ÷ assumed application efficiency
gallons = gross depth × acres × 1,069.066
~~~

The default coefficient (0.85), efficiencies, and effective-rain fraction are explicit starting assumptions, not measurements or a validated crop-specific schedule. This simple model does not track soil-water storage between days, root depth, runoff, leaching, or actual emitter flow. No automatic run times, pesticide rates, or guaranteed recovery/savings are presented.

Sources: [Open-Meteo forecast documentation](https://open-meteo.com/en/docs), [Census Geocoder](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html), [FAO Paper 56](https://www.fao.org/4/x0490e/x0490e00.htm), [UC Cooperative Extension](https://ucanr.edu/sites/ucanr/County_Offices/).

## Verification

~~~sh
npm test
npm run build
~~~

The automated suite checks request validation, image signatures, water units and assumptions, California geocoding, weather normalization, missing-key behavior, and mocked Gemini success/failure contracts. It does **not** claim to validate crop diagnoses or replace an actual Firebase/Gemini integration check with your credentials.

Before presenting:

- Add your own crop photos and Gemini key, then complete one real analysis.
- Configure Firebase, deploy its rules, and check account creation and persistence across reloads.
- In a second account, verify that the first account’s fields/history are not visible.
- Test Google sign-in on the actual deployed domain.
- Open the sample report if a provider is unavailable; it is explicitly labeled.

## Project map

~~~text
src/App.jsx              App shell, navigation, dashboard, fields and history
src/components/          Crop check, reports, water planner, auth and reusable UI
shared/location.js        Coordinate/address display and weather query helpers
src/lib/                 Firebase client, API client, image preprocessing and sample data
src/styles.css           Responsive visual system
api/                     Vercel health, weather and analysis endpoints
server/                  Local API, provider clients, errors and rate limits
shared/                  Zod contracts and water calculations
tests/                   Node.js integration and calculation tests
firestore.rules          Owner-scoped Firestore security rules
vercel.json              Deployment and security headers
~~~

## Visual assets

The local landscape in **public/images/valley.webp** was generated with the built-in ImageGen tool for this project. It is decorative, Central Valley-inspired imagery, not a photograph of a user’s field. The source output is retained as **public/images/valley.png**.

Exact generation prompt:

> Use case: photorealistic-natural. Asset type: panoramic landscape hero photograph for Solluce, a refined Central Valley farming web app. A beautiful believable California Central Valley farm at golden hour, seen from a slightly elevated viewpoint. Long lush parallel rows of green crops curve gently through the foreground and lead into distant orchards and softly hazy foothills. A small cluster of dark trees at the right edge, expansive soft peach and muted cream sky across the upper quarter. Warm sunlit earth between deep olive green rows, natural detailed texture. Editorial landscape photography, serene and grounded, restrained cinematic warmth, not oversaturated. Wide 16:9 composition, sweeping agricultural geometry with clear space at left for overlay text added later in code. No words, letters, logos, diagrams, watermarks, people or machinery.

Lucide icons and Google Fonts (DM Sans and Manrope) complete the interface; local system-font fallbacks are included.
