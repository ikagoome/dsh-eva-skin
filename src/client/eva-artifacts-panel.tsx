/**
 * Codex-style artifact panel: a right-side EVA plate showing one produced
 * file's change as a full-content view — unchanged lines in white, removed
 * lines in red, added lines in green, the omitted stretch between hunks
 * dimmed. Mounted by the skin's apply through react-dom; closed by the ✕
 * button, Escape, or a click anywhere outside the panel (the backdrop).
 */
import { useEffect, useMemo } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { DiffHunk } from '@deepseek-ai/dsh-client-ui-primitives'
import { diffFor } from './eva-artifacts.ts'

/** Trailing path segment shown as the panel title. */
function basename(path: string): string {
  const at = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return at === -1 ? path : path.slice(at + 1)
}

/** Panel props: the file to show and the close callback. */
export interface EvaArtifactsPanelProps {
  readonly path: string
  readonly diffs: readonly DiffHunk[]
  readonly onClose: () => void
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

/** Render the right-side diff panel for one produced file. */
export function EvaArtifactsPanel({ path, diffs, onClose }: EvaArtifactsPanelProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])
  const lines = useMemo(() => stitchLines(diffs), [diffs])
  const added = lines.filter((line) => line.kind === 'add').length
  const removed = lines.filter((line) => line.kind === 'del').length
  return (
    <>
      <div id="dsh-eva-artifacts-backdrop" onClick={onClose} aria-hidden="true" />
      <div id="dsh-eva-artifacts" role="dialog" aria-label={basename(path)}>
        <div className="eva-artifacts-head">
          <span className="eva-artifacts-title">{basename(path)}</span>
          <span className="eva-artifacts-path" title={path}>{path}</span>
          <button type="button" className="eva-artifacts-close" aria-label="close" onClick={onClose}>✕</button>
        </div>
        <div className="eva-artifacts-body">
          <div className="eva-artifacts-lines">
            {lines.length === 0 ? (
              <div className="eva-line-ctx eva-artifacts-empty">（空文件）</div>
            ) : (
              lines.map((line, index) => (
                <div key={index} className={LINE_CLASS[line.kind]}>{line.text}</div>
              ))
            )}
          </div>
        </div>
        <div className="eva-artifacts-footer">└ +{added} -{removed}</div>
      </div>
    </>
  )
}

/** Mount/close state owned by the skin's apply. */
let host: HTMLDivElement | null = null
let root: Root | null = null

/** Close the artifact panel if open. */
export function closeArtifactsPanel(): void {
  root?.unmount()
  root = null
  host?.remove()
  host = null
}

/**
 * Open the artifact panel for one produced path; a no-op when the skin holds
 * no diff for it (the default host open keeps working in that case).
 * @param path - produced file path.
 * @returns whether the panel opened.
 */
export function openArtifactsPanel(path: string): boolean {
  const diff = diffFor(path)
  if (diff === undefined) return false
  closeArtifactsPanel()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  root.render(<EvaArtifactsPanel path={path} diffs={diff} onClose={closeArtifactsPanel} />)
  return true
}
