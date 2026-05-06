// functions/api/_middleware.ts
// 全 /api/* ルートに適用される JWT 認証ミドルウェア

import { jwtVerify } from 'jose';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  INVITE_CODE: string;
}

// 認証不要のパス
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
];

export const onRequest: PagesFunction<Env, any, { userId: string }> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // 公開パスはそのまま通す
  if (PUBLIC_PATHS.some((p) => url.pathname === p)) {
    return next();
  }

  // Cookie から JWT を取得
  const cookieHeader = request.headers.get('Cookie') || '';
  const token = parseCookie(cookieHeader, 'auth_token');

  if (!token) {
    return Response.json({ success: false, message: '認証が必要です' }, { status: 401 });
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    // context.data に userId を格納して次のハンドラーへ渡す
    context.data.userId = payload.sub as string;
    return next();
  } catch {
    return Response.json({ success: false, message: 'セッションが無効です。再ログインしてください' }, { status: 401 });
  }
};

function parseCookie(cookieStr: string, name: string): string | null {
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
