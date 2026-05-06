import type { Env } from './_middleware';

interface NoteRecord {
  id: string;
  title: string;
  content: string;
  is_pinned: number;
  created_at: string;
  updated_at: string;
}

interface NotePayload {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  isPinned?: unknown;
}

function toNoteResponse(record: NoteRecord) {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    isPinned: Boolean(record.is_pinned),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

async function ensureNotesTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
}

async function listNotes(db: D1Database, userId: string) {
  const result = await db.prepare(`
    SELECT id, title, content, is_pinned, created_at, updated_at
    FROM notes
    WHERE user_id = ?
    ORDER BY is_pinned DESC, updated_at DESC
  `)
    .bind(userId)
    .all<NoteRecord>();

  return (result.results ?? []).map(toNoteResponse);
}

function normalizeTitle(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeContent(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePinned(value: unknown): number {
  return value ? 1 : 0;
}

export const onRequestGet: PagesFunction<Env, string, { userId: string }> = async (context) => {
  await ensureNotesTable(context.env.DB);

  return Response.json({
    success: true,
    notes: await listNotes(context.env.DB, context.data.userId),
  });
};

export const onRequestPost: PagesFunction<Env, string, { userId: string }> = async (context) => {
  await ensureNotesTable(context.env.DB);

  const payload = await context.request.json<NotePayload>();
  const title = normalizeTitle(payload.title);
  const content = normalizeContent(payload.content);
  const isPinned = normalizePinned(payload.isPinned);

  if (!title || !content) {
    return Response.json({ success: false, message: 'タイトルと本文は必須です。' }, { status: 400 });
  }

  if (title.length > 120 || content.length > 4000) {
    return Response.json({ success: false, message: '入力が長すぎます。タイトル120文字、本文4000文字までです。' }, { status: 400 });
  }

  await context.env.DB.prepare(`
    INSERT INTO notes (user_id, title, content, is_pinned, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(context.data.userId, title, content, isPinned)
    .run();

  return Response.json({
    success: true,
    notes: await listNotes(context.env.DB, context.data.userId),
  });
};

export const onRequestPut: PagesFunction<Env, string, { userId: string }> = async (context) => {
  await ensureNotesTable(context.env.DB);

  const payload = await context.request.json<NotePayload>();
  const noteId = typeof payload.id === 'string' ? payload.id : '';
  const title = normalizeTitle(payload.title);
  const content = normalizeContent(payload.content);
  const isPinned = normalizePinned(payload.isPinned);

  if (!noteId || !title || !content) {
    return Response.json({ success: false, message: '更新対象、タイトル、本文は必須です。' }, { status: 400 });
  }

  await context.env.DB.prepare(`
    UPDATE notes
    SET title = ?, content = ?, is_pinned = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `)
    .bind(title, content, isPinned, noteId, context.data.userId)
    .run();

  return Response.json({
    success: true,
    notes: await listNotes(context.env.DB, context.data.userId),
  });
};

export const onRequestDelete: PagesFunction<Env, string, { userId: string }> = async (context) => {
  await ensureNotesTable(context.env.DB);

  const payload = await context.request.json<NotePayload>();
  const noteId = typeof payload.id === 'string' ? payload.id : '';

  if (!noteId) {
    return Response.json({ success: false, message: '削除対象のメモが不正です。' }, { status: 400 });
  }

  await context.env.DB.prepare(`
    DELETE FROM notes
    WHERE id = ? AND user_id = ?
  `)
    .bind(noteId, context.data.userId)
    .run();

  return Response.json({
    success: true,
    notes: await listNotes(context.env.DB, context.data.userId),
  });
};
