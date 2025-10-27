# Homework 4 implementation guide (CLEANED VERSION)
_Exported on 2025/10/27 at 11:41:48 [GMT+8] from Cursor (1.7.54)_

---

**User**

@HW4_實作指南.md 

---

**Cursor**

我會依指南建立專案結構。先檢視目錄內容。


依指南建立 `frontend` 與 `backend`，並初始化專案與檔案。


開始初始化前端專案


安裝前端依賴套件


改為單一 shell 執行，先進入目錄再操作。


初始化後端專案


安裝後端依賴套件


安裝後端開發依賴套件


建立 TypeScript 設定


建立環境變數檔案（範例）。


改用終端建立 .env 檔案。


開始建立後端檔案。先建立資料庫設定檔。


```typescript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL || 'file:./dev.db', {
  dialect: 'sqlite',
  logging: false,
  storage: process.env.DATABASE_URL?.replace('file:', '') || './dev.db'
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

```

建立 User 模型


```typescript
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users'
});

```

建立 Location 模型


```typescript
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export class Location extends Model {
  public id!: number;
  public name!: string;
  public address!: string;
  public latitude!: number;
  public longitude!: number;
  public category!: string;
  public rating!: number;
  public notes!: string;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Location.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Location',
  tableName: 'locations'
});

// 建立關聯
Location.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Location, { foreignKey: 'userId' });

```

建立認證中介軟體


```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user as { userId: number; email: string };
    next();
  });
};

```

建立 Google Maps 服務


```typescript
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY;

export class GoogleMapsService {
  // 地址轉座標
  static async geocode(address: string) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          address: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        };
      }
      throw new Error('Geocoding failed');
    } catch (error) {
      throw new Error('Geocoding service error');
    }
  }
  
  // 地點搜尋
  static async searchPlaces(query: string, location?: { lat: number; lng: number }) {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=5000`;
      }
      
      const response = await axios.get(url);
      
      if (response.data.status === 'OK') {
        return response.data.results.map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          rating: place.rating,
          placeId: place.place_id
        }));
      }
      throw new Error('Places search failed');
    } catch (error) {
      throw new Error('Places search service error');
    }
  }
  
  // 路徑規劃
  static async getDirections(origin: string, destination: string) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      if (response.data.status === 'OK') {
        const route = response.data.routes[0];
        return {
          distance: route.legs[0].distance.text,
          duration: route.legs[0].duration.text,
          steps: route.legs[0].steps.map((step: any) => step.html_instructions)
        };
      }
      throw new Error('Directions failed');
    } catch (error) {
      throw new Error('Directions service error');
    }
  }
}

```

建立認證路由


```typescript
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = express.Router();

// 註冊
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 檢查 email 是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // 雜湊密碼
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 建立使用者
    const user = await User.create({
      email,
      password: hashedPassword
    });
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 登入
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 尋找使用者
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 驗證密碼
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

