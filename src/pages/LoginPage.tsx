// src/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './AuthPage.css';

export function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'ログインに失敗しました');
    }
    setSubmitting(false);
  }

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme} aria-label="テーマ切り替え">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">🛠</div>
          <span className="auth-logo-name">MyTools</span>
        </Link>

        <h1 className="auth-title">おかえりなさい</h1>
        <p className="auth-subtitle">アカウントにログインしてください</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={submitting || !email || !password}
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? '確認中...' : 'ログイン'}
          </button>
        </form>

        <p className="auth-footer-text">
          アカウントをお持ちでない方は{' '}
          <Link to="/register">新規登録</Link>
        </p>
      </div>
    </div>
  );
}
