import { Link, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '📲',
    title: 'スマホ前提の導線',
    desc: '片手でも迷わず操作できるように、主要アクションを大きく保ちつつ情報密度を整えています。',
  },
  {
    icon: '🚉',
    title: '通勤ルートの見守り',
    desc: '登録した駅ペアを起点に、運行情報と代替ルート確認を一画面にまとめています。',
  },
  {
    icon: '🧩',
    title: '日常ツールを拡張しやすい',
    desc: 'メモ、持ち物、期限管理などを同じ情報設計に載せやすい構成です。',
  },
  {
    icon: '📦',
    title: 'PWA対応の土台',
    desc: 'ホーム画面追加、フルスクリーン表示、オフライン時の基本キャッシュに対応します。',
  },
];

const HIGHLIGHTS = [
  'Cloudflare Pages + D1 の軽量構成',
  'レスポンシブなカード型ダッシュボード',
  'JWT 認証とプライベート領域の分離',
];

export function LandingPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <Navbar />

      <main className="landing-shell animate-fade-in">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-badge">Daily tools, redesigned for mobile</div>
            <h1 className="landing-title">
              毎日開く道具を、
              <span>軽くて美しいアプリ体験</span>
              にまとめる。
            </h1>
            <p className="landing-description">
              MyTools は、日常で何度も触る小さな機能をひとつのPWAにまとめるための基盤です。
              通勤、生活管理、ちょっとした確認作業を、ブラウザの延長ではなくアプリとして扱えるようにします。
            </p>
            <div className="landing-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                無料で始める
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                ログイン
              </Link>
            </div>
            <div className="landing-highlights">
              {HIGHLIGHTS.map((item) => (
                <span key={item} className="landing-highlight-chip">{item}</span>
              ))}
            </div>
          </div>

          <div className="landing-device card">
            <div className="landing-device-topbar">
              <span className="landing-device-dot" />
              <span className="landing-device-dot" />
              <span className="landing-device-dot" />
            </div>
            <div className="landing-device-screen">
              <div className="landing-widget landing-widget-primary">
                <div>
                  <p className="landing-widget-label">今日の通勤</p>
                  <h2>中野駅 → 大手町駅</h2>
                </div>
                <span className="landing-status-pill">概ね平常運転</span>
              </div>
              <div className="landing-widget-grid">
                <article className="landing-widget">
                  <p className="landing-widget-label">代替ルート</p>
                  <strong>3候補を確認</strong>
                  <span>高円寺 / 東中野 / 新宿</span>
                </article>
                <article className="landing-widget">
                  <p className="landing-widget-label">ホーム画面</p>
                  <strong>PWAインストール可</strong>
                  <span>ネイティブ風フルスクリーン</span>
                </article>
              </div>
              <article className="landing-widget landing-widget-list">
                <div className="landing-list-row">
                  <span>通勤ルート</span>
                  <strong>保存済み</strong>
                </div>
                <div className="landing-list-row">
                  <span>生活メモ</span>
                  <strong>追加予定</strong>
                </div>
                <div className="landing-list-row">
                  <span>期限管理</span>
                  <strong>追加予定</strong>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-features">
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className="feature-card animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} MyTools</span>
        <span>Cloudflare Pages / React / PWA</span>
      </footer>
    </div>
  );
}