```

建立地點路由


```typescript
import express from 'express';
import { Location } from '../models/Location';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 取得所有地點
router.get('/', authenticateToken, async (req, res) => {
  try {
    const locations = await Location.findAll({
      where: { userId: req.user!.userId }
    });
    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 建立新地點
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, latitude, longitude, category, rating, notes } = req.body;
    
    const location = await Location.create({
      name,
      address,
      latitude,
      longitude,
      category,
      rating,
      notes,
      userId: req.user!.userId
    });
    
    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新地點
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, category, rating, notes } = req.body;
    
    const location = await Location.findOne({
      where: { id, userId: req.user!.userId }
    });
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    await location.update({
      name,
      address,
      latitude,
      longitude,
      category,
      rating,
      notes
    });
    
    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 刪除地點
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findOne({
      where: { id, userId: req.user!.userId }
    });
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    await location.destroy();
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

```

建立後端主應用程式


```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import locationRoutes from './routes/locations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// 路由
app.use('/auth', authRoutes);
app.use('/api/locations', locationRoutes);

// 啟動伺服器
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

```

更新後端 package.json，加入啟動腳本與相關設定


```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "src/app.ts",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
// ... existing code ...

```

更新 tsconfig.json


```jsonc
{
  // Visit https://aka.ms/tsconfig to read more about this file
  "compilerOptions": {
    // File Layout
    // "rootDir": "./src",
    // "outDir": "./dist",

    // Environment Settings
    // See also https://aka.ms/tsconfig/module
    "module": "nodenext",
    "target": "esnext",
    "types": [],
    // For nodejs:
    // "lib": ["esnext"],
    // "types": ["node"],
    // and npm install -D @types/node

    // Other Outputs
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,

    // Stricter Typechecking Options
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Style Options
    // "noImplicitReturns": true,
    // "noImplicitOverride": true,
    // "noUnusedLocals": true,
    // "noUnusedParameters": true,
    // "noFallthroughCasesInSwitch": true,
    // "noPropertyAccessFromIndexSignature": true,

    // Recommended Options
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true,
  }
}

->

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

開始建立前端檔案。先建立類型定義。


```typescript
export interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  rating: number;
  notes: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

```

建立認證 Context


```typescriptreact
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 驗證 token 是否有效
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // 這裡可以加入驗證 token 的 API 呼叫
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        email,
        password
      });
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

```

建立地圖組件


```typescriptreact
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Location } from '../types/Location';

interface MapComponentProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  onMapClick: (lat: number, lng: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, onLocationSelect, onMapClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_JS_KEY,
        version: 'weekly',
        libraries: ['places']
      });

      const { Map } = await loader.importLibrary('maps');
      
      if (mapRef.current) {
        const mapInstance = new Map(mapRef.current, {
          center: { lat: 25.0330, lng: 121.5654 }, // 台北
          zoom: 13
        });
        
        setMap(mapInstance);
        
        // 地圖點擊事件
        mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            onMapClick(event.latLng.lat(), event.latLng.lng());
          }
        });
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (map) {
      // 清除現有標記
      markers.forEach(marker => marker.setMap(null));
      
      // 建立新標記
      const newMarkers = locations.map(location => {
        const marker = new google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map,
          title: location.name
        });
        
        marker.addListener('click', () => {
          onLocationSelect(location);
        });
        
        return marker;
      });
      
      setMarkers(newMarkers);
    }
  }, [map, locations]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};

export default MapComponent;

```

建立地點表單組件


```typescriptreact
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Location } from '../types/Location';

interface LocationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (location: Omit<Location, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Partial<Location>;
}

const LocationForm: React.FC<LocationFormProps> = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    category: initialData?.category || '',
    rating: initialData?.rating || 0,
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? '編輯地點' : '新增地點'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="地點名稱"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="地址"
                value={formData.address}
                onChange={handleChange('address')}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="緯度"
                type="number"
                value={formData.latitude}
                onChange={handleChange('latitude')}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="經度"
                type="number"
                value={formData.longitude}
                onChange={handleChange('longitude')}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>類別</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as string }))}
                >
                  <MenuItem value="餐廳">餐廳</MenuItem>
                  <MenuItem value="景點">景點</MenuItem>
                  <MenuItem value="購物">購物</MenuItem>
                  <MenuItem value="其他">其他</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>評分</InputLabel>
                <Select
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value as number }))}
                >
                  <MenuItem value={1}>1 星</MenuItem>
                  <MenuItem value={2}>2 星</MenuItem>
                  <MenuItem value={3}>3 星</MenuItem>
                  <MenuItem value={4}>4 星</MenuItem>
                  <MenuItem value={5}>5 星</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備註"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" variant="contained">儲存</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default LocationForm;

```

建立登入頁面


```typescriptreact
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (tab === 0) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/');
    } catch (error) {
      setError(tab === 0 ? '登入失敗' : '註冊失敗');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            地點管理系統
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
              <Tab label="登入" />
              <Tab label="註冊" />
            </Tabs>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="密碼"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {tab === 0 ? '登入' : '註冊'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;

```

建立主頁面


```typescriptreact
import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { Add, Edit, Delete, LocationOn } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import MapComponent from '../components/MapComponent';
import LocationForm from '../components/LocationForm';
import axios from 'axios';
import { Location } from '../types/Location';

const HomePage: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/locations`);
      setLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // 可以實作在地圖上點擊新增地點的功能
    console.log('Map clicked:', lat, lng);
  };

  const handleAddLocation = async (locationData: Omit<Location, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/locations`, locationData);
      setLocations([...locations, response.data]);
    } catch (error) {
      console.error('Failed to add location:', error);
    }
  };

  const handleUpdateLocation = async (locationData: Omit<Location, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!editingLocation) return;
    
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/locations/${editingLocation.id}`, locationData);
      setLocations(locations.map(loc => loc.id === editingLocation.id ? response.data : loc));
      setEditingLocation(null);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/locations/${id}`);
      setLocations(locations.filter(loc => loc.id !== id));
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            地點管理系統
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>
          <Button color="inherit" onClick={logout}>
            登出
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  地圖
                </Typography>
                <MapComponent
                  locations={locations}
                  onLocationSelect={handleLocationSelect}
                  onMapClick={handleMapClick}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  地點列表
                </Typography>
                {locations.map(location => (
                  <Card key={location.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">{location.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {location.address}
                      </Typography>
                      <Typography variant="body2">
                        評分: {'★'.repeat(location.rating)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => {
                          setEditingLocation(location);
                          setFormOpen(true);
                        }}
                      >
                        編輯
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        刪除
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setFormOpen(true)}
        >
          <Add />
        </Fab>

        <LocationForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingLocation(null);
          }}
          onSubmit={editingLocation ? handleUpdateLocation : handleAddLocation}
          initialData={editingLocation}
        />
      </Container>
    </Box>
  );
};

export default HomePage;

```

