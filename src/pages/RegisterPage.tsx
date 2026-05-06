import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './AuthPage.css';

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels = ['', '弱い', '普通', '強い', 'とても強い'];
  return { score, label: labels[score] || '' };
}

export function RegisterPage() {
  const { user, register, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。');
      return;
    }

    setSubmitting(true);
    const result = await register(email, username, password, inviteCode);

    if (result.success) {
      setSuccess('登録が完了しました。ログイン画面へ移動します。');
      setTimeout(() => navigate('/login'), 1400);
    } else {
      setError(result.message || '登録に失敗しました。');
    }

    setSubmitting(false);
  }

  const strengthClass = (index: number) => {
    if (!password || index >= strength.score) return '';
    if (strength.score <= 1) return 'filled-weak';
    if (strength.score <= 2) return 'filled-medium';
    return 'filled-strong';
  };

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme} aria-label="テーマを切り替える">
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="auth-shell">
        <section className="auth-panel auth-panel-copy">
          <div className="auth-panel-badge">Create account</div>
          <h1 className="auth-panel-title">日常で使う道具を、自分専用の起点にする。</h1>
          <p className="auth-panel-text">
            まずは通勤ルートから始めて、必要になった生活機能を少しずつ足していける構成です。
          </p>
          <div className="auth-panel-stats">
            <div className="auth-stat">
              <strong>Fast</strong>
              <span>Cloudflare上で軽く動作</span>
            </div>
            <div className="auth-stat">
              <strong>Private</strong>
              <span>認証後の個人用ダッシュボード</span>
            </div>
            <div className="auth-stat">
              <strong>Installable</strong>
              <span>ホーム画面追加に対応</span>
            </div>
          </div>
        </section>

        <section className="auth-panel auth-card">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">◎</div>
            <span className="auth-logo-name">MyTools</span>
          </Link>

          <h2 className="auth-title">新規登録</h2>
          <p className="auth-subtitle">招待コードを入力してアカウントを作成します。</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {success && <div className="alert alert-success" role="alert">{success}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">メールアドレス</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-username">ユーザー名</label>
              <input
                id="reg-username"
                type="text"
                className="form-input"
                placeholder="mytools-user"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">パスワード</label>
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="8文字以上"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
              {password && (
                <>
                  <div className="password-strength">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className={`password-strength-bar ${strengthClass(index)}`} />
                    ))}
                  </div>
                  <p className="text-muted mt-1">強度: {strength.label}</p>
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-invite">招待コード</label>
              <input
                id="reg-invite"
                type="password"
                className="form-input"
                placeholder="招待コードを入力"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={submitting || !email || !username || !password || !inviteCode}
            >
              {submitting ? '登録中...' : 'アカウントを作成'}
            </button>
          </form>

          <p className="auth-footer-text">
            すでにアカウントをお持ちの場合は <Link to="/login">ログイン</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
