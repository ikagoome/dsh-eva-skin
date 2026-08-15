/**
 * Codex-style artifact panel: a right-side EVA plate showing one produced
 * file's applied diff with the changes colored by DiffBlock. Mounted by the
 * skin's apply through react-dom; closed by the ✕ button or Escape.
 */
import { useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DiffBlock, type DiffHunk } from '@deepseek-ai/dsh-client-ui-primitives'
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

/** Render the right-side diff panel for one produced file. */
export function EvaArtifactsPanel({ path, diffs, onClose }: EvaArtifactsPanelProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [onClose])
  return (
    <div id="dsh-eva-artifacts" role="dialog" aria-label={basename(path)}>
      <div className="eva-artifacts-head">
        <span className="eva-artifacts-title">{basename(path)}</span>
        <span className="eva-artifacts-path" title={path}>{path}</span>
        <button type="button" className="eva-artifacts-close" aria-label="close" onClick={onClose}>✕</button>
      </div>
      <div className="eva-artifacts-body">
        <DiffBlock diffs={[...diffs]} maxLines={2000} />
      </div>
    </div>
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
  root.render(<EvaArtifactsPanel path={path} diffs={[diff]} onClose={closeArtifactsPanel} />)
  return true
}
