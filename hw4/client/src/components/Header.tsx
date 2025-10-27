import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/routes')}>
            <div>
              <h1 className="text-xl font-bold text-teal-400">Route Tracker</h1>
              <p className="text-xs text-gray-400">記錄你的跑步路線</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/map')}
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium text-gray-300 hover:text-teal-400"
            >
              建立路線
            </button>
            <button
              onClick={() => navigate('/routes')}
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium text-gray-300 hover:text-teal-400"
            >
              我的路線
            </button>
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-sm bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700">
                <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center border border-teal-500/30">
                  <span className="text-teal-400 font-semibold">{user.username[0].toUpperCase()}</span>
                </div>
                <span className="font-medium text-gray-300">{user.username}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="bg-gray-800/50 px-4 py-2 rounded-lg hover:bg-gray-700/50 transition-colors font-medium flex items-center gap-2 border border-gray-700 text-gray-300 hover:text-teal-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              登出
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
