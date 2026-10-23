# Matroshka

A free Russian-learning web app with stories, vocabulary, audio, quizzes, slang, idioms, grammar, and practice activities. It includes 1,556 lessons, including 228 stories. Choose your level from A1 through C1 on the dashboard; each library tab opens at that level. Progress, bookmarks, and your preferred level are saved in your browser.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. All lesson data and audio needed by the app are included in this repository, so no APKs or preparation scripts are required.

## Build

```sh
npm run build
npm run preview
```

The production site is generated in `dist/` and can be served as a static website. The app has no account, paywall, or paid API. Guided chats and missions use local prompts and hints; they do not provide live AI replies.
