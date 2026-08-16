/**
 * Codex-style artifact panel: a right-side EVA plate showing one produced
 * file's change as full content — the file's current text in white, removed
 * lines in red, added lines in green (aligned against the full text via the
 * hunks' shared context), with the stitched hunk view as fallback when the
 * file cannot be read. Mounted by the skin's apply through react-dom; closed
 * by the ✕ button, Escape, or a click anywhere outside the panel (backdrop).
 * The 固定 (pin) toggle keeps the panel open against backdrop clicks. While a
 * panel is open the center column yields its right edge (body gets the
 * `dsh-eva-panel-open` class) so the plate never overlays the chat.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { DiffHunk } from '@deepseek-ai/dsh-client-ui-primitives'

/** Trailing path segment shown as the panel title. */
function basename(path: string): string {
  const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return at === -1 ? path : path.slice(at + 1)
}

/** Shared plate header: title, optional badge and full path, pin, and close. */
interface EvaArtifactsHeadProps {
  readonly title: string
  readonly path?: string
  readonly badge?: string
  readonly pinned: boolean
  readonly onTogglePin: () => void
  readonly onClose: () => void
}

/** Render the plate header (the 固定 pin sits right before ✕). */
function EvaArtifactsHead({ title, path, badge, pinned, onTogglePin, onClose }: EvaArtifactsHeadProps) {
  return (
    <div className="eva-artifacts-head">
      <span className="eva-artifacts-title">{title}</span>
      {badge !== undefined && <span className="eva-artifacts-badge">{badge}</span>}
      {path !== undefined
        ? <span className="eva-artifacts-path" title={path}>{path}</span>
        : <span className="eva-artifacts-spacer" />}
      <button
        type="button"
        className="eva-artifacts-pin"
        aria-pressed={pinned}
        aria-label={pinned ? '取消固定' : '固定'}
        title={pinned ? '已固定：点击面板外不会关闭' : '固定：点击面板外不会关闭'}
        onClick={onTogglePin}
      >
        {pinned ? '已固定' : '固定'}
      </button>
      <button type="button" className="eva-artifacts-close" aria-label="close" onClick={onClose}>✕</button>
    </div>
  )
}

/** Panel props: the file to show, the close callback, and the content fetcher. */
export interface EvaArtifactsPanelProps {
  readonly path: string
  readonly diffs: readonly DiffHunk[]
  readonly onClose: () => void
  /**
   * Fetch the produced file's current text; resolve null (or reject) when no
   * full content is available and the panel should fall back to the hunk view.
   */
  readonly loadContent?: (path: string) => Promise<string | null>
}

/** One rendered body line and its role. */
interface EvaLine {
  kind: 'ctx' | 'del' | 'add' | 'gap'
  text: string
}

/** The CSS class per line role. */
const LINE_CLASS: Record<EvaLine['kind'], string> = {
  ctx: 'eva-line-ctx',
  del: 'eva-line-del',
  add: 'eva-line-add',
  gap: 'eva-line-gap',
}

/** Split a diff side into content lines (the same terminator rule DiffBlock applies). */
function splitLines(text: string | null): string[] {
  if (text === null || text === '') return []
  const body = text.endsWith('\n') ? text.slice(0, -1) : text
  return body.split('\n')
}

/**
 * Merge one file's hunks into a continuous content view. Each hunk's two
 * sides share the surrounding unchanged context (the tools write them with
 * three context lines), so the common head and tail render once as white
 * context while the removed middle shows red and the added middle green.
 * Consecutive hunks of one patch always leave at least one unchanged line
 * between their context windows, so a dimmed ellipsis marks the omitted
 * stretch; overlapping windows (defensive) dedupe by suffix match instead.
 * @param diffs - the file's hunks, in file order.
 * @returns the rendered body lines.
 */
