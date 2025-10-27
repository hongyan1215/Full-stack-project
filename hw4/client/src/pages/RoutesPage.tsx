import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

interface Route {
  id: number;
  title: string;
  description: string;
  distanceMeters: number;
  startAddress: string | null;
  createdAt: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/routes`);
      setRoutes(response.data);
    } catch (error) {
      console.error('Failed to fetch routes');
    }
  };

  // 搜尋和篩選路由
  const filteredRoutes = routes.filter(route => {
    const query = searchQuery.toLowerCase();
    return (
      route.title.toLowerCase().includes(query) ||
      (route.description && route.description.toLowerCase().includes(query)) ||
      (route.startAddress && route.startAddress.toLowerCase().includes(query))
    );
  });

  const deleteRoute = async (id: number) => {
    if (!confirm('確定要刪除此路線？')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/routes/${id}`);
      fetchRoutes();
    } catch (error) {
      alert('刪除失敗');
    }
  };

  // Calculate total statistics
  const totalDistance = routes.reduce((sum, route) => sum + route.distanceMeters, 0);
  const totalRoutes = routes.length;

  return (
    <div className="min-h-screen animated-bg">
      {/* Background Blobs */}
      <div className="bg-blob bg-blob-1"></div>
      <div className="bg-blob bg-blob-2"></div>
      <div className="bg-blob bg-blob-3"></div>
      
      {/* Particles */}
      <div className="bg-particles">
        {[...Array(20)].map((_, i) => (
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
      
      <div className="content-layer">
        <Header />
        <div className="container mx-auto max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">我的路線</h1>
            <p className="text-sm text-gray-600">管理並查看您的所有跑步路線</p>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="h-11 px-6 bg-blue-500 text-white rounded-2xl font-medium text-base hover:bg-blue-600 transition-colors"
          >
            + 新增路線
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜尋路線..."
            className="w-full h-12 px-4 border border-gray-300 rounded-3xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {routes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">還沒有任何路線</h2>
            <p className="text-sm text-gray-600 mb-6">前往地圖建立第一條路線</p>
            <button
              onClick={() => navigate('/map')}
              className="h-11 px-6 bg-blue-500 text-white rounded-2xl font-medium text-base hover:bg-blue-600 transition-colors"
            >
              建立路線
            </button>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
            <p className="text-base text-gray-900 mb-4">沒有符合搜尋條件的路線</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              清除搜尋
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRoutes.map((route) => (
              <div key={route.id} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Top Row: Title + Distance */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{route.title}</h3>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                        📏 {(route.distanceMeters / 1000).toFixed(2)} km
                      </span>
                    </div>
                    
                    {/* Bottom Row: Location + Date */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {route.startAddress && (
                        <span className="flex items-center gap-1">
                          📍 {route.startAddress}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        📅 {new Date(route.createdAt).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    
                    {route.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-1">{route.description}</p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/routes/${route.id}`)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                      title="查看詳情"
                    >
                      <span className="text-xl group-hover:scale-110 inline-block transition-transform">🔍</span>
                    </button>
                    <button
                      onClick={() => deleteRoute(route.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      title="刪除路線"
                    >
                      <span className="text-xl group-hover:scale-110 inline-block transition-transform">🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
