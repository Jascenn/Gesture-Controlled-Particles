# Contributing

## Development setup

```bash
npm ci
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
git diff --check
```

Test camera-dependent changes in a browser with camera permission enabled.
Check the browser console for MediaPipe and WebGL errors.

## Branches and commits

- Create short-lived branches from `main`, for example `fix/camera-selection`.
- Use Conventional Commits, for example `fix: restore the Vite entry point`.
- Keep each pull request focused on one problem.
- Do not commit API keys, camera recordings, generated build output, or local
  environment files.

## Pull requests

Describe the motivation, scope, verification evidence, user impact, and
rollback plan. Link related issues with `Closes #123`.

By contributing, you agree that your contribution is licensed under the
repository's MIT License.
