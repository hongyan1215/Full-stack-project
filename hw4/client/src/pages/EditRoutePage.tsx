import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { importLibrary } from '@googlemaps/js-api-loader';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { calculateDistance } from '../utils/haversine';
import Header from '../components/Header';

interface Route {
  id: number;
  title: string;
  description: string;
  distanceMeters: number;
  geojson: {
    type: string;
    coordinates: number[][];
  };
}

export default function EditRoutePage() {
  const { id } = useParams<{ id: string }>();
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [points, setPoints] = useState<google.maps.LatLng[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/routes/${id}`);
        const route = response.data;
        setTitle(route.title);
        setDescription(route.description || '');
        
        // 初始化地圖並載入現有路線
        if (route.geojson && route.geojson.coordinates) {
          await initMap(route.geojson.coordinates);
        } else {
          // 如果沒有座標，初始化空地圖
          await initMap([]);
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

      if (!mapRef.current) {
        console.error('Map container ref is null');
        return;
      }

      // 初始化地圖
      const mapInstance = new Map(mapRef.current, {
        center: { lat: 25.0330, lng: 121.5654 }, // 台北預設位置
        zoom: 13
      });
      setMap(mapInstance);

      // 如果有現有座標，繪製路線和標記
      if (coordinates && coordinates.length > 0) {
        // 計算邊界
        const bounds = new google.maps.LatLngBounds();

        coordinates.forEach(([lng, lat]) => {
          bounds.extend({ lat, lng });
        });

        mapInstance.fitBounds(bounds);

        // 繪製現有路線
        const routePolyline = new google.maps.Polyline({
          path: coordinates.map(([lng, lat]) => ({ lat, lng })),
          strokeColor: '#3b82f6',
          strokeWeight: 4,
          map: mapInstance
        });
        setPolyline(routePolyline);

        // 添加標記
        const existingPoints = coordinates.map(([lng, lat]) => new google.maps.LatLng(lat, lng));
        setPoints(existingPoints);

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

  const addPoint = useCallback((latLng: google.maps.LatLng) => {
    if (!map) return;
    
    setPoints(prevPoints => {
      const newPoints = [...prevPoints, latLng];
      const pointIndex = newPoints.length;
      
      // 創建標記
      const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        label: {
          text: pointIndex.toString(),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: pointIndex === 1 ? '#10b981' : (pointIndex === newPoints.length ? '#ef4444' : '#3b82f6'),
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
        }
      });
      
      setMarkers(prevMarkers => [...prevMarkers, marker]);

      // 更新 polyline
      setPolyline(prevPolyline => {
        if (prevPolyline) {
          prevPolyline.setPath(newPoints);
          return prevPolyline;
        } else {
          const newPolyline = new google.maps.Polyline({
            path: newPoints,
            strokeColor: '#3b82f6',
            strokeWeight: 4,
            map
          });
          return newPolyline;
        }
      });
      
      return newPoints;
    });
  }, [map]);

  // 當地圖初始化後添加點擊事件
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        addPoint(e.latLng);
      }
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, addPoint]);

  const clearPoints = () => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
    setPoints([]);
    if (polyline) {
      polyline.setMap(null);
      setPolyline(null);
    }
  };

  const undoLastPoint = () => {
    if (points.length === 0) return;
    
    const lastMarker = markers[markers.length - 1];
    if (lastMarker) {
      lastMarker.setMap(null);
      setMarkers(markers.slice(0, -1));
    }
    
    const newPoints = points.slice(0, -1);
    setPoints(newPoints);
    
    if (polyline) {
      if (newPoints.length > 0) {
        polyline.setPath(newPoints);
      } else {
        polyline.setMap(null);
        setPolyline(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (points.length < 2) {
      alert('至少需要 2 個點');
      return;
    }
    if (!title.trim()) {
      alert('請輸入路線名稱');
      return;
    }

    setIsSubmitting(true);
    const coordinates = points.map(p => [p.lng(), p.lat()]);
    const distance = calculateDistance(points);

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/routes/${id}`, {
        title: title.trim(),
        description: description.trim() || undefined,
        distanceMeters: distance,
        geojson: {
          type: 'LineString',
          coordinates
        }
      });
      alert('路線更新成功！');
      navigate(`/routes/${id}`);
    } catch (error) {
      console.error('更新路線失敗:', error);
      alert('更新路線失敗，請稍後再試');
      setIsSubmitting(false);
    }
  };

  const distance = calculateDistance(points);

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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <div 
          className="flex-1" 
          ref={mapRef}
          style={{ minHeight: '100%', minWidth: '300px' }}
        ></div>
        <div className="w-80 bg-white border-l border-gray-200 p-4 shadow-lg overflow-y-auto relative">
          {/* Subtle blob in sidebar */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
          <div className="mb-6 text-center">
            <div className="text-5xl mb-2">✏️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">編輯路線</h2>
            <p className="text-sm text-gray-600">點擊地圖新增節點</p>
          </div>
          
          <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100 pulse-stat">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 font-medium flex items-center gap-1">
                <span>📍</span> 節點數
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 gradient-text">{points.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium flex items-center gap-1">
                <span>📏</span> 距離
              </span>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 gradient-text">{(distance / 1000).toFixed(2)} km</span>
            </div>
          </div>

          <input
            type="text"
            placeholder="路線名稱 *"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors mb-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="描述（選填）"
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors mb-3 resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

                      <button
              onClick={handleSubmit}
              disabled={points.length < 2 || !title || isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white p-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all disabled:shadow-none"
            >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                更新中...
              </>
            ) : (
              '儲存變更'
            )}
          </button>
          <div className="flex gap-2 mb-3">
            <button
              onClick={undoLastPoint}
              disabled={points.length === 0}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              撤銷
            </button>
            <button
              onClick={clearPoints}
              disabled={points.length === 0}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              清除
            </button>
          </div>
          <button
            onClick={() => navigate(`/routes/${id}`)}
            className="w-full bg-gray-400 hover:bg-gray-500 text-white p-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
