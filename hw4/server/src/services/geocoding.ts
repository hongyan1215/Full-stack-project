import axios from 'axios';

interface ReverseGeocodeParams {
  lat: number;
  lng: number;
}

// 記憶體快取
const cache = new Map<string, { address: string | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 分鐘

export async function reverseGeocode(
  { lat, lng }: ReverseGeocodeParams
): Promise<string | null> {
  const startTime = Date.now();
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  
  // 檢查快取
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const duration = Date.now() - startTime;
    console.log(`[Geocoding] Cache hit for ${cacheKey} took ${duration}ms`);
    return cached.address;
  }
  
  // 檢查 API Key
  if (!process.env.GOOGLE_MAPS_SERVER_KEY) {
    console.warn('GOOGLE_MAPS_SERVER_KEY not configured');
    return null;
  }
  
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.GOOGLE_MAPS_SERVER_KEY,
          language: 'zh-TW'
        },
        timeout: 5000 // 5 秒超時
      }
    );
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const address = response.data.results[0].formatted_address;
      cache.set(cacheKey, { address, timestamp: Date.now() });
      const duration = Date.now() - startTime;
      console.log(`[Geocoding] API call for ${cacheKey} succeeded in ${duration}ms`);
      return address;
    }
    
    const duration = Date.now() - startTime;
    console.warn(`[Geocoding] API call for ${cacheKey} failed: ${response.data.status} (${duration}ms)`);
    cache.set(cacheKey, { address: null, timestamp: Date.now() });
    return null;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Geocoding] API call for ${cacheKey} error after ${duration}ms:`, error);
    return null;
  }
}
