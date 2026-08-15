# dsh-eva-skin

Evangelion skin for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web GUI — an EVA red-black theme (Unit-02 / Asuka) with the Asuka wallpaper, chrome decorations, and a themed message composer.

[中文说明](README.zh.md)

## Features

- **EVA red-black theme** — token layer applied through the theme registry's `overrideTokens` seat (inline body variables, outranks every stylesheet): translucent dark-red surfaces, EVA red `#ff3355` accents, warm-white text, red borders, amber warnings, EVA-green success. The plugin pins the color scheme to dark so the palette never reads as pastel; unload the plugin to restore the previous preference.
- **Asuka wallpaper** — the full-viewport background image (data-URI embedded in the bundle, no static route needed) with two red glow gradients.
- **Chrome decorations** — click-through fixed layer (z-index 15): the `02 / ASUKA / SECOND CHILD` pilot nameplate, the `NERV / UNIT-02` nameplate, yellow-black hazard stripes top and bottom, red corner brackets, and an `EVA-02 // SYSTEM ONLINE` monospace status line.
- **Composer treatment** — the message input capsule gets a red-tinted stroke with a red glow on focus, a yellow-black hazard strip in its top padding band, and a `TRANSMIT` tag on its outer top edge.

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

The script links this checkout into `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-client-ui-eva` (the profile module fallback) and registers the `ui-eva` row in `$DSH_HOME/profiles/<profile>/cordis.patch.yml` (default profile: `web`, pass another name as the first argument). Then **refresh the GUI page (F5)**.

> The running server hot-mounts new rows from the user patch layer; if the skin does not appear, restart `dsh web` and refresh.

### Manual install (any platform)

1. Copy this package to `packages/client/ui-eva` in the harness checkout.
2. Register the three surfaces (see `packages/client/AGENTS.md` in the harness): a `tsconfig.client.json` reference, a dependency in `packages/bundle/web-app/package.json`, and a row in the web profile's `cordis.patch.yml`:

   ```yaml
   - insert:
       - id: ui-eva
         name: '@deepseek-ai/dsh-client-ui-eva'
   ```

3. Build the bundle: `pnpm --filter @deepseek-ai/dsh-client-ui-eva run bundle` (requires the harness toolchain, see below).

## Customizing

- **Wallpaper** — replace `assets/asuka.jpg`, then `pnpm run embed` (regenerates `src/client/asuka.data.ts`) and rebuild.
- **Palette** — `src/client/eva-theme.ts` (DARK and LIGHT blocks, one section per token group).
- **Decorations** — markup in `src/client/eva-chrome.ts`; styles in the `#dsh-eva-chrome` and composer blocks of `src/client/eva.css.ts`.

## Building from source

The bundle is built with the harness's shared `tsdown.client.ts` preset, so building from this standalone repo requires a `deepseek-harness` checkout: drop the package at `packages/client/ui-eva`, then from the repo root run

```sh
pnpm install
pnpm exec tsc -b packages/client/ui-eva/tsconfig.json
pnpm --filter @deepseek-ai/dsh-client-ui-eva run bundle
```

## Uninstall

Remove the `ui-eva` rows from `$DSH_HOME/profiles/*/cordis.patch.yml` and delete the `profiles/node_modules/@deepseek-ai/dsh-client-ui-eva` link, then refresh the GUI (or restart `dsh web`).

## Notes

- `assets/asuka.jpg` is fan art of the Evangelion character Asuka; if you publish or redistribute this skin, keep the image licensing in mind.
- The skin is presentation-only: it renders no tool, registers no command, and contributes no session events — the model-visible surface of the GUI is unchanged.

## License

MIT
