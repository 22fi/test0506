import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import './NotesPage.css';

interface Note {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteFormState {
  title: string;
  content: string;
  isPinned: boolean;
}

const EMPTY_FORM: NoteFormState = {
  title: '',
  content: '',
  isPinned: false,
};

function formatDateTime(value: string): string {
  return new Date(value.endsWith('Z') ? value : `${value}Z`).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function excerpt(text: string): string {
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  async function loadNotes() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', { credentials: 'include' });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'メモの取得に失敗しました。');
      }

      setNotes(json.notes);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'メモの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadNotes();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  function resetComposer() {
    setSelectedNoteId(null);
    setForm(EMPTY_FORM);
  }

  function selectNote(note: Note) {
    setSelectedNoteId(note.id);
    setForm({
      title: note.title,
      content: note.content,
      isPinned: note.isPinned,
    });
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const payload = {
      id: selectedNoteId,
      title: form.title,
      content: form.content,
      isPinned: form.isPinned,
    };

    const method = selectedNoteId ? 'PUT' : 'POST';

    try {
      const response = await fetch('/api/notes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'メモの保存に失敗しました。');
      }

      setNotes(json.notes);
      setMessage(selectedNoteId ? 'メモを更新しました。' : 'メモを追加しました。');

      if (selectedNoteId) {
        const latestNote = json.notes.find((note: Note) => note.id === selectedNoteId) ?? null;
        if (latestNote) {
          selectNote(latestNote);
        }
      } else {
        resetComposer();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'メモの保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedNoteId) {
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: selectedNoteId }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'メモの削除に失敗しました。');
      }

      setNotes(json.notes);
      resetComposer();
      setMessage('メモを削除しました。');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'メモの削除に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main animate-fade-in notes-page">
          <div className="notes-header">
            <div>
              <p className="notes-eyebrow">Notes</p>
              <h1 className="notes-title">あとで使う情報をすぐ残す</h1>
              <p className="notes-description">
                再開ポイント、買い物メモ、ちょっとした下書きを、一覧と編集フォームの2カラムで管理できます。
              </p>
            </div>
            <button className="btn btn-ghost" onClick={resetComposer}>
              新しいメモ
            </button>
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="notes-grid">
            <section className="card notes-list-panel">
              <div className="notes-panel-header">
                <div>
                  <h2>メモ一覧</h2>
                  <p>{notes.length}件のメモがあります。</p>
                </div>
              </div>

              {isLoading ? (
                <p className="text-muted">メモを読み込んでいます...</p>
              ) : notes.length === 0 ? (
                <div className="notes-empty">
                  <strong>まだメモがありません。</strong>
                  <p>右側のフォームから最初のメモを追加してください。</p>
                </div>
              ) : (
                <div className="notes-list">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      className={`note-card${note.id === selectedNoteId ? ' active' : ''}`}
                      onClick={() => selectNote(note)}
                    >
                      <div className="note-card-top">
                        <strong>{note.title}</strong>
                        {note.isPinned && <span className="note-badge">Pinned</span>}
                      </div>
                      <p>{excerpt(note.content)}</p>
                      <small>更新: {formatDateTime(note.updatedAt)}</small>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="card notes-editor-panel">
              <div className="notes-panel-header">
                <div>
                  <h2>{selectedNote ? 'メモを編集' : '新しいメモ'}</h2>
                  <p>{selectedNote ? '内容を更新すると一覧に反映されます。' : '短いメモでも長文でも保存できます。'}</p>
                </div>
              </div>

              <form className="notes-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="note-title">タイトル</label>
                  <input
                    id="note-title"
                    className="form-input"
                    placeholder="例: 明日の買い物"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="note-content">本文</label>
                  <textarea
                    id="note-content"
                    className="form-input notes-textarea"
                    placeholder="思いついた内容をそのまま残せます。"
                    value={form.content}
                    onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  />
                </div>

                <label className="notes-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isPinned}
                    onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))}
                  />
                  <span>上部に固定する</span>
                </label>

                <div className="notes-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving || !form.title.trim() || !form.content.trim()}
                  >
                    {isSaving ? '保存中...' : selectedNote ? '更新する' : '追加する'}
                  </button>
                  {selectedNote && (
                    <button type="button" className="btn btn-ghost" onClick={handleDelete} disabled={isSaving}>
                      削除する
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
