import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

interface NavItem {
  icon: string;
  label: string;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'DB', label: 'ダッシュボード', to: '/dashboard' },
  { icon: 'NT', label: 'メモ', to: '/notes' },
  { icon: 'RT', label: '通勤ルート', to: '/commute' },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <span className="sidebar-section-title">Navigation</span>

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      <div className="sidebar-spacer" />

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="sidebar-username">{user.username}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
