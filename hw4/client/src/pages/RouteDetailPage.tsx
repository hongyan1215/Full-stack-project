import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { importLibrary } from '@googlemaps/js-api-loader';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

interface Route {
  id: number;
  title: string;
  description: string;
  distanceMeters: number;
  startAddress: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  geojson: {
    type: string;
    coordinates: number[][];
  };
  createdAt: string;
  updatedAt: string;
}

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/routes/${id}`);
        setRoute(response.data);
        
        // 初始化地圖（如果 geojson 存在）
        if (response.data.geojson && response.data.geojson.coordinates) {
          await initMap(response.data.geojson.coordinates);
        }
      } catch (error) {
        console.error('Failed to fetch route:', error);
        alert('載入路線失敗');
        navigate('/routes');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoute();
    }
  }, [id, navigate]);

  const initMap = async (coordinates: number[][]) => {
    try {
      const { Map } = await importLibrary('maps');

      if (mapRef.current && coordinates.length > 0) {
        // 計算邊界
        const lats = coordinates.map(c => c[1]);
        const lngs = coordinates.map(c => c[0]);
        const bounds = new google.maps.LatLngBounds();
        
        coordinates.forEach(([lng, lat]) => {
          bounds.extend({ lat, lng });
        });

        const mapInstance = new Map(mapRef.current, {
          center: bounds.getCenter(),
        });

        mapInstance.fitBounds(bounds);
        setMap(mapInstance);

        // 繪製路線
        const routePolyline = new google.maps.Polyline({
          path: coordinates.map(([lng, lat]) => ({ lat, lng })),
          strokeColor: '#3b82f6',
          strokeWeight: 4,
          map: mapInstance
        });
        setPolyline(routePolyline);

        // 添加標記
        const newMarkers = coordinates.map(([lng, lat], index) => {
          const isFirst = index === 0;
          const isLast = index === coordinates.length - 1;
          
          return new google.maps.Marker({
            position: { lat, lng },
            map: mapInstance,
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: isFirst ? '#10b981' : (isLast ? '#ef4444' : '#3b82f6'),
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2
            }
          });
        });
        
        setMarkers(newMarkers);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除此路線？')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/routes/${id}`);
      alert('路線已刪除');
      navigate('/routes');
    } catch (error) {
      alert('刪除失敗');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <div className="text-6xl mb-4 animate-bounce">🏃</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">載入路線中...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return null;
  }

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
        <div className="container mx-auto p-4">
        {/* Hero Section */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl p-8 mb-6 border border-gray-700 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <button
              onClick={() => navigate('/routes')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors font-medium text-gray-300 border border-gray-600"
            >
              <span>←</span>
              返回列表
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/routes/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-gray-900 rounded-lg hover:scale-[1.02] transition-all font-semibold shadow-lg hover:shadow-teal-500/50"
              >
                <span>✏️</span>
                編輯
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg hover:scale-[1.02] transition-all font-semibold shadow-lg"
              >
                <span>🗑️</span>
                刪除
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{route.title}</h1>
          {route.description && (
            <p className="text-gray-400 text-lg mb-4">{route.description}</p>
          )}
          {/* Achievement badges */}
          <div className="flex flex-wrap gap-2">
            {route.distanceMeters >= 10000 && (
              <span className="badge-achievement">🏆 10公里挑戰</span>
            )}
            {route.distanceMeters >= 5000 && (
              <span className="badge-achievement">🎖️ 5公里達標</span>
            )}
            {route.geojson?.coordinates && route.geojson.coordinates.length > 20 && (
              <span className="badge-achievement">📍 精細記錄</span>
            )}
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
            <div className="text-3xl mb-2">📏</div>
            <h3 className="text-2xl font-bold text-teal-400">{(route.distanceMeters / 1000).toFixed(2)} km</h3>
            <p className="text-sm text-gray-400">距離</p>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
            <div className="text-3xl mb-2">📍</div>
            <h3 className="text-2xl font-bold text-teal-400">{route.geojson?.coordinates?.length || 0}</h3>
            <p className="text-sm text-gray-400">節點數</p>
          </div>
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
            <div className="text-3xl mb-2">📅</div>
            <h3 className="text-lg font-bold text-teal-400">{new Date(route.createdAt).toLocaleDateString('zh-TW')}</h3>
            <p className="text-sm text-gray-400">建立時間</p>
          </div>
          {route.startAddress && (
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
              <div className="text-3xl mb-2">🏁</div>
              <h3 className="text-sm font-bold text-teal-400 line-clamp-2">{route.startAddress}</h3>
              <p className="text-sm text-gray-400">起點</p>
            </div>
          )}
        </div>

        {/* Map with enhanced styling */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
          <div className="h-96 w-full" ref={mapRef}></div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          {/* Weather Info (decorative) */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">☀️</span>
              <div>
                <p className="text-sm text-gray-400">天氣</p>
                <p className="font-bold text-white">適合跑步</p>
              </div>
            </div>
          </div>

          {/* Elevation Info (mock) */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">⛰️</span>
              <div>
                <p className="text-sm text-gray-400">海拔變化</p>
                <p className="font-bold text-white">約 {Math.floor(route.distanceMeters / 10)} m</p>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="bg-gray-800/60 backdrop-blur-xl rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">⏱️</span>
              <div>
                <p className="text-sm text-gray-400">預估時間</p>
                <p className="font-bold text-white">約 {Math.ceil(route.distanceMeters / 1000 * 6)} 分</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
