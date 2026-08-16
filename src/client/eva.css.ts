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
import { ASUKA_JPG_DATA_URI } from './asuka.data.ts'

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

/* Anchored nameplates: compact single-line tags hung just above the frames'
   top-left corners (New Session and settings buttons) so the buttons' own
   labels stay fully visible; click-through. Both frames share one offset so
   the two rows keep the same proportions. */
.eva-asuka[data-eva-anchor],
.eva-nameplate[data-eva-anchor] {
  position: absolute;
  top: -16px;
  left: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  background: rgba(12, 6, 9, 0.9);
  border: 1px solid rgba(255, 51, 85, 0.65);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
  font-family: var(--dsw-font-family, 'Segoe UI', 'Microsoft YaHei', sans-serif);
  color: #ffd500;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  pointer-events: none;
  z-index: 1;
}
.eva-asuka[data-eva-anchor] .eva-tag-num {
  color: #ff3355;
  font-style: italic;
  font-weight: 800;
}
.eva-nameplate[data-eva-anchor] .eva-tag-unit {
  color: #ff3355;
  font-style: italic;
}

/* Rail state hides the corner tags: a 56px rail has no room for the plates. */
[data-sidebar-collapsed] .eva-asuka[data-eva-anchor],
[data-sidebar-collapsed] .eva-nameplate[data-eva-anchor] {
  display: none;
}

/* EVA frames around the sidebar's settings and New Session buttons; the
   anchored nameplates hang off their top-left corners (the shell buttons
   clip by default, so overflow reopens for the hanging tags). The settings
   content centers like the New Session row so the corner tag never overlaps
   the gear and label. */
[data-slot='sidebar.settings'] > :is(button, [role='button']),
button[class*='newSession'] {
  position: relative;
  overflow: visible;
  justify-content: center;
  background: rgba(12, 6, 9, 0.88);
  border: 1px solid rgba(255, 51, 85, 0.65);
  border-radius: 4px;
}
[data-slot='sidebar.settings'] > :is(button, [role='button']):is(:hover, :focus-visible),
button[class*='newSession']:is(:hover, :focus-visible) {
  background: rgba(30, 14, 20, 0.95);
  border-color: rgba(255, 51, 85, 0.9);
}

/* The HARNESS badge blanks under the EVA layer: its plate inherits the light
   sidebar ink while the glyphs' token (label-primary-inverted) is also light
   (the red toast needs it). Knock the glyphs out in the plate's foreground
   ink so the badge reads. */