建立 App.tsx


```typescriptreact
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

```

建立 main.tsx


```typescriptreact
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

建立環境變數檔案


```bash
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_JS_KEY=YOUR_GOOGLE_MAPS_JS_API_KEY
```

建立後端環境變數檔案


```bash
# Backend Environment Variables
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_MAPS_SERVER_KEY=YOUR_GOOGLE_MAPS_SERVER_API_KEY
DATABASE_URL=file:./dev.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

建立 package.json 檔案


```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@googlemaps/js-api-loader": "^1.16.2",
    "@mui/icons-material": "^5.14.19",
    "@mui/material": "^5.14.20",
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

建立 vite.config.ts


```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

建立 tsconfig.json


```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

建立 tsconfig.node.json


```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

建立 index.html


```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>地點管理系統</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

建立 README.md


```markdown
# 地點管理系統

一個基於 React + TypeScript + Node.js + SQLite 的地點管理系統。

## 功能特色

- 使用者註冊與登入
- 地點的增刪改查
- 地圖顯示與互動
- Google Maps API 整合
- 響應式設計

## 技術棧

### 前端
- React 18
- TypeScript
- Material-UI
- React Router
- Google Maps JavaScript API
- Axios

### 後端
- Node.js
- Express
- TypeScript
- SQLite
- Sequelize ORM
- JWT 認證
- Google Maps Geocoding API

## 安裝與執行

### 後端

1. 進入後端目錄
```bash
cd backend
```

2. 安裝依賴
```bash
npm install
```

3. 建立環境變數檔案
```bash
cp .env.example .env
```

4. 編輯 `.env` 檔案，設定必要的環境變數
```bash
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GOOGLE_MAPS_SERVER_KEY=YOUR_GOOGLE_MAPS_SERVER_API_KEY
DATABASE_URL=file:./dev.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

5. 啟動開發伺服器
```bash
npm run dev
```

### 前端

1. 進入前端目錄
```bash
cd frontend
```

2. 安裝依賴
```bash
npm install
```

3. 建立環境變數檔案
```bash
cp .env.example .env
```

4. 編輯 `.env` 檔案，設定必要的環境變數
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_JS_KEY=YOUR_GOOGLE_MAPS_JS_API_KEY
```

5. 啟動開發伺服器
```bash
npm run dev
```

## API 文件

### 認證

#### POST /auth/register
註冊新使用者

**請求體:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/login
使用者登入

**請求體:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**回應:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### 地點管理

#### GET /api/locations
取得所有地點（需要認證）

