import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/map');
    } catch (err) {
      setError('登入失敗');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg">
      {/* Background Blobs */}
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      
      {/* Particles */}
      <div className="bg-particles">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${15 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="content-layer">
        <div className="bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-lg w-96 max-w-md">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">歡迎回來</h1>
            <p className="text-sm text-gray-600">登入以管理你的跑步路線</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
              <input
                type="password"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl font-semibold hover:scale-[1.03] transition-transform shadow-md hover:shadow-lg"
            >
              登入
            </button>
          </form>
        
        <p className="mt-6 text-center text-xs text-gray-600">
          還沒有帳號？ <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">立即註冊</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