function stitchLines(diffs: readonly DiffHunk[]): EvaLine[] {
  const out: EvaLine[] = []
  let first = true
  for (const diff of diffs) {
    const oldLines = splitLines(diff.oldText)
    const newLines = splitLines(diff.newText)
    let lead = 0
    while (lead < oldLines.length && lead < newLines.length && oldLines[lead] === newLines[lead]) lead++
    let trail = 0
    while (
      trail < oldLines.length - lead
      && trail < newLines.length - lead
      && oldLines[oldLines.length - 1 - trail] === newLines[newLines.length - 1 - trail]
    ) trail++
    const leadCtx = newLines.slice(0, lead)
    const trailCtx = newLines.slice(newLines.length - trail)
    if (!first) {
      let skip = 0
      while (
        skip < leadCtx.length
        && out.length - skip > 0
        && out[out.length - 1 - skip].kind === 'ctx'
        && out[out.length - 1 - skip].text === leadCtx[leadCtx.length - 1 - skip]
      ) skip++
      if (skip > 0) {
        for (const line of leadCtx.slice(0, leadCtx.length - skip)) out.push({ kind: 'ctx', text: line })
      } else {
        out.push({ kind: 'gap', text: '⋯' })
        for (const line of leadCtx) out.push({ kind: 'ctx', text: line })
      }
    } else {
      for (const line of leadCtx) out.push({ kind: 'ctx', text: line })
    }
    for (const line of oldLines.slice(lead, oldLines.length - trail)) out.push({ kind: 'del', text: line })
    for (const line of newLines.slice(lead, newLines.length - trail)) out.push({ kind: 'add', text: line })
    for (const line of trailCtx) out.push({ kind: 'ctx', text: line })
    first = false
  }
  return out
}

/** One line of the full-content view. */
interface MarkedLine {
  kind: 'ctx' | 'add'
  text: string
}

/** The full-content view: marked lines plus red blocks inserted before a line. */
interface MarkedContent {
  lines: MarkedLine[]
  /** Red blocks, each rendered right before the line at `at`. */
  removals: { at: number; lines: string[] }[]
  added: number
  removed: number
}

/** Locate the contiguous run `needle` in `haystack` at or after `from`; -1 when absent. */
function findRun(haystack: readonly string[], needle: readonly string[], from: number): number {
  if (needle.length === 0) return from
  outer: for (let at = from; at + needle.length <= haystack.length; at++) {
    for (let k = 0; k < needle.length; k++) {
      if (haystack[at + k] !== needle[k]) continue outer
    }
    return at
  }
  return -1
}

/**
 * Mark the full file text with the hunks' changes: every line renders white by
 * default; the added middle of each matched hunk turns green, and the removed
 * middle is collected as a red block inserted where the change sits. A hunk
 * whose context no longer matches the current text (the file moved on since
 * the write) is skipped — its region just stays white.
 * @param content - the file's current text.
 * @param diffs - the file's hunks, in file order.
 * @returns the marked lines and removal blocks.
 */
function markFullContent(content: string, diffs: readonly DiffHunk[]): MarkedContent {
  // The tool diffs are LF-normalized; normalize the file text the same way so
  // CRLF files (the Windows norm) still align with their hunks.
  const fileLines = content.replace(/\r\n/g, '\n').split('\n')
  const lines: MarkedLine[] = fileLines.map((text) => ({ kind: 'ctx', text }))
  const removals: { at: number; lines: string[] }[] = []
  let cursor = 0
  let added = 0
  let removed = 0
  for (const diff of diffs) {
    const oldLines = splitLines(diff.oldText)
    const newLines = splitLines(diff.newText)
    let lead = 0
    while (lead < oldLines.length && lead < newLines.length && oldLines[lead] === newLines[lead]) lead++
    let trail = 0
    while (
      trail < oldLines.length - lead
      && trail < newLines.length - lead
      && oldLines[oldLines.length - 1 - trail] === newLines[newLines.length - 1 - trail]
    ) trail++
    const addLines = newLines.slice(lead, newLines.length - trail)
    const delLines = oldLines.slice(lead, oldLines.length - trail)
    const at = findRun(fileLines, newLines, cursor)
    if (at === -1) continue
    cursor = at + newLines.length
    if (addLines.length > 0) {
      for (let i = at + lead; i < at + lead + addLines.length; i++) {
        const line = lines[i]
        if (line !== undefined) line.kind = 'add'
      }
      added += addLines.length
    }
    if (delLines.length > 0) {
      removals.push({ at: at + lead, lines: delLines })
      removed += delLines.length
    }
  }
  return { lines, removals, added, removed }
}

