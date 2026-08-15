/**
 * EVA artifact diff collector: watches tool results for the diff render
 * intent (the write/edit tools' applied hunks) and keeps the latest
 * before/after per produced path, so clicking a produced-file chip can open
 * the Codex-style panel with the change colored. A read-only observer — it
 * renders from the log and contributes no session events.
 */
import type { ConversationNodeDefinition } from '@deepseek-ai/dsh-client-runtime/client'
import type { DiffHunk } from '@deepseek-ai/dsh-client-ui-primitives'

/** One file's applied change plus the log seq that brought it. */
export interface EvaArtifactDiff extends DiffHunk {
  readonly seq: number
}

/** Latest applied diff per path (last write wins). */
const diffRegistry = new Map<string, EvaArtifactDiff>()

/**
 * @param path - produced file path.
 * @returns the latest applied diff for the path, or undefined when the skin
 * never saw one (the default host opener then keeps working).
 */
export function diffFor(path: string): EvaArtifactDiff | undefined {
  return diffRegistry.get(path)
}

/** Every currently known applied diff, in insertion order. */
export function latestDiffs(): readonly EvaArtifactDiff[] {
  return [...diffRegistry.values()]
}

/** Turn-scoped state: the turn number and the diffs seen inside it. */
interface EvaArtifactsState {
  readonly turn: number
  readonly seen: ReadonlyMap<string, EvaArtifactDiff>
}

/**
 * Narrow a diff-card result view's `diffs` to well-formed hunks. The view
 * crosses the wire, so malformed payloads drop the whole batch rather than
 * crash the engine.
 * @param view - the result view of a tool/result event.
 * @returns the hunks, or null when the view is not a usable diff card.
 */
function resultDiffs(view: { card?: unknown; diffs?: unknown } | null | undefined): EvaArtifactDiff[] | null {
  if (view === null || view === undefined) return null
  if (view.card !== 'diff' || !Array.isArray(view.diffs) || view.diffs.length === 0) return null
  const out: EvaArtifactDiff[] = []
  for (const hunk of view.diffs) {
    if (typeof hunk !== 'object' || hunk === null) continue
    const { path, oldText, newText } = hunk as Record<string, unknown>
    if (typeof path !== 'string' || typeof newText !== 'string') continue
    if (oldText !== null && typeof oldText !== 'string') continue
    out.push({ path, oldText, newText, seq: 0 })
  }
  return out.length === 0 ? null : out
}

/**
 * The per-turn collector: starts at `turn/start`, updates at every
 * `tool/result`, and mirrors applied diffs into the path registry.
 */
export const evaArtifactsDefinition: ConversationNodeDefinition<EvaArtifactsState> = {
  kind: 'eva-artifacts',
  match: (event) => {
    if (event.type === 'turn/start') return { id: String(event.data.turn), role: 'start' }
    if (event.type === 'tool/result') return { id: String(event.data.turn), role: 'update' }
    return null
  },
  start: (context, match) => {
    if (match.event.type !== 'turn/start') throw new Error('eva-artifacts start requires turn/start')
    return { turn: match.event.data.turn, seen: new Map() }
  },
  update: (context, match) => {
    if (match.event.type !== 'tool/result') return context.state
    const diffs = resultDiffs(match.view?.for === 'result' ? match.view.view : null)
    if (diffs === null) return context.state
    const seen = new Map(context.state.seen)
    for (const diff of diffs) {
      const entry = { ...diff, seq: match.event.seq }
      seen.set(diff.path, entry)
      diffRegistry.set(diff.path, entry)
    }
    return { ...context.state, seen }
  },
}
