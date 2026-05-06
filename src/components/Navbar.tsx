import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.css';

interface NavbarProps {
  showAuth?: boolean;
}

export function Navbar({ showAuth = true }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
        <div className="navbar-brand-icon">MT</div>
        <span>MyTools</span>
      </Link>
      <div className="navbar-spacer" />
      <div className="navbar-actions">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="テーマを切り替える"
          title={theme === 'dark' ? 'ライトモードへ切り替え' : 'ダークモードへ切り替え'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
        {showAuth && user && (
          <button className="btn btn-ghost" onClick={handleLogout}>
            ログアウト
          </button>
        )}
        {showAuth && !user && (
          <>
            <Link to="/login" className="btn btn-ghost">ログイン</Link>
            <Link to="/register" className="btn btn-primary">新規登録</Link>
          </>
        )}
      </div>
    </nav>
  );
}
