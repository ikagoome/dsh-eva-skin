/**
 * EVA token override layer: alias-token overrides for the red-black
 * Evangelion palette (Unit-02 / Asuka), applied through the theme registry's
 * `overrideTokens` seat so the theme presenter writes them as inline body
 * variables (outranking every token stylesheet) regardless of the active
 * built-in theme. Both palette modes are mandatory values so the layer stays
 * coherent when the user switches color scheme.
 */
import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
/**
 * The EVA override layer: every overridden token carries both palette modes.
 * DARK and LIGHT are declared with the same key set, so the lookup below is
 * structurally total; the cast records that pairing for the checker.
 * Object.freeze keeps the layer immutable after construction.
 */
export declare const EVA_TOKEN_OVERRIDES: ThemeTokenOverrides;
//# sourceMappingURL=eva-theme.d.ts.map