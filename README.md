# SRS Flashcard

A minimal, offline flashcard app with **spaced repetition (SRS)**. All data stays on your device—no account or backend.

## Features

- **Local decks & cards** — Create decks, add and edit cards (front/back).
- **Spaced repetition** — SM-2–style scheduling (Again / Hard / Good / Easy).
- **Review queue** — Study due cards; new cards get their first schedule when you rate them.
- **Import / export** — Full backup as JSON; export deck as CSV; import JSON or CSV.
- **Optional TTS** — “Speak” button in review (Web Speech API) when available.
- **Electron** — Run as a desktop app (Windows, macOS, Linux).
- **React Native (Expo)** — iOS, Android, and web in `mobile/`.

## Tech stack

- **TypeScript** (strict) + **Vite**
- **Vanilla TS** UI, no framework
- **localStorage** for persistence
- **Vitest** for unit tests
- **Electron** for the desktop build

## Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (browser at http://localhost:5173) |
| `npm run build` | Type-check and production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run electron` | Run the app in Electron (run `npm run build` first) |
| `npm run electron:dev` | Vite + Electron with hot reload |

## Running the app

**In the browser**

```bash
npm run dev
```

Then open http://localhost:5173.

**As a desktop app**

```bash
npm run build
npm run electron
```

For development with live reload:

```bash
npm run electron:dev
```

**React Native (Expo) app**

```bash
cd mobile
npm install
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go. See `mobile/README.md` for details.

## Project structure

```
├── electron/
│   └── main.cjs          # Electron main process
├── mobile/               # React Native (Expo) app
│   ├── src/
│   │   ├── core/         # types, srs, storage (AsyncStorage)
│   │   ├── screens/      # DeckList, DeckDetail, Review
│   │   └── navigation.tsx
│   └── App.tsx
├── src/
│   ├── main.ts           # App entry, view routing
│   ├── types.ts          # Card, Deck, ReviewRecord, CardSchedule
│   ├── srs.ts            # SRS algorithm (schedule, due queue)
│   ├── storage.ts        # localStorage layer
│   ├── import-export.ts  # JSON/CSV export & import
│   ├── tts.ts            # Optional text-to-speech
│   ├── style.css
│   └── views/
│       ├── deck-list.ts
│       ├── deck-detail.ts
│       └── review.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── PLAN.md               # Phased implementation plan
```

## License

Private / unlicensed.
