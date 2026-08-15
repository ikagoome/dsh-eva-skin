/**
 * EVA chrome decoration builder: the fixed click-through layer with the
 * Asuka nameplate (top-left), NERV nameplate (top-right), hazard stripes,
 * corner brackets, and status line. Pure static markup (no user data),
 * mounted by the plugin's apply and removed by its effect disposer; styles
 * live in eva.css.ts under the `#dsh-eva-chrome` id.
 */

/** Compact NERV leaf for the NERV nameplate. */
const MINI_LEAF_SVG = `
<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
  <path d="M8 1 C4.6 3.6 2.2 6.8 2.2 10 C2.2 13 4.8 14.8 8 14.6 C11.2 14.8 13.8 13 13.8 10 C13.8 6.8 11.4 3.6 8 1 Z" fill="#ffb300" stroke="#101010" stroke-width="0.9"/>
  <path d="M8 3.5 L8 12" stroke="#101010" stroke-width="0.9"/>
</svg>`

/** The Asuka nameplate markup (EVA-02 number plate + pilot name), top-left. */
const ASUKA_NAME = `
<div class="eva-asuka">
  <span class="unit-num">02</span>
  <span class="name">
    <span class="who">ASUKA</span>
    <span class="role">SECOND CHILD</span>
  </span>
</div>`

/**
 * Build the chrome decoration layer. Appending it is the caller's job; the
 * element carries no interactive content and is inert to pointer events via
 * the stylesheet.
 * @returns the ready-to-mount decoration container.
 */
export function buildEvaChrome(): HTMLDivElement {
  const root = document.createElement('div')
  root.id = 'dsh-eva-chrome'
  root.setAttribute('aria-hidden', 'true')
  root.innerHTML = `
    <div class="eva-hazard top"></div>
    <div class="eva-hazard bottom"></div>
    <span class="eva-corner tl"></span>
    <span class="eva-corner tr"></span>
    <span class="eva-corner bl"></span>
    <span class="eva-corner br"></span>
    ${ASUKA_NAME}
    <div class="eva-nameplate">
      ${MINI_LEAF_SVG}
      <span>NERV</span>
      <span class="eva-unit">UNIT-02</span>
    </div>
    <div class="eva-status">EVA-02 // SYSTEM ONLINE</div>
  `
  return root
}
