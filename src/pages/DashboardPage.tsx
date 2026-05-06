// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
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

const COMING_SOON_TOOLS = [
  { icon: '📝', title: 'メモ帳', desc: 'マークダウン対応のシンプルなメモ管理' },
  { icon: '🔗', title: 'URLショートナー', desc: '長いURLを短縮して管理する' },
  { icon: '⏱', title: 'タイマー', desc: 'ポモドーロタイマーと時間記録' },
  { icon: '📊', title: '家計簿', desc: '収支を記録して家計を管理する' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'なし';
  return new Date(dateStr + 'Z').toLocaleString('ja-JP', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/dashboard', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data); })
      .catch(() => {});
  }, []);

  return (
    <div>
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main animate-fade-in">
          {/* ウェルカムヘッダー */}
          <div className="dashboard-header">
            <h1 className="dashboard-welcome">
              こんにちは、<span>{user?.username}</span> さん 👋
            </h1>
            <p className="dashboard-subtitle">
              今日も快適にツールをご利用ください
            </p>
          </div>

          {/* ステータスカード */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div className="stat-info">
                <div className="stat-label">ユーザー名</div>
                <div className="stat-value">{user?.username}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <div className="stat-label">登録日</div>
                <div className="stat-value">{data ? formatDate(data.createdAt) : '...'}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🕐</div>
              <div className="stat-info">
                <div className="stat-label">前回ログイン</div>
                <div className="stat-value">{data ? formatDate(data.lastLogin) : '...'}</div>
              </div>
            </div>
          </div>

          {/* ツールグリッド */}
          <h2 className="section-title">🛠 利用可能なツール</h2>
          <div className="tools-grid">
            {COMING_SOON_TOOLS.map((tool) => (
              <div key={tool.title} className="tool-card tool-card-coming">
                <div className="tool-card-icon">{tool.icon}</div>
                <div>
                  <div className="tool-card-title">{tool.title}</div>
                  <div className="tool-card-desc">{tool.desc}</div>
                </div>
                <span className="tool-badge">近日公開</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
