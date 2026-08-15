/**
 * EVA chrome decoration builders: the fixed click-through layer (hazard
 * stripes, corner brackets, status line) plus the two nameplate elements the
 * plugin anchors onto the sidebar's settings and New Session frames. Pure
 * static markup (no user data), mounted by the plugin's apply and removed by
 * its effect disposers; styles live in eva.css.ts under the `#dsh-eva-chrome`
 * id and the `.eva-*` classes.
 */

/** The Asuka tag content (compact single line: hangs above the frame corner
    without covering the button's own label). */
const ASUKA_NAME = `
  <span class="eva-tag-num">02</span>
  <span class="eva-tag-name">ASUKA</span>`

/** The NERV / UNIT-02 tag content (compact single line, same constraint). */
const NERV_NAME = `
  <span class="eva-tag-name">NERV</span>
  <span class="eva-tag-unit">UNIT-02</span>`

/**
 * Build the chrome decoration layer (no nameplates — those anchor to the
 * sidebar frames). Appending it is the caller's job; the element carries no
 * interactive content and is inert to pointer events via the stylesheet.
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
    <div class="eva-status">EVA-02 // SYSTEM ONLINE</div>
  `
  return root
}

/**
 * Build the Asuka tag element, anchored by apply() onto the New Session
 * frame's top-left corner (hung above the button, clear of its label).
 * @returns the tag element (positioned by the anchored-plate CSS).
 */
export function createAsukaPlate(): HTMLDivElement {
  const plate = document.createElement('div')
  plate.className = 'eva-asuka'
  plate.dataset.evaAnchor = 'new-session'
  plate.innerHTML = ASUKA_NAME
  return plate
}

/**
 * Build the NERV / UNIT-02 tag element, anchored by apply() onto the
 * settings frame's top-left corner (hung above the button, clear of its
 * label).
 * @returns the tag element (positioned by the anchored-plate CSS).
 */
export function createNervPlate(): HTMLDivElement {
  const plate = document.createElement('div')
  plate.className = 'eva-nameplate'
  plate.dataset.evaAnchor = 'settings'
  plate.innerHTML = NERV_NAME
  return plate
}
