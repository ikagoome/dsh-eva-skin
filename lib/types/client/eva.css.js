/**
 * EVA stylesheet text: the fixed full-viewport wallpaper, two red glow
 * gradients, and the click-through chrome decorations (hazard stripes,
 * corner brackets, Asuka and NERV nameplates, status line). The image rides
 * as a data URI so the bundle is self-contained (no extra static route, no
 * dist rebuild). Regenerate the data file with
 * `pnpm --filter @deepseek-ai/dsh-client-ui-eva run embed` after swapping
 * `assets/asuka.jpg`. Surface translucency lives in the EVA theme tokens
 * (eva-theme.ts), not here — the theme presenter applies them as inline body
 * variables that outrank stylesheets.
 */
import { ASUKA_JPG_DATA_URI } from "./asuka.data.js";
/**
 * The stylesheet the plugin injects. Glow layers paint above the wallpaper
 * (top-right and bottom-left red radial gradients); the image layer is last
 * with `cover` sizing, the glows tile the viewport. The chrome rules target
 * the fixed `#dsh-eva-chrome` container the plugin mounts.
 */
export const EVA_CSS = `
/* EVA wallpaper and red atmosphere behind every app surface. */
html {
  background-color: #140a0e;
  background-image:
    radial-gradient(1200px 800px at 80% -10%, rgba(255, 51, 85, 0.2), transparent 60%),
    radial-gradient(1000px 700px at -10% 110%, rgba(200, 30, 58, 0.13), transparent 55%),
    url('${ASUKA_JPG_DATA_URI}');
  background-size: auto, auto, cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}

/* The shell paints body with the base token; let the html layer show. */
html body {
  background: transparent;
}

/* ── EVA chrome: fixed click-through decoration layer above app content,
      below the frame overlay layer (z-index 20) ─────────────────────────── */
#dsh-eva-chrome {
  position: fixed;
  inset: 0;
  z-index: 15;
  pointer-events: none;
  font-family: var(--dsw-font-family, 'Segoe UI', 'Microsoft YaHei', sans-serif);
}

/* Yellow-black hazard stripes, top and bottom edge. */
#dsh-eva-chrome .eva-hazard {
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: repeating-linear-gradient(-45deg, #ffd500 0 14px, #101010 14px 28px);
}
#dsh-eva-chrome .eva-hazard.top { top: 0; }
#dsh-eva-chrome .eva-hazard.bottom { bottom: 0; }

/* Red L-shaped corner brackets. */
#dsh-eva-chrome .eva-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid #ff3355;
}
#dsh-eva-chrome .eva-corner.tl { top: 7px; left: 7px; border-right: none; border-bottom: none; }
#dsh-eva-chrome .eva-corner.tr { top: 7px; right: 7px; border-left: none; border-bottom: none; }
#dsh-eva-chrome .eva-corner.bl { bottom: 7px; left: 7px; border-right: none; border-top: none; }
#dsh-eva-chrome .eva-corner.br { bottom: 7px; right: 7px; border-left: none; border-top: none; }

/* Asuka pilot nameplate, top-left: red-bordered EVA-02 number plate with
   the pilot's name — the mirror of the NERV nameplate on the right. */
#dsh-eva-chrome .eva-asuka {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 8px;
  background: rgba(12, 6, 9, 0.88);
  border: 1px solid rgba(255, 51, 85, 0.65);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  font-family: var(--dsw-font-family, 'Segoe UI', 'Microsoft YaHei', sans-serif);
}
#dsh-eva-chrome .eva-asuka .unit-num {
  color: #ff3355;
  font-size: 16px;
  font-weight: 800;
  font-style: italic;
  line-height: 1;
  padding: 2px 6px;
  border: 1px solid rgba(255, 51, 85, 0.8);
  background: rgba(255, 51, 85, 0.08);
}
#dsh-eva-chrome .eva-asuka .name {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
#dsh-eva-chrome .eva-asuka .who {
  color: #f8f0f1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
}
#dsh-eva-chrome .eva-asuka .role {
  color: #ffd500;
  font-size: 8px;
  letter-spacing: 1.5px;
}

/* NERV / UNIT-02 nameplate, top-right, cut-corner mechanical plate. */
#dsh-eva-chrome .eva-nameplate {
  position: absolute;
  top: 9px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 8px;
  background: rgba(12, 6, 9, 0.88);
  border: 1px solid rgba(255, 51, 85, 0.65);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  color: #ffd500;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}
#dsh-eva-chrome .eva-nameplate .eva-unit {
  color: #ff3355;
  font-style: italic;
  letter-spacing: 1px;
}

/* Status line, bottom-right, monospace. */
#dsh-eva-chrome .eva-status {
  position: absolute;
  right: 14px;
  bottom: 10px;
  color: rgba(255, 51, 85, 0.75);
  font-family: Consolas, 'SF Mono', 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
}

/* ── Composer card (the message input capsule): EVA treatment ──────────────
   The card carries the stable data-composer-card attribute (ui-conversation
   InputBar). Red-tinted stroke, red glow on focus, a yellow-black hazard
   strip across the top padding band, and the TRANSMIT tag hung on the
   card's outer top edge (injected as .eva-com-tag by the plugin). */
[data-composer-card] {
  border-color: rgba(255, 82, 105, 0.4);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

[data-composer-card]:focus-within {
  border-color: rgba(255, 51, 85, 0.85);
  box-shadow:
    0 0 0 1px rgba(255, 51, 85, 0.3),
    0 0 22px rgba(255, 51, 85, 0.25),
    var(--dsw-shadow-lv2);
}

/* Hazard strip in the card's top padding band (10px); the draft starts below
   it, so text never collides. */
[data-composer-card]::before {
  content: '';
  position: absolute;
  top: 5px;
  left: 16px;
  right: 16px;
  height: 3px;
  border-radius: 2px;
  background: repeating-linear-gradient(-45deg, #ffd500 0 12px, #101010 12px 24px);
  opacity: 0.9;
  pointer-events: none;
}

/* TRANSMIT tag: hung on the card's outer top edge, click-through. */
.eva-com-tag {
  position: absolute;
  top: -17px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px 2px;
  background: rgba(12, 6, 9, 0.9);
  border: 1px solid rgba(255, 51, 85, 0.6);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
  color: #ffd500;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  pointer-events: none;
  z-index: 1;
}

/* Live-dot before the tag text. */
.eva-com-tag::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ff3355;
  box-shadow: 0 0 5px rgba(255, 51, 85, 0.9);
}
`.trim();
//# sourceMappingURL=eva.css.js.map