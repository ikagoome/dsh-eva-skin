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

/** Latest applied hunks per path; one tool result replaces the earlier set. */
const diffRegistry = new Map<string, EvaArtifactDiff[]>()

/**
 * @param path - produced file path.
 * @returns the latest applied hunks for the path, or undefined when the skin
 * never saw any (the default host opener then keeps working).
 */
export function diffFor(path: string): readonly EvaArtifactDiff[] | undefined {
  return diffRegistry.get(path)
}

/** Every currently known applied diff, in insertion order. */
export function latestDiffs(): readonly EvaArtifactDiff[] {
  return [...diffRegistry.values()].flat()
}

/** Turn-scoped state: the turn number and the diff batches seen inside it. */
interface EvaArtifactsState {
  readonly turn: number
  readonly seen: ReadonlyMap<string, readonly EvaArtifactDiff[]>
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
    // A window that starts mid-turn has no turn/start, so state may be absent;
    // the registry mirror still applies (it is per path, not per turn).
    const prior = context.state
    const seen = new Map(prior === undefined ? [] : prior.seen)
    const byPath = new Map<string, EvaArtifactDiff[]>()
    for (const diff of diffs) {
      const entry = { ...diff, seq: match.event.seq }
      const batch = byPath.get(diff.path)
      if (batch === undefined) byPath.set(diff.path, [entry])
      else batch.push(entry)
    }
    for (const [path, batch] of byPath) {
      seen.set(path, batch)
      diffRegistry.set(path, batch)
    }
    return prior === undefined ? context.state : { ...prior, seen }
  },
}

/**
 * Narrow one conversation snapshot's tool-result nodes to the latest diff-card
 * hunks for a produced path. The snapshot covers every node the chat renders,
 * so this finds a chip's change no matter which turn it came from — the
 * collector registry only sees events replayed into the current window.
 * @param snapshot - the session's conversation snapshot, structurally.
 * @param path - produced file path.
 * @returns the latest hunks for the path, or undefined when none are rendered.
 */
export function diffsFromSnapshot(
  snapshot: { legacy?: { nodes?: readonly unknown[] } } | null | undefined,
  path: string,
): readonly DiffHunk[] | undefined {
  const nodes = snapshot?.legacy?.nodes
  if (!Array.isArray(nodes)) return undefined
  let best: DiffHunk[] | undefined
  for (const node of nodes) {
    if (typeof node !== 'object' || node === null) continue
    const record = node as Record<string, unknown>
    if (record.kind !== 'tool-result') continue
    const view = record.resultView as { card?: unknown; diffs?: unknown } | null | undefined
    if (view === null || view === undefined || view.card !== 'diff' || !Array.isArray(view.diffs)) continue
    const hunks: DiffHunk[] = []
    for (const hunk of view.diffs) {
      if (typeof hunk !== 'object' || hunk === null) continue
      const { path: hunkPath, oldText, newText } = hunk as Record<string, unknown>
      if (hunkPath !== path) continue
      if (typeof newText !== 'string') continue
      if (oldText !== null && typeof oldText !== 'string') continue
      hunks.push({ path, oldText, newText })
    }
    if (hunks.length > 0) best = hunks
  }
  return best
}
