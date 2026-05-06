// src/pages/LandingPage.tsx
import { Link, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '🔐',
    title: 'セキュアな認証',
    desc: 'HttpOnly Cookie + JWT による安全なログイン管理',
  },
  {
    icon: '🛠',
    title: '拡張可能な設計',
    desc: '便利ツールを後から自由に追加できる柔軟なアーキテクチャ',
  },
  {
    icon: '🌙',
    title: 'ダーク/ライトモード',
    desc: '好みに合わせてテーマを切り替えられる快適なUI',
  },
  {
    icon: '⚡',
    title: '高速・軽量',
    desc: 'Cloudflare の エッジネットワークで世界中から高速アクセス',
  },
];

export function LandingPage() {
  const { user, isLoading } = useAuth();

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing">
      <Navbar />

      <main className="landing-hero animate-fade-in">
        <div className="landing-badge">✨ 個人用ツールダッシュボード</div>
        <h1 className="landing-title">
          あなただけの<br />
          <span className="landing-title-accent">パーソナルツール</span>
        </h1>
        <p className="landing-description">
          日々の作業を効率化する便利ツールを一箇所にまとめた、
          自分専用のダッシュボード。安全で高速、無料で運用できます。
        </p>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary btn-lg">
            ログイン →
          </Link>
          <Link to="/register" className="btn btn-ghost btn-lg">
            新規登録
          </Link>
        </div>
      </main>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card animate-fade-in">
            <span className="feature-icon">{f.icon}</span>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} MyTools — Powered by Cloudflare Pages
      </footer>
    </div>
  );
}
