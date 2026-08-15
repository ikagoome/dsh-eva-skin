/**
 * EVA chrome decoration builder: the fixed click-through layer with the
 * Asuka nameplate (top-left), NERV nameplate (top-right), hazard stripes,
 * corner brackets, and status line. Pure static markup (no user data),
 * mounted by the plugin's apply and removed by its effect disposer; styles
 * live in eva.css.ts under the `#dsh-eva-chrome` id.
 */
/**
 * Build the chrome decoration layer. Appending it is the caller's job; the
 * element carries no interactive content and is inert to pointer events via
 * the stylesheet.
 * @returns the ready-to-mount decoration container.
 */
export declare function buildEvaChrome(): HTMLDivElement;
//# sourceMappingURL=eva-chrome.d.ts.map