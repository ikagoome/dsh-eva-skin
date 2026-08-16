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
import type { DiffHunk } from '@deepseek-ai/dsh-client-ui-primitives'
// Type-only: pulls the theme plugin's Context merge (ctx.theme).
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import { evaArtifactsDefinition, diffFor, diffsFromSnapshot, latestDiffs } from './eva-artifacts.ts'
import { closeArtifactsPanel, openArtifactsList, openArtifactsPanel } from './eva-artifacts-panel.tsx'
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
    the conversation event registry feeds the artifact diff collector, and the
    sessions service (runtime) supplies the session snapshot and cwd for the
    artifact panel's content fetch. */
export const inject = ['theme', 'conversationEvents', 'sessions']

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
  // diff panel. Every chip opens the panel (never a silent dead click): the
  // panel fetches the file's current text through the eva-files route for the
  // full-content view, and diff data comes from the collector registry or the
  // conversation snapshot (the snapshot covers every rendered chip, even from
  // turns outside the collector's replayed window).
  ctx.effect(() => {
    const loadContent = (path: string): Promise<string | null> => {
      try {
        const state = ctx.sessions.list.getSnapshot()
        const current = state.current
        const cwd = current === undefined ? undefined : state.byId[current]?.cwd
        const query = new URLSearchParams({ path })
        if (cwd !== undefined) query.set('cwd', cwd)
        return fetch(`/eva-files/content?${query.toString()}`, { cache: 'no-store' })
          .then(async (res) => {
            if (!res.ok) return null
            const body = await res.json() as { content?: unknown }
            return typeof body.content === 'string' ? body.content : null
          })
          .catch(() => null)
      } catch {
        return Promise.resolve(null)
      }
    }
    const resolveDiffs = (path: string): readonly DiffHunk[] | undefined => {
      const fromRegistry = diffFor(path)
      if (fromRegistry !== undefined) return fromRegistry
      try {
        const state = ctx.sessions.list.getSnapshot()
        const current = state.current
        if (current === undefined) return undefined
        const face = ctx.sessions.binding(current)?.session
        if (face === undefined) return undefined
        return diffsFromSnapshot(face.getSnapshot(), path)
      } catch {
        return undefined
      }
    }
    // The turn's full produced-path list, from the timeline's per-turn
    // deliverables data — the same source the produced-files row renders from.
    const producedPathsForRow = (el: HTMLElement): string[] => {
      try {
        const tail = el.closest<HTMLElement>('[data-turn-tail]')
        if (tail === null) return []
        const turnNumber = Number(tail.getAttribute('data-turn-tail'))
        if (!Number.isFinite(turnNumber)) return []
        const state = ctx.sessions.list.getSnapshot()
        const current = state.current
        if (current === undefined) return []
        const face = ctx.sessions.binding(current)?.session
        const snapshot = face?.getSnapshot()
        const turn = snapshot?.chat?.timeline?.turns?.get(turnNumber)
        if (turn === undefined) return []
        const data = (turn.data as unknown as { get: (key: string) => unknown }).get('deliverables')
        const produced = (data as { produced?: unknown } | undefined)?.produced
        if (!Array.isArray(produced)) return []
        return produced
          .map((item) => (item as { path?: unknown }).path)
          .filter((path): path is string => typeof path === 'string')
      } catch {
        return []
      }
    }
    const onCaptureClick = (event: Event): void => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-produced-files-row]') === null) return
      // The overflow remainder ("+N 个文件") opens the picker with the whole
      // turn's produced paths; each row there reopens the artifact panel.
      const more = target.closest<HTMLElement>('[class*="more"]')
      if (more !== null) {
        const paths = producedPathsForRow(more)
        if (paths.length > 0) {
          openArtifactsList(paths, (path) => {
            openArtifactsPanel(path, resolveDiffs(path), loadContent)
          })
          event.preventDefault()
          event.stopPropagation()
        }
        return
      }
      const chip = target.closest<HTMLElement>('button[title]')
      if (chip === null) return
      const path = chip.getAttribute('title') ?? ''
      if (path === '') return
      openArtifactsPanel(path, resolveDiffs(path), loadContent)
      event.preventDefault()
      event.stopPropagation()
    }
    document.addEventListener('click', onCaptureClick, true)
    return () => {
      document.removeEventListener('click', onCaptureClick, true)
      closeArtifactsPanel()
    }
  }, 'ui-eva: artifact diff panel')

  // Debug aid: expose the panel surface for console probing (window.__evaDebug).
  Object.assign(window, {
    __evaDebug: {
      openArtifactsPanel, closeArtifactsPanel, diffFor, latestDiffs,
      sessionsState: (): unknown => {
        try {
          return { has: !!ctx.sessions, list: !!(ctx.sessions && ctx.sessions.list) }
        } catch (error) {
          return { threw: String(error) }
        }
      },
      probeFetch: async (path: string): Promise<unknown> => {
        try {
          const state = ctx.sessions.list.getSnapshot()
          const current = state.current
          const cwd = current === undefined ? undefined : state.byId[current]?.cwd
          const query = new URLSearchParams({ path })
          if (cwd !== undefined) query.set('cwd', cwd)
          const url = `/eva-files/content?${query.toString()}`
          const res = await fetch(url, { cache: 'no-store' })
          return { status: res.status, url, current }
        } catch (error) {
          return { threw: String(error) }
        }
      },
    },
  })
}