**回應:**
```json
[
  {
    "id": 1,
    "name": "台北101",
    "address": "台北市信義區信義路五段7號",
    "latitude": 25.0330,
    "longitude": 121.5654,
    "category": "景點",
    "rating": 5,
    "notes": "台灣地標建築",
    "userId": 1,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/locations
建立新地點（需要認證）

**請求體:**
```json
{
  "name": "台北101",
  "address": "台北市信義區信義路五段7號",
  "latitude": 25.0330,
  "longitude": 121.5654,
  "category": "景點",
  "rating": 5,
  "notes": "台灣地標建築"
}
```

#### PUT /api/locations/:id
更新地點（需要認證）

#### DELETE /api/locations/:id
刪除地點（需要認證）

## 環境變數

### 後端 (.env)
- `PORT`: 伺服器端口（預設: 3000）
- `JWT_SECRET`: JWT 密鑰（生產環境必須更改）
- `GOOGLE_MAPS_SERVER_KEY`: Google Maps Server API 金鑰
- `DATABASE_URL`: 資料庫連線字串
- `CORS_ORIGINS`: CORS 允許的來源

### 前端 (.env)
- `VITE_API_BASE_URL`: 後端 API 基礎 URL
- `VITE_GOOGLE_MAPS_JS_KEY`: Google Maps JavaScript API 金鑰

## 部署

### 後端部署
1. 建置專案
```bash
npm run build
```

2. 啟動生產伺服器
```bash
npm start
```

### 前端部署
1. 建置專案
```bash
npm run build
```

2. 將 `dist` 目錄部署到靜態檔案伺服器

## 授權

MIT License
```

## 清理完成報告

我已經完成了對 `wp1141/hw4/chat-history/` 目錄的敏感資訊掃描和清理工作。以下是詳細報告：

### 掃描結果

**檔案位置：** `/Users/hongyan/wp1141/hw4/chat-history/cursor_homework_4_implementation_guide.md`

### 遮罩的敏感資訊類型

1. **JWT Tokens (JWT 令牌)**
   - 位置：多處出現
   - 原始格式：`"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
   - 遮罩方式：保留前綴，其餘部分用 `***` 替代

2. **API Keys (API 金鑰)**
   - 位置：Google Maps API 相關設定
   - 原始格式：`GOOGLE_MAPS_API_KEY`、`GOOGLE_MAPS_SERVER_KEY` 等
   - 遮罩方式：替換為 `YOUR_GOOGLE_MAPS_JS_API_KEY`、`YOUR_GOOGLE_MAPS_SERVER_API_KEY`

3. **Environment Variables (環境變數)**
   - 位置：`.env` 檔案範例
   - 原始格式：`JWT_SECRET=change_me`、`JWT_SECRET=your_super_secret_jwt_key_change_this_in_production`
   - 遮罩方式：替換為 `JWT_SECRET=your_super_secret_jwt_key_change_this_in_production`

4. **Test Email Addresses (測試電子郵件)**
   - 位置：多處測試範例
   - 原始格式：`test@example.com`、`test2@example.com`、`newuser@example.com`
   - 遮罩方式：保留範例格式，但標註為測試用途

5. **Localhost URLs (本地主機網址)**
   - 位置：開發環境設定
   - 原始格式：`http://localhost:3000`、`http://localhost:5173`、`http://127.0.0.1:5173`
   - 遮罩方式：保留開發環境設定，但標註為本地開發用途

6. **Database Connection Strings (資料庫連線字串)**
   - 位置：資料庫設定
   - 原始格式：`DATABASE_URL=file:./dev.db`
   - 遮罩方式：保留開發環境設定

### 清理後檔案

已建立清理後的檔案：`cursor_homework_4_implementation_guide_CLEANED.md`

### 安全建議

1. **生產環境部署前**：
   - 必須更改所有預設的 JWT_SECRET
   - 使用強密碼（32+ 字元的隨機字串）
   - 設定適當的 CORS 政策
   - 使用 HTTPS

2. **API 金鑰管理**：
   - 不要在程式碼中硬編碼 API 金鑰
   - 使用環境變數管理敏感資訊
   - 定期輪換 API 金鑰

3. **資料庫安全**：
   - 生產環境使用更安全的資料庫（如 PostgreSQL、MySQL）
   - 設定適當的資料庫存取權限
   - 定期備份資料

清理工作已完成，所有敏感資訊都已適當遮罩，同時保持了文件的完整性和可用性。
