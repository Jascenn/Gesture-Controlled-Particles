# EtherBagua

EtherBagua is a browser-based 3D Tai Chi Bagua visualization controlled by
hand gestures. It uses MediaPipe Hands for camera input, React Three Fiber for
the particle scene, and Gemini for optional philosophical interpretations.

## Requirements

- Node.js 22 or newer
- npm
- A camera and a Chromium-based browser for gesture control
- Optional: a Gemini API key for generated interpretations

The app requests camera access. It does not request microphone access.

## Run locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000`. Camera access requires a secure browser context;
`127.0.0.1` is treated as a trusted local origin by modern browsers.

`GEMINI_API_KEY` is optional. Without it, the visual experience still runs and
the oracle returns a static fallback message.

## Verify

```bash
npm run typecheck
npm run build
git diff --check
```

The production build is written to `dist/`.

## Project structure

- `App.tsx` - application layout and providers
- `components/` - camera, particle, oracle, tutorial, and settings UI
- `context/` - interaction and language state
- `services/` - optional Gemini integration
- `utils/` - particle geometry and translations
- `index.html` - browser shell and MediaPipe CDN dependencies

## External dependencies

The browser loads Tailwind CSS, MediaPipe Hands, and an import map from public
CDNs. If those services are unavailable, gesture detection or styling may fail.

## API key security

This is a client-only application. A configured Gemini key is embedded in the
browser bundle and can be extracted by anyone who can load the deployed site.
Use a restricted, low-quota development key only. For a public production
deployment, route Gemini requests through a server-side proxy instead.

## Deployment

The configured production URL is:
https://gesture-controlled-particles.vercel.app

Deployment settings are managed outside this repository. A normal static build
can be deployed from `dist/`.

## License

MIT. See [LICENSE](LICENSE).