/** Render the marked full-content view, inserting red blocks before their line. */
function renderMarked(marked: MarkedContent): ReactNode[] {
  const removalsByAt = new Map<number, string[]>()
  for (const removal of marked.removals) {
    const existing = removalsByAt.get(removal.at)
    if (existing === undefined) removalsByAt.set(removal.at, [...removal.lines])
    else existing.push(...removal.lines)
  }
  const out: ReactNode[] = []
  marked.lines.forEach((line, index) => {
    const red = removalsByAt.get(index)
    if (red !== undefined) {
      red.forEach((text, k) => {
        out.push(<div key={`del-${index}-${k}`} className="eva-line-del">{text}</div>)
      })
    }
    out.push(<div key={index} className={line.kind === 'add' ? 'eva-line-add' : 'eva-line-ctx'}>{line.text}</div>)
  })
  const tail = removalsByAt.get(marked.lines.length)
  if (tail !== undefined) {
    tail.forEach((text, k) => {
      out.push(<div key={`del-tail-${k}`} className="eva-line-del">{text}</div>)
    })
  }
  return out
}

/** Render the right-side diff panel for one produced file. */
export function EvaArtifactsPanel({ path, diffs, onClose, loadContent }: EvaArtifactsPanelProps) {
  const [pinned, setPinned] = useState(false)
  const [fullText, setFullText] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    if (loadContent === undefined) {
      setFullText(null)
      return
    }
    let cancelled = false
    setFullText(undefined)
    const run = (): void => {
      Promise.resolve()
        .then(() => loadContent(path))
        .then(
          (text) => { if (!cancelled) setFullText(text) },
          () => { if (!cancelled) setFullText(null) },
        )
    }
    try {
      run()
    } catch {
      if (!cancelled) setFullText(null)
    }
    return () => { cancelled = true }
  }, [path, loadContent])
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])
  const view = useMemo(() => {
    if (fullText !== null && fullText !== undefined && fullText !== '') {
      const marked = markFullContent(fullText, diffs)
      return { kind: 'full' as const, marked }
    }
    if (fullText === null && diffs.length === 0) return { kind: 'error' as const }
    return { kind: 'hunks' as const, lines: stitchLines(diffs) }
  }, [fullText, diffs])
  const added = view.kind === 'full'
    ? view.marked.added
    : view.kind === 'hunks' ? view.lines.filter((line) => line.kind === 'add').length : 0
  const removed = view.kind === 'full'
    ? view.marked.removed
    : view.kind === 'hunks' ? view.lines.filter((line) => line.kind === 'del').length : 0
  return (
    <>
      <div
        id="dsh-eva-artifacts-backdrop"
        onClick={pinned ? undefined : onClose}
        aria-hidden="true"
      />
      <div id="dsh-eva-artifacts" role="dialog" aria-label={basename(path)}>
        <EvaArtifactsHead
          title={basename(path)}
          path={path}
          badge={view.kind === 'full' ? '全文' : undefined}
          pinned={pinned}
          onTogglePin={() => { setPinned(value => !value) }}
          onClose={onClose}
        />
        <div className="eva-artifacts-body">
          <div className="eva-artifacts-lines">
            {view.kind === 'full' ? (
              renderMarked(view.marked)
            ) : view.kind === 'error' ? (
              <div className="eva-line-ctx eva-artifacts-empty">无法读取文件内容（文件可能已被删除、过大或为二进制）</div>
            ) : view.lines.length === 0 ? (
              <div className="eva-line-ctx eva-artifacts-empty">（空文件）</div>
            ) : (
              view.lines.map((line, index) => (
                <div key={index} className={LINE_CLASS[line.kind]}>{line.text}</div>
              ))
            )}
          </div>
        </div>
        {view.kind !== 'error' && <div className="eva-artifacts-footer">└ +{added} -{removed}</div>}
      </div>
    </>
  )
}

