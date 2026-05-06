import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import './DashboardPage.css';

interface DashboardData {
  username: string;
  createdAt: string;
  lastLogin: string | null;
  features: unknown[];
}

const TOOL_CARDS = [
  {
    icon: 'NT',
    title: 'メモ',
    desc: '短いメモ、再開ポイント、買い物メモなどを一覧で管理できます。',
    to: '/notes',
    badge: 'Available',
  },
  {
    icon: 'RT',
    title: '通勤ルート',
    desc: '登録した駅ペアを基準に、運行情報と代替ルート確認をまとめています。',
    to: '/commute',
    badge: 'Available',
  },
  {
    icon: 'LK',
    title: 'リンク整理',
    desc: '毎日使う外部サービスへの動線をまとめる拡張候補です。',
    badge: 'Coming Soon',
  },
  {
    icon: 'RC',
    title: 'ルーチン',
    desc: '日常の確認作業や簡単な反復タスクを置く余地があります。',
    badge: 'Coming Soon',
  },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) {
    return '未記録';
  }

  return new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard', { credentials: 'include' })
      .then((response) => response.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main animate-fade-in">
          <div className="dashboard-header">
            <h1 className="dashboard-welcome">
              ようこそ、<span>{user?.username}</span> さん
            </h1>
            <p className="dashboard-subtitle">
              日常で何度も開く小さな機能を、このダッシュボードから素早く扱えるようにしていきます。
            </p>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">ID</div>
              <div className="stat-info">
                <div className="stat-label">ユーザー名</div>
                <div className="stat-value">{user?.username}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">UP</div>
              <div className="stat-info">
                <div className="stat-label">登録日</div>
                <div className="stat-value">{data ? formatDate(data.createdAt) : '読み込み中...'}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">IN</div>
              <div className="stat-info">
                <div className="stat-label">最終ログイン</div>
                <div className="stat-value">{data ? formatDate(data.lastLogin) : '読み込み中...'}</div>
              </div>
            </div>
          </div>

          <section className="dashboard-feature-callout card">
            <div>
              <p className="dashboard-feature-label">Featured</p>
              <h2 className="dashboard-feature-title">メモをすぐ残せるように</h2>
              <p className="dashboard-feature-text">
                思いついたことをその場で保存して、あとから一覧で見返せます。買い物メモや再開ポイントの管理にも向いています。
              </p>
            </div>
            <Link to="/notes" className="btn btn-primary">
              メモを開く
            </Link>
          </section>

          <h2 className="section-title">使えるツール</h2>
          <div className="tools-grid">
            {TOOL_CARDS.map((tool) => {
              if (tool.to) {
                return (
                  <Link key={tool.title} to={tool.to} className="tool-card">
                    <div className="tool-card-icon">{tool.icon}</div>
                    <div>
                      <div className="tool-card-title">{tool.title}</div>
                      <div className="tool-card-desc">{tool.desc}</div>
                    </div>
                    <span className="tool-badge">{tool.badge}</span>
                  </Link>
                );
              }

              return (
                <div key={tool.title} className="tool-card tool-card-coming">
                  <div className="tool-card-icon">{tool.icon}</div>
                  <div>
                    <div className="tool-card-title">{tool.title}</div>
                    <div className="tool-card-desc">{tool.desc}</div>
                  </div>
                  <span className="tool-badge">{tool.badge}</span>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
