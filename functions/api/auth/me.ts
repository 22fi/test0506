// functions/api/auth/me.ts
import { jwtVerify } from 'jose';
import type { Env } from '../_middleware';

function parseCookie(cookieStr: string, name: string): string | null {
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const cookieHeader = request.headers.get('Cookie') || '';
  const token = parseCookie(cookieHeader, 'auth_token');

  if (!token) {
    return Response.json({ success: false, message: '未認証' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string;

    const user = await env.DB.prepare(
      'SELECT id, email, username, created_at, last_login FROM users WHERE id = ?'
    ).bind(userId).first<{ id: string; email: string; username: string; created_at: string; last_login: string | null }>();

    if (!user) {
      return Response.json({ success: false, message: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return Response.json({ success: true, user });
  } catch {
    return Response.json({ success: false, message: 'セッションが無効です' }, { status: 401 });
  }
};
