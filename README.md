# SETDA1494 Developer Hub

Dark developer portfolio and distribution hub built with Next.js, TypeScript and Tailwind CSS.

## Phase 1
Responsive developer-OS UI, project index, technology tags, web-game/release placeholders, account UI and locked admin placeholder. Authentication is intentionally not faked in the browser.

## Planned roles
- OWNER: full site administration.
- SYSTEM: scoped service identity for automation; no owner/password/billing authority by default.
- USER: registered account with profile and game-save access.

## Cloud saves
A future authenticated API stores saves by user + game + slot + save version. Games load/save through server-authorized endpoints.

## Artifact storage
Large builds, installers, ISO, 3MF/STL and other binaries stay outside Git. The database stores version, platform, size, SHA-256 and storage key; production downloads use dedicated file/object storage.

## Development
npm run dev
npm run lint
npm run build