/** Mount/close state owned by the skin's apply. */
let host: HTMLDivElement | null = null
let root: Root | null = null

/**
 * The body class marking an open panel; the stylesheet squeezes the app's
 * center column right edge under it so the plate never overlays the chat.
 */
export const PANEL_OPEN_CLASS = 'dsh-eva-panel-open'

/** Close the artifact panel if open (also releases the layout squeeze). */
export function closeArtifactsPanel(): void {
  root?.unmount()
  root = null
  host?.remove()
  host = null
  document.body.classList.remove(PANEL_OPEN_CLASS)
}

/** Open a panel root: mount the host div and claim the layout squeeze. */
function mountPanel(element: ReactNode): void {
  closeArtifactsPanel()
  host = document.createElement('div')
  document.body.append(host)
  document.body.classList.add(PANEL_OPEN_CLASS)
  root = createRoot(host)
  root.render(element)
}

/**
 * Open the artifact panel for one produced path. Always opens (returns true):
 * the panel fetches the file's current text for the full-content view and
 * colors the change when `diffs` are provided; without content and without
 * diffs it shows a read-failure state instead of a silent dead click.
 * @param path - produced file path.
 * @param diffs - the file's hunks, when known (may be empty).
 * @param loadContent - optional fetcher for the file's current text.
 * @returns whether the panel opened.
 */
export function openArtifactsPanel(
  path: string,
  diffs: readonly DiffHunk[] | undefined,
  loadContent?: (path: string) => Promise<string | null>,
): boolean {
  mountPanel(<EvaArtifactsPanel path={path} diffs={diffs ?? []} onClose={closeArtifactsPanel} loadContent={loadContent} />)
  return true
}

/** Props for the produced-files picker shown by an overflowing row's "+N". */
export interface EvaArtifactsListProps {
  /** The turn's full produced path list, in first-seen order. */
  readonly paths: readonly string[]
  readonly onClose: () => void
  /** Called with a picked path; the list then closes itself. */
  readonly onPick: (path: string) => void
}

/** Render the produced-files picker: one clickable row per produced path. */
export function EvaArtifactsList({ paths, onClose, onPick }: EvaArtifactsListProps) {
  const [pinned, setPinned] = useState(false)
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])
  return (
    <>
      <div
        id="dsh-eva-artifacts-backdrop"
        onClick={pinned ? undefined : onClose}
        aria-hidden="true"
      />
      <div id="dsh-eva-artifacts" role="dialog" aria-label="produced files">
        <EvaArtifactsHead
          title="产物文件"
          badge={`${paths.length} 个`}
          pinned={pinned}
          onTogglePin={() => { setPinned(value => !value) }}
          onClose={onClose}
        />
        <div className="eva-artifacts-body eva-artifacts-list">
          {paths.map((path) => (
            <button
              key={path}
              type="button"
              className="eva-artifacts-file"
              title={path}
              onClick={() => { onPick(path) }}
            >
              <span className="eva-artifacts-file-name">{basename(path)}</span>
              <span className="eva-artifacts-file-path">{path}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

/** Open the produced-files picker for one turn's full path list. */
export function openArtifactsList(
  paths: readonly string[],
  onPick: (path: string) => void,
): void {
  mountPanel(<EvaArtifactsList paths={paths} onClose={closeArtifactsPanel} onPick={onPick} />)
}
