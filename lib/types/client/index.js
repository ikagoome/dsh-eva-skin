import { buildEvaChrome } from "./eva-chrome.js";
import { EVA_CSS } from "./eva.css.js";
import { EVA_TOKEN_OVERRIDES } from "./eva-theme.js";
/** Stable Cordis plugin name. */
export const name = 'ui-eva';
/** Required services: the theme registry (ui-theme) applies the token layer. */
export const inject = ['theme'];
/**
 * Client plugin body: pin the dark scheme, stack the EVA token layer, paint
 * the wallpaper, and mount the chrome decorations.
 * @param ctx - client root context with the theme service available.
 */
export function apply(ctx) {
    // Pin the color scheme to dark: the EVA red-black palette is the point of
    // the plugin, and a light base makes the same token layer read as pastel.
    // 'dark' is a built-in preference, so the switch persists and survives the
    // settings adoption cycle; unload the plugin to restore the user's choice.
    if (ctx.theme.getTheme().preference !== 'dark') {
        ctx.theme.setTheme('dark');
    }
    ctx.effect(() => ctx.theme.overrideTokens('@deepseek-ai/dsh-client-ui-eva', EVA_TOKEN_OVERRIDES), 'ui-eva: token overrides');
    ctx.effect(() => {
        const tag = document.createElement('style');
        tag.dataset.plugin = '@deepseek-ai/dsh-client-ui-eva';
        tag.dataset.pluginCss = 'eva';
        tag.textContent = EVA_CSS;
        document.head.append(tag);
        return () => { tag.remove(); };
    }, 'ui-eva: wallpaper + chrome styles');
    ctx.effect(() => {
        const chrome = buildEvaChrome();
        document.body.append(chrome);
        return () => { chrome.remove(); };
    }, 'ui-eva: chrome decorations');
    // The TRANSMIT tag rides the composer card, which mounts and unmounts with
    // the session surface; a MutationObserver keeps the tag on whichever card
    // is live (one tag, moved between cards, inert to pointer events).
    ctx.effect(() => {
        const tag = document.createElement('span');
        tag.className = 'eva-com-tag';
        tag.textContent = 'TRANSMIT';
        tag.setAttribute('aria-hidden', 'true');
        const sync = () => {
            if (tag.isConnected)
                return;
            const card = document.querySelector('[data-composer-card]');
            if (card !== null)
                card.append(tag);
        };
        const observer = new MutationObserver(sync);
        observer.observe(document.body, { childList: true, subtree: true });
        sync();
        return () => {
            observer.disconnect();
            tag.remove();
        };
    }, 'ui-eva: composer tag');
}
//# sourceMappingURL=index.js.map