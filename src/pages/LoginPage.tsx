import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './AuthPage.css';

export function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'ログインに失敗しました。');
    }

    setSubmitting(false);
  }

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme} aria-label="テーマを切り替える">
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="auth-shell">
        <section className="auth-panel auth-panel-copy">
          <div className="auth-panel-badge">Sign in</div>
          <h1 className="auth-panel-title">移動前に、必要な情報だけすぐ開く。</h1>
          <p className="auth-panel-text">
            通勤ルート、遅延確認、これから増やす生活ツールを、スマホでも扱いやすい密度でまとめています。
          </p>
          <div className="auth-panel-points">
            <div className="auth-point">
              <strong>01</strong>
              <span>登録済みルートをそのまま再表示</span>
            </div>
            <div className="auth-point">
              <strong>02</strong>
              <span>PWAでホーム画面からすぐ起動</span>
            </div>
            <div className="auth-point">
              <strong>03</strong>
              <span>今後の生活ツール追加にも拡張しやすい構成</span>
            </div>
          </div>
        </section>

        <section className="auth-panel auth-card">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">◎</div>
            <span className="auth-logo-name">MyTools</span>
          </Link>

          <h2 className="auth-title">ログイン</h2>
          <p className="auth-subtitle">登録済みアカウントで続けてください。</p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="email">メールアドレス</label>
              <input
                id="email"
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
              <label className="form-label" htmlFor="password">パスワード</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="8文字以上"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={submitting || !email || !password}
            >
              {submitting ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <p className="auth-footer-text">
            アカウントをお持ちでない場合は <Link to="/register">新規登録</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
