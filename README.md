# dsh-eva-skin

Evangelion skin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web GUI — an EVA red-black theme (Unit-02 / Asuka) with the Asuka wallpaper, sidebar chrome, a themed composer, and a Codex-style artifact diff viewer.

[中文说明](README.zh.md)

## Preview

![dsh-eva-skin preview](assets/preview.png)

## Features

- **EVA red-black theme** — token layer applied through the theme registry's `overrideTokens` seat (inline body variables, outrank every stylesheet): translucent dark-red surfaces, EVA red `#ff3355` accents, warm-white text, red borders, amber warnings, EVA-green success. The plugin pins the color scheme to dark so the palette never reads as pastel; unload the plugin to restore the previous preference.
- **Asuka wallpaper** — the full-viewport background image (data-URI embedded in the bundle, no static route needed) with two red glow gradients.
- **Sidebar chrome** — click-through fixed layer (z-index 15): yellow-black hazard stripes top and bottom, red corner brackets, and an `EVA-02 // SYSTEM ONLINE` monospace status line. The sidebar's New Session and settings buttons get EVA plates (red-bordered, translucent dark, content centered) with compact `02 ASUKA` / `NERV UNIT-02` tags hanging just above their top-left corners, clear of the buttons' own labels. The workspace tree's folder glyphs become a red EVA-style butterfly (rotated 30°), and the HARNESS badge in the brand wordmark is knocked out in the plate ink so it stays legible.
- **Composer treatment** — the message input capsule gets a red-tinted stroke with a red glow on focus, a yellow-black hazard strip in its top padding band, and a `TRANSMIT` tag on its outer top edge.
- **Artifact diff viewer** — Codex-style: after each modification, click a produced-file chip (the file list at the end of a turn) to open a right-side EVA panel. The panel shows the file's current full content with a real line-number gutter — every line in white monospace, only the removed lines tint red and the added lines green (diff data from the session, found by path across any turn) — fetched through the bundled `eva-files` server companion (loopback route reading the file from disk); a file that cannot be read falls back to the stitched hunk view or a read-failure note. When a row overflows into a "+N" remainder, clicking it opens a picker listing every produced file of that turn, each row opening the same panel. A 固定 (pin) toggle next to ✕ keeps the plate open against outside clicks (✕ and Esc always close). Pinning also makes the backdrop transparent and click-through, so the main window keeps its brightness and the chat stays fully operable while the plate floats on the right; unpinning restores the dim, click-to-dismiss backdrop. While a plate is open the app's center column yields its right edge, so the chat is pushed left instead of being overlapped; closing restores it.

## Requirements

