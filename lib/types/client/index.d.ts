/**
 * EVA theme plugin, browser half: stacks the red-black Evangelion palette
 * (Unit-02 / Asuka) onto the active theme through the theme registry's
 * `overrideTokens` seat, pins the color scheme to dark (the traditional EVA
 * red-black look; built-in preference, so it persists), injects one `<style>`
 * tag painting the Asuka wallpaper plus red glow layers, and mounts the
 * click-through EVA chrome decorations (NERV leaf, hazard stripes,
 * nameplate, status line).
 *
 * The override layer is unconditional (until the plugin unloads) and immune
 * to preference adoption: it never touches the theme preference, so the
 * settings-scope adopt cycle cannot retract it, and the theme presenter
 * applies it as inline body variables that outrank every token stylesheet in
 * both palette modes.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Stable Cordis plugin name. */
export declare const name = "ui-eva";
/** Required services: the theme registry (ui-theme) applies the token layer. */
export declare const inject: string[];
/**
 * Client plugin body: pin the dark scheme, stack the EVA token layer, paint
 * the wallpaper, and mount the chrome decorations.
 * @param ctx - client root context with the theme service available.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map