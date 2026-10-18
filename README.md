# 30-Ab Punktezähler

Score tracker for the card game **30-Ab** (rules: [Spielregeln.md](Spielregeln.md)).
Installable web app (PWA) that works offline on Android and iPhone. The UI is German.

## Für Spieler: App installieren

1. Link öffnen: `https://funkypanda.github.io/30-ab/`
2. **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“
   **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
3. Die App läuft danach wie eine normale App, auch offline.

Spielstände werden **lokal auf dem Gerät** gespeichert. Über „Datensicherung → Exportieren/Importieren“
auf der Startseite lassen sich die Daten sichern oder auf ein anderes Handy übertragen.

## Scoring rules implemented

| Situation | Points |
|---|---|
| Declarer makes ≥ bid | −(bid + tricks), e.g. 3/3 → −6, 4/5 → −9 |
| Declarer makes < bid | +(bid + 5), e.g. 3 bid → +8 |
| Other player, n ≥ 1 tricks | −n |
| Other player, 0 tricks | +5 |
| Sitting out | ±0 |
| Trump Herz | all of the above ×2 |

- Trump Kreuz: nobody may sit out. Max. 2 players sit out per round, max. 2 rounds in a row; the declarer always plays.
  Players below 7 points must play (limit adjustable under „Einstellungen“, 0 turns the rule off).
- Start score is configurable (default 30). The game ends when someone reaches ≤ 0; lowest score wins.
- Each round is entered as declarer, bid, trump, sit-outs, then tricks per player (the app checks the sum is 5).
  Computed deltas can be overridden; scores can be corrected at any time; past rounds can be edited or deleted.

## Development

```bash
npm install
npm run dev       # dev server
npm test          # unit tests for scoring and rules (Vitest)
npm run build     # production build to dist/
npm run preview   # serve the build at http://localhost:4173/30-ab/
```

Stack: Vite, React, TypeScript, Tailwind CSS, vite-plugin-pwa. No backend; data lives in `localStorage`.

```
src/domain/     pure game logic (scoring, rules, stats) + tests
src/storage/    localStorage persistence, JSON export/import
src/share/      share text, Web Share API with clipboard fallback
src/i18n/de.ts  all German UI strings
src/ui/         screens and shared components
```

## Deployment (GitHub Pages, free)

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.
One-time setup: GitHub repo → **Settings → Pages → Source: GitHub Actions**.
If the repository name changes, update `base` in `vite.config.ts` and the icon paths in `index.html`.
