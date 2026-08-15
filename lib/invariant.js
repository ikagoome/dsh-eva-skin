//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-eva`.
* @module @deepseek-ai/dsh-client-ui-eva/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-eva";
/** Cordis companion plugin name. */
const name = "client-ui-eva-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the plugin holds no mutable state — its theme
* registration lifecycle is owned by the theme registry (dispose returns the
* built-in pair), and the wallpaper is a deterministic style-tag side effect
* whose lifecycle the module system already owns (claimStyles inventory, HMR
* style removal).
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
