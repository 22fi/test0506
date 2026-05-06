// functions/api/auth/register.ts
import bcrypt from 'bcryptjs';
import type { Env } from '../_middleware';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { email?: string; username?: string; password?: string; inviteCode?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: 'リクエストが不正です' }, { status: 400 });
  }

  const { email, username, password, inviteCode } = body;

  // バリデーション
  if (!email || !username || !password || !inviteCode) {
    return Response.json({ success: false, message: 'すべての項目を入力してください' }, { status: 400 });
  }

  // 招待コード検証
  if (inviteCode !== env.INVITE_CODE) {
    return Response.json({ success: false, message: '招待コードが無効です' }, { status: 403 });
  }

  // メール形式チェック
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ success: false, message: 'メールアドレスの形式が正しくありません' }, { status: 400 });
  }

  // パスワード強度チェック（8文字以上）
  if (password.length < 8) {
    return Response.json({ success: false, message: 'パスワードは8文字以上にしてください' }, { status: 400 });
  }

  // 既存ユーザーチェック
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ?'
  ).bind(email, username).first();

  if (existing) {
    return Response.json({ success: false, message: 'このメールアドレスまたはユーザー名はすでに使用されています' }, { status: 409 });
  }

  // パスワードハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  // DB に保存
  await env.DB.prepare(
    'INSERT INTO users (email, username, password) VALUES (?, ?, ?)'
  ).bind(email, username, hashedPassword).run();

  return Response.json({ success: true, message: 'アカウントを作成しました' }, { status: 201 });
};
