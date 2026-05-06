// functions/api/dashboard.ts
import type { Env } from './_middleware';

export const onRequestGet: PagesFunction<Env, string, { userId: string }> = async (context) => {
  const userId = context.data.userId;

  const user = await context.env.DB.prepare(
    'SELECT username, created_at, last_login FROM users WHERE id = ?'
  ).bind(userId).first<{ username: string; created_at: string; last_login: string | null }>();

  if (!user) {
    return Response.json({ success: false, message: 'ユーザーが見つかりません' }, { status: 404 });
  }

  return Response.json({
    success: true,
    data: {
      username: user.username,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      // 将来の機能データをここに追加
      features: [],
    },
  });
};
