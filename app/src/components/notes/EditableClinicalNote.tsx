'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Edit3,
  Check,
  X,
  Copy,
  Download,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

export interface ClinicalNoteSection {
  key: string;
  /** Short label (e.g. "Subjective (S)") */
  label: string;
  /** Plain-English explanation of what this section captures (clinical definition). */
  description: string;
  /** Methodology — what data fields/inputs from the analysis result feed this section. */
  methodology: string;
  /** AI-generated draft text for this section. */
  aiDraft: string;
}

interface EditableClinicalNoteProps {
  /** Session identifier — used to scope localStorage persistence per session. */
  sessionId: string;
  /** Note type identifier ('soap' | 'dap' | future variants). Used in localStorage key. */
  noteType: string;
  /** Display title for the note (e.g. "SOAP Note"). Used in download filename and copy header. */
  noteTitle: string;
  /** Sections in display order. */
  sections: ClinicalNoteSection[];
  /**
   * Format the (possibly edited) section map into the final exportable text.
   * Receives a record of section.key -> resolved text (edit if exists, else aiDraft).
   */
  formatForExport: (resolvedSections: Record<string, string>) => string;
  /** Optional client code to include in download filename. */
  clientCode?: string;
  /** Optional session number to include in download filename. */
  sessionNumber?: number;
  /**
   * When false, the per-section editable cards are hidden. The toolbar (Copy,
   * Download, status text) stays visible. Lets the parent collapse the
   * "wall of section cards" while keeping the export controls available
   * (e.g. when the parent wraps this in a CollapsibleSection).
   * Default: true (show sections).
   */
  showSections?: boolean;
}

/**
 * Editable clinical note panel — preview, edit, persist, copy, download.
 *
 * Persistence is currently localStorage-only (keyed by sessionId + noteType).
 * Switching to Supabase persistence requires only changing `loadEdits` /
 * `saveEdits` to call API routes; the component contract stays identical.
 *
 * The SAME section text is what goes to clipboard / download / view —
 * there's no silent regeneration once the user edits.
 */
export function EditableClinicalNote({
  sessionId,
  noteType,
  noteTitle,
  sections,
  formatForExport,
  clientCode,
  sessionNumber,
  showSections = true,
}: EditableClinicalNoteProps) {
  const storageKey = `sessionlens-note-${noteType}-${sessionId}`;

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [toast, setToast] = useState<{ kind: 'copy' | 'reset' | 'save'; message: string } | null>(null);

  // Load persisted edits on mount / session change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setEdits(parsed);
        }
      } else {
        setEdits({});
      }
    } catch {
      // Ignore corrupted localStorage — fall back to AI drafts
      setEdits({});
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: Record<string, string>) => {
      setEdits(next);
      if (typeof window !== 'undefined') {
        try {
          if (Object.keys(next).length === 0) {
            window.localStorage.removeItem(storageKey);
          } else {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
          }
        } catch {
          // Quota exceeded or storage disabled — silently fail; in-memory state still updates
        }
      }
    },
    [storageKey],
  );

  // Resolve a section's current text: edit override or AI draft
  const resolved = useCallback(
    (key: string): string => {
      if (edits[key] !== undefined) return edits[key];
      return sections.find((s) => s.key === key)?.aiDraft ?? '';
    },
    [edits, sections],
  );

  const fullText = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sections) {
      map[s.key] = resolved(s.key);
    }
    return formatForExport(map);
  }, [sections, resolved, formatForExport]);

  const editedSectionCount = Object.keys(edits).length;

  const showToast = (kind: 'copy' | 'reset' | 'save', message: string) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      showToast('copy', 'Copied to clipboard');
    } catch {
      showToast('copy', 'Copy failed — try selecting the text manually');
    }
  };

  const handleDownload = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const slug = clientCode ? `${clientCode}-` : '';
    const sNum = sessionNumber ? `session${sessionNumber}-` : '';
    const filename = `${slug}${sNum}${noteType}-${stamp}.txt`;

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartEdit = (key: string) => {
    setEditingKey(key);
    setDraftText(resolved(key));
  };

  const handleSave = () => {
    if (!editingKey) return;
    persist({ ...edits, [editingKey]: draftText });
    setEditingKey(null);
    showToast('save', 'Section saved');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setDraftText('');
  };

  const handleResetSection = (key: string) => {
    const next = { ...edits };
    delete next[key];
    persist(next);
    if (editingKey === key) {
      setEditingKey(null);
    }
    showToast('reset', 'Reverted to AI draft');
  };

  const handleResetAll = () => {
    if (editedSectionCount === 0) return;
    const ok = window.confirm(
      `Discard your edits to ${editedSectionCount} section${editedSectionCount === 1 ? '' : 's'} and revert the entire ${noteTitle} to the AI draft?`,
    );
    if (!ok) return;
    persist({});
    setEditingKey(null);
    showToast('reset', `Reverted ${noteTitle} to AI draft`);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">
            {editedSectionCount > 0 ? (
              <>
                <span className="font-medium text-amber-700">
                  {editedSectionCount} section{editedSectionCount === 1 ? '' : 's'} edited
                </span>
                <span className="text-gray-400"> · saved locally</span>
              </>
            ) : (
              <span className="text-gray-400">Showing AI-generated draft. Click any section to edit before exporting.</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editedSectionCount > 0 && (
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset all
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary hover:text-primary transition"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary-dark transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download .txt
          </button>
        </div>
      </div>

      {/* Sections — hidden when parent collapses this panel. Toolbar above
          stays visible so Copy/Download still work in the collapsed state. */}
      {showSections && (
      <div className="space-y-3">
        {sections.map((section) => {
          const isEditing = editingKey === section.key;
          const isEdited = edits[section.key] !== undefined;
          const sectionText = resolved(section.key);

          return (
            <div
              key={section.key}
              className={`rounded-xl border transition-colors ${
                isEditing
                  ? 'border-primary/30 bg-primary/5'
                  : isEdited
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-gray-200 bg-white'
              }`}
            >
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {section.label}
                  </span>
                  <InfoTooltip
                    title={section.label}
                    description={section.description}
                    methodology={section.methodology}
                  />
                  {isEdited && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                      Edited
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium px-2 py-1 rounded hover:bg-green-50 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {isEdited && (
                        <button
                          onClick={() => handleResetSection(section.key)}
                          title="Revert this section to the AI-generated draft"
                          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Revert
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(section.key)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-primary/10 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Section body */}
              <div className="px-4 py-3">
                {isEditing ? (
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={Math.max(4, Math.min(14, draftText.split('\n').length + 1))}
                    autoFocus
                    className="w-full text-sm text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary resize-y font-sans"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sectionText}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast.kind === 'copy' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
          {toast.kind === 'save' && <Check className="w-4 h-4 text-green-400" />}
          {toast.kind === 'reset' && <RotateCcw className="w-4 h-4 text-gray-300" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
