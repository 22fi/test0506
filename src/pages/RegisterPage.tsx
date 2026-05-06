// src/pages/RegisterPage.tsx
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './AuthPage.css';

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', '弱い', '普通', '強い', 'とても強い'];
  return { score, label: labels[score] || '' };
}

export function RegisterPage() {
  const { user, register, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail]           = useState('');
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setSubmitting(true);
    const result = await register(email, username, password, inviteCode);
    if (result.success) {
      setSuccess('アカウントを作成しました！ログインページに移動します...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message || '登録に失敗しました');
    }
    setSubmitting(false);
  }

  const strengthClass = (idx: number) => {
    if (!password) return '';
    if (idx < strength.score) {
      if (strength.score <= 1) return 'filled-weak';
      if (strength.score <= 2) return 'filled-medium';
      return 'filled-strong';
    }
    return '';
  };

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

        <h1 className="auth-title">アカウント作成</h1>
        <p className="auth-subtitle">招待コードを入力して登録してください</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="alert alert-error" role="alert">⚠️ {error}</div>
          )}
          {success && (
            <div className="alert alert-success" role="alert">✅ {success}</div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">メールアドレス</label>
            <input
              id="reg-email"
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
            <label className="form-label" htmlFor="reg-username">ユーザー名</label>
            <input
              id="reg-username"
              type="text"
              className="form-input"
              placeholder="myusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">パスワード（8文字以上）</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {password && (
              <>
                <div className="password-strength">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`password-strength-bar ${strengthClass(i)}`} />
                  ))}
                </div>
                <p className="text-muted mt-1">{strength.label}</p>
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
              onChange={(e) => setInviteCode(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={submitting || !email || !username || !password || !inviteCode}
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? '作成中...' : 'アカウントを作成'}
          </button>
        </form>

        <p className="auth-footer-text">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