button[class*='brand'] [clip-path*='badge-clip'] path {
  fill: var(--dsw-alias-label-primary-foreground, #12080c);
}

/* Workspace tree: the project folder glyph becomes a red EVA-style butterfly
   (bright red upper wings, deeper red lower wings, dark body and antennae).
   The folder svg is hidden and the butterfly draws in its place (a true
   glyph swap, not an overlay), so the row's CSS hover swap to the chevron
   and the click-to-expand behavior stay untouched. */
:is([data-pane='sidebar'], [class*='sidebarCol']) span[class*='folder']:has(svg) {
  background: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%20width='16'%20height='16'%3E%3Cg%20transform='translate%288%208%29%20rotate%2830%29%20scale%280.9%29%20translate%28-8%20-8%29'%3E%3Cpath%20d='M7.9%206.6%20C7.7%203.6%205.7%202%202.9%202.5%20C2.5%205.1%203.5%207.1%205.7%207.7%20C6.7%208%207.4%207.4%207.9%206.6%20Z'%20fill='%23ff3355'/%3E%3Cpath%20d='M8.1%206.6%20C8.3%203.6%2010.3%202%2013.1%202.5%20C13.5%205.1%2012.5%207.1%2010.3%207.7%20C9.3%208%208.6%207.4%208.1%206.6%20Z'%20fill='%23ff3355'/%3E%3Cpath%20d='M7.8%209.1%20C6.6%209.2%204.9%209.3%203.8%2010.5%20C4.4%2012.4%206.1%2013.1%207.6%2012.5%20C7.9%2011.3%207.9%2010.2%207.8%209.1%20Z'%20fill='%23c81e3a'/%3E%3Cpath%20d='M8.2%209.1%20C9.4%209.2%2011.1%209.3%2012.2%2010.5%20C11.6%2012.4%209.9%2013.1%208.4%2012.5%20C8.1%2011.3%208.1%2010.2%208.2%209.1%20Z'%20fill='%23c81e3a'/%3E%3Cpath%20d='M7.85%205.4%20C8.2%206.7%208.2%2010.8%207.85%2012.5%20C7.5%2010.8%207.5%206.7%207.85%205.4%20Z'%20fill='%23120a0e'/%3E%3Cpath%20d='M7.8%205.5%20C7.6%204.1%207%203.2%206.1%202.8'%20fill='none'%20stroke='%23120a0e'%20stroke-width='0.7'%20stroke-linecap='round'/%3E%3Cpath%20d='M8.2%205.5%20C8.4%204.1%209%203.2%209.9%202.8'%20fill='none'%20stroke='%23120a0e'%20stroke-width='0.7'%20stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E")
    center / 16px 16px no-repeat;
}
:is([data-pane='sidebar'], [class*='sidebarCol']) span[class*='folder']:has(svg) svg {
  display: none;
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

/* ── Codex-style artifact panel: right-side EVA plate showing one produced
      file's change as a full-content view — unchanged lines white, removed
      lines red, added lines green. A dim backdrop behind the plate closes it
      on any click outside; the plate itself stays fully interactive. ──────── */
#dsh-eva-artifacts-backdrop {
  position: fixed;
  inset: 0;
  z-index: 29;
  background: rgba(10, 4, 7, 0.32);
}
#dsh-eva-artifacts {
  position: fixed;
  top: 56px;
  right: 14px;
  bottom: 14px;
  width: min(440px, calc(100vw - 40px));
  z-index: 30;
  display: flex;
  flex-direction: column;
  background: rgba(16, 7, 11, 0.97);
  border: 1px solid rgba(255, 51, 85, 0.6);
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 8px 30px rgba(0, 0, 0, 0.5);
  font-family: var(--dsw-font-family, 'Segoe UI', 'Microsoft YaHei', sans-serif);
  overflow: hidden;
}
#dsh-eva-artifacts::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: repeating-linear-gradient(-45deg, #ffd500 0 14px, #101010 14px 28px);
  pointer-events: none;
}
#dsh-eva-artifacts .eva-artifacts-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(255, 51, 85, 0.25);
}
#dsh-eva-artifacts .eva-artifacts-title {
  flex: none;
  color: #f8f0f1;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  white-space: nowrap;
}
#dsh-eva-artifacts .eva-artifacts-path {
  flex: 1;
  min-width: 0;
  color: rgba(255, 179, 0, 0.8);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#dsh-eva-artifacts .eva-artifacts-close {
  flex: none;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 51, 85, 0.5);
  border-radius: 4px;
  background: rgba(255, 51, 85, 0.08);
  color: #ff3355;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
#dsh-eva-artifacts .eva-artifacts-close:hover {
  background: rgba(255, 51, 85, 0.22);
}
#dsh-eva-artifacts .eva-artifacts-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 12px;
}

/* Full-content diff body: the whole known content renders as white code text
   (monospace, no soft-wrap so indentation survives), only the removed lines
   tint red and the added lines green; a dimmed ellipsis marks the stretch a
   multi-hunk patch omits between changes. */
#dsh-eva-artifacts .eva-artifacts-lines {
  font-family: Consolas, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
}
#dsh-eva-artifacts .eva-line-ctx {
  color: #f6eff2;
}
#dsh-eva-artifacts .eva-line-del {
  color: #ffb3c0;
  background: rgba(255, 51, 85, 0.18);
}
#dsh-eva-artifacts .eva-line-add {
  color: #a9f3c6;
  background: rgba(52, 211, 153, 0.16);
}
#dsh-eva-artifacts .eva-line-gap {
  color: rgba(246, 239, 242, 0.3);
  letter-spacing: 4px;
}
#dsh-eva-artifacts .eva-artifacts-empty {
  color: rgba(246, 239, 242, 0.4);
}
#dsh-eva-artifacts .eva-artifacts-footer {
  flex: none;
  padding: 6px 12px 8px;
  border-top: 1px solid rgba(255, 51, 85, 0.25);
  color: rgba(246, 239, 242, 0.55);
  font-family: Consolas, 'SF Mono', 'JetBrains Mono', monospace;
  font-size: 11px;
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
`.trim()