- A `deepseek-harness` checkout whose `dsh web` GUI you run (the skin mounts through the web profile's user patch layer).
- The plugin's built bundle ships in `lib/` — no build needed to use it.

## Install

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

### macOS / Linux

```bash
./install.sh
```

The script links this checkout into `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-client-ui-eva` and its server companion into `@deepseek-ai/dsh-eva-files` (the profile module fallback), and registers the `ui-eva` and `eva-files` rows in `$DSH_HOME/profiles/<profile>/cordis.patch.yml` (default profile: `web`, pass another name as the first argument). Then **refresh the GUI page (F5)**.

> The running server hot-mounts new rows from the user patch layer; if the skin does not appear, restart `dsh web` and refresh. The `eva-files` companion serves the produced file's current text to the diff panel over a loopback route; it must stay mounted for the full-content view.

### Manual install (any platform)

1. Copy this package to `packages/client/ui-eva` in the harness checkout.
2. Register the three surfaces (see `packages/client/AGENTS.md` in the harness): a `tsconfig.client.json` reference, a dependency in `packages/bundle/web-app/package.json`, and a row in the web profile's `cordis.patch.yml`:

   ```yaml
   - insert:
       - id: ui-eva
         name: '@deepseek-ai/dsh-client-ui-eva'
       - id: eva-files
         name: '@deepseek-ai/dsh-eva-files'
   ```

3. Build the bundle: `pnpm --filter @deepseek-ai/dsh-client-ui-eva run bundle` (requires the harness toolchain, see below).

## Usage

- **Apply the skin** — refresh the GUI page (F5 / Ctrl+F5). New installs and updates hot-reload through the running server's patch watch; if nothing changes, restart `dsh web`.
- **View a change** — after the agent edits or creates files, the turn ends with produced-file chips; click one to open the diff panel on the right. The panel shows the file's current full content with its real line numbers — every line in white, only the changed lines tinted red (removed) / green (added) — fetched through the `eva-files` companion route with diff data from the session; when the file cannot be read (deleted, binary, oversized) it falls back to the hunk view or a read-failure note. A row that overflows shows a "+N" remainder: click it to list every produced file of the turn, and click a name to open that file. By default a click outside the plate closes it; use the 固定 (pin) button next to ✕ to keep it open — pinned plates stop dimming and let clicks pass through, so you can keep reading the diff while interacting with the chat (✕ and Esc always close). While the plate is open the chat column is pushed left to make room, and closing restores it.
- **Other skins** — while this plugin is active, one skin at a time is expected; disable or remove this plugin's `ui-eva` row to restore your previous theme preference and other skins' chrome.

## Project layout

```
dsh-eva-skin/
├── src/                          # the skin package (@deepseek-ai/dsh-client-ui-eva)
│   ├── index.ts                  #   node half: deliberately empty apply (the loader needs
│   │                             #     a resolvable entry to scan the dsh.client declaration)
│   ├── invariant.ts              #   harness invariant companion (no-op installer)
│   └── client/                   #   browser half, bundled into lib/client.js
│       ├── index.ts              #     entry: theme pin, token overrides, style injection,
│       │                         #     chrome mount, nameplate anchors, artifact-panel wiring
│       ├── eva-theme.ts          #     token overrides (the red-black palette)
│       ├── eva.css.ts            #     every stylesheet: wallpaper, chrome, panels, composer
│       ├── eva-chrome.ts         #     decoration layer + sidebar tag markup
│       ├── asuka.data.ts         #     wallpaper data URI (generated by scripts/embed-image.mjs)
│       ├── eva-artifacts.ts      #     diff collector + conversation-snapshot diff lookup
│       └── eva-artifacts-panel.tsx  # produced-file panel and "+N" overflow picker
├── files/                        # server companion (@deepseek-ai/dsh-eva-files, node-only)
│   ├── src/index.ts              #   /eva-files/content loopback route (file text from disk)
│   └── lib/index.js              #   built companion
├── lib/                          # committed build output — no build needed to use the skin
│   ├── client.js (+ .map)        #   browser bundle
│   ├── index.js                  #   node half
│   └── invariant.js              #   invariant companion
├── assets/
│   ├── asuka.jpg                 #   wallpaper source image (fan art)
│   └── preview.png               #   README preview screenshot
├── scripts/embed-image.mjs       # wallpaper → data-URI embedder (`pnpm run embed`)
├── install.ps1 / install.sh      # link + patch-row installer for both packages
├── tsdown.config.ts              # build config (harness tsdown.client.ts preset)
└── tsconfig.json
```

## Customizing

- **Wallpaper** — replace `assets/asuka.jpg`, then `pnpm run embed` (regenerates `src/client/asuka.data.ts`) and rebuild.
- **Palette** — `src/client/eva-theme.ts` (DARK and LIGHT blocks, one section per token group).
- **Corner tags** — position and size in `src/client/eva.css.ts` (`.eva-asuka[data-eva-anchor]`, `.eva-nameplate[data-eva-anchor]`; both hang at `top: -16px; left: 6px`); markup in `src/client/eva-chrome.ts`.
- **Sidebar frames** — the New Session / settings button plates in `eva.css.ts` (`button[class*='newSession']` and `[data-slot='sidebar.settings'] > button` rules).
- **Folder butterfly** — the data-URI SVG in `eva.css.ts` (`span[class*='folder']:has(svg)` rule; the rotation is a `rotate(30)` group transform).
- **Diff panel** — component `src/client/eva-artifacts-panel.tsx`; styles in the `#dsh-eva-artifacts` block of `eva.css.ts`; the read-only diff collector in `src/client/eva-artifacts.ts`; the full-content route in the `files/` companion package (`files/src/index.ts`).
- **Other decorations** — markup in `src/client/eva-chrome.ts`; styles in the `#dsh-eva-chrome` and composer blocks of `src/client/eva.css.ts`.

## Building from source

The bundle is built with the harness's shared `tsdown.client.ts` preset, so building from this standalone repo requires a `deepseek-harness` checkout: drop the package at `packages/client/ui-eva`, then from the repo root run

```sh
pnpm install
pnpm --filter @deepseek-ai/dsh-client-ui-eva run bundle
```

Both halves compile straight from `src/` — the node half (`lib/index.js`, `lib/invariant.js`) and the browser bundle (`lib/client.js`) — so no separate `tsc` pass is needed. The `files/` companion builds the same way from its own directory (plain `tsdown` config).

## Uninstall

Remove the `ui-eva` and `eva-files` rows from `$DSH_HOME/profiles/*/cordis.patch.yml` and delete the `profiles/node_modules/@deepseek-ai/dsh-client-ui-eva` and `profiles/node_modules/@deepseek-ai/dsh-eva-files` links, then refresh the GUI (or restart `dsh web`).

## Notes

- `assets/asuka.jpg` is fan art of the Evangelion character Asuka; if you publish or redistribute this skin, keep the image licensing in mind.
- The skin is presentation-only: it renders no tool, registers no command, and contributes no session events — the model-visible surface of the GUI is unchanged. The artifact viewer only reads the session log's applied diffs, plus (through the `eva-files` companion) the produced file's current text from disk; that route answers only on the Web server's bind host (loopback by default) and rejects directories, binaries, and files over 2 MiB.

## License

MIT
