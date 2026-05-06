// functions/api/auth/logout.ts
import type { Env } from '../_middleware';

export const onRequestPost: PagesFunction<Env> = async () => {
  return new Response(
    JSON.stringify({ success: true, message: 'ログアウトしました' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cookie を即時期限切れにして削除
        'Set-Cookie': 'auth_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/',
      },
    }
  );
};
