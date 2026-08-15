/**
 * EVA theme plugin, browser half: stacks the red-black Evangelion palette
 * (Unit-02 / Asuka) onto the active theme through the theme registry's
 * `overrideTokens` seat, pins the color scheme to dark (the traditional EVA
 * red-black look; built-in preference, so it persists), injects one `<style>`
 * tag painting the Asuka wallpaper plus red glow layers, and mounts the
 * click-through EVA chrome (hazard stripes, corner brackets, status line)
 * while anchoring the NERV and Asuka nameplates onto the sidebar's settings
 * and New Session frames.
 *
 * The override layer is unconditional (until the plugin unloads) and immune
 * to preference adoption: it never touches the theme preference, so the
 * settings-scope adopt cycle cannot retract it, and the theme presenter
 * applies it as inline body variables that outrank every token stylesheet in
 * both palette modes.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the theme plugin's Context merge (ctx.theme).
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { evaArtifactsDefinition } from './eva-artifacts.ts'
import { closeArtifactsPanel, openArtifactsPanel } from './eva-artifacts-panel.tsx'
import { buildEvaChrome, createAsukaPlate, createNervPlate } from './eva-chrome.ts'
import { EVA_CSS } from './eva.css.ts'
import { EVA_TOKEN_OVERRIDES } from './eva-theme.ts'

/** Sidebar anchors for the corner nameplates: shell slot hooks plus the
    hashed-class partials the shipped skins already rely on. */
const SIDEBAR_COLUMN_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"
const SETTINGS_TRIGGER_SELECTOR = "[data-slot='sidebar.settings'] > :is(button, [role='button'])"
const NEW_SESSION_SELECTOR = "button[class*='newSession']"

/** Stable Cordis plugin name. */
export const name = 'ui-eva'

/** Required services: the theme registry (ui-theme) applies the token layer,
    and the conversation event registry feeds the artifact diff collector. */
export const inject = ['theme', 'conversationEvents']

/**
 * Client plugin body: pin the dark scheme, stack the EVA token layer, paint
 * the wallpaper, and mount the chrome decorations.
 * @param ctx - client root context with the theme service available.
 */
export function apply(ctx: ClientContext): void {
  // Pin the color scheme to dark: the EVA red-black palette is the point of
  // the plugin, and a light base makes the same token layer read as pastel.
  // 'dark' is a built-in preference, so the switch persists and survives the
  // settings adoption cycle; unload the plugin to restore the user's choice.
  if (ctx.theme.getTheme().preference !== 'dark') {
    ctx.theme.setTheme('dark')
  }

  // Codex-style artifact diff viewer: collect the write/edit tools' applied
  // hunks per turn (read-only; the registry mirrors them for the panel).
  ctx.effect(() => ctx.conversationEvents.register(evaArtifactsDefinition),
    'ui-eva: artifact diff collector')

  ctx.effect(() => ctx.theme.overrideTokens('@deepseek-ai/dsh-client-ui-eva', EVA_TOKEN_OVERRIDES),
    'ui-eva: token overrides')

  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = '@deepseek-ai/dsh-client-ui-eva'
    tag.dataset.pluginCss = 'eva'
    tag.textContent = EVA_CSS
    document.head.append(tag)
    return () => { tag.remove() }
  }, 'ui-eva: wallpaper + chrome styles')

  ctx.effect(() => {
    const chrome = buildEvaChrome()
    document.body.append(chrome)
    return () => { chrome.remove() }
  }, 'ui-eva: chrome decorations')

  // Anchor the nameplates onto the sidebar frames. React re-renders replace
  // the buttons, so re-sync whenever the sidebar subtree changes (the shell's
  // own skins use the same guarded-observer pattern).
  ctx.effect(() => {
    const asuka = createAsukaPlate()
    const nerv = createNervPlate()
    const sync = (): void => {
      const settings = document.querySelector<HTMLElement>(SETTINGS_TRIGGER_SELECTOR)
      if (settings !== null && nerv.parentElement !== settings) settings.append(nerv)
      const newSession = document.querySelector<HTMLElement>(NEW_SESSION_SELECTOR)
      if (newSession !== null && asuka.parentElement !== newSession) newSession.append(asuka)
    }
    const touchesSidebar = (node: Node): boolean => (
      node instanceof Element
      && (node.matches(SIDEBAR_COLUMN_SELECTOR) || node.querySelector(SIDEBAR_COLUMN_SELECTOR) !== null)
    )
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'childList'
          && [...record.addedNodes, ...record.removedNodes].some(touchesSidebar)) {
          sync()
          return
        }
        const target = record.target
        if (target instanceof Element && target.closest(SIDEBAR_COLUMN_SELECTOR) !== null) {
          sync()
          return
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    sync()
    return () => {
      observer.disconnect()
      asuka.remove()
      nerv.remove()
    }
  }, 'ui-eva: nameplates on sidebar frames')

  // The TRANSMIT tag rides the composer card, which mounts and unmounts with
  // the session surface; a MutationObserver keeps the tag on whichever card
  // is live (one tag, moved between cards, inert to pointer events).
  ctx.effect(() => {
    const tag = document.createElement('span')
    tag.className = 'eva-com-tag'
    tag.textContent = 'TRANSMIT'
    tag.setAttribute('aria-hidden', 'true')
    const sync = (): void => {
      if (tag.isConnected) return
      const card = document.querySelector<HTMLElement>('[data-composer-card]')
      if (card !== null) card.append(tag)
    }
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    sync()
    return () => {
      observer.disconnect()
      tag.remove()
    }
  }, 'ui-eva: composer tag')

  // Clicking a produced-file chip (the deliverables row) opens the right-side
  // diff panel instead of the default host opener. Capture phase stops
  // React's delegated click only when the skin actually holds the diff, so
  // files without diff data keep the original behavior.
  ctx.effect(() => {
    const onCaptureClick = (event: Event): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-produced-files-row]') === null) return
      const chip = target.closest<HTMLElement>('button[title]')
      if (chip === null) return
      if (!openArtifactsPanel(chip.getAttribute('title') ?? '')) return
      event.preventDefault()
      event.stopPropagation()
    }
    document.addEventListener('click', onCaptureClick, true)
    return () => {
      document.removeEventListener('click', onCaptureClick, true)
      closeArtifactsPanel()
    }
  }, 'ui-eva: artifact diff panel')
}
