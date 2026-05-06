// functions/api/auth/login.ts
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import type { Env } from '../_middleware';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7日

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: 'リクエストが不正です' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return Response.json({ success: false, message: 'メールアドレスとパスワードを入力してください' }, { status: 400 });
  }

  // ユーザー取得
  const user = await env.DB.prepare(
    'SELECT id, email, username, password FROM users WHERE email = ?'
  ).bind(email).first<{ id: string; email: string; username: string; password: string }>();

  if (!user) {
    return Response.json({ success: false, message: 'メールアドレスまたはパスワードが違います' }, { status: 401 });
  }

  // パスワード検証
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return Response.json({ success: false, message: 'メールアドレスまたはパスワードが違います' }, { status: 401 });
  }

  // JWT 生成
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new SignJWT({ sub: user.id, email: user.email, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  // 最終ログイン時刻を更新
  await env.DB.prepare(
    "UPDATE users SET last_login = datetime('now') WHERE id = ?"
  ).bind(user.id).run();

  // HttpOnly Cookie を設定してレスポンス
  return new Response(
    JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, username: user.username },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `auth_token=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}; Path=/`,
      },
    }
  );
};
