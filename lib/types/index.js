/**
 * EVA theme plugin, node half.
 *
 * Deliberately empty: the EVA theme and wallpaper are pure browser-side
 * effects (theme registration into ui-theme's registry plus one stylesheet),
 * so the host half registers nothing. The node half still exists because the
 * package must resolve as a loader entry for its `dsh.client` declaration to
 * be scanned into the boot graph.
 */
/** Host plugin body — the browser half owns the whole behavior. */
export function apply() { }
//# sourceMappingURL=index.js.map