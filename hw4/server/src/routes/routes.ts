import express from 'express';
import { z } from 'zod';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { reverseGeocode } from '../services/geocoding';

const router = express.Router();

// 在路由上使用認證中介軟體
router.use(authMiddleware);

// Zod 驗證 schema
const createRouteSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  distanceMeters: z.number().min(0).default(0),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional(),
  geojson: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(z.array(z.number())).min(2)
  }),
  startAddress: z.string().optional()
});

const updateRouteSchema = createRouteSchema.partial();

// GET /api/routes
router.get('/', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { q, from, to } = req.query;

    let query = 'SELECT * FROM routes WHERE createdBy = ?';
    const params: any[] = [userId];

    // 搜尋標題
    if (q) {
      query += ' AND title LIKE ?';
      params.push(`%${q}%`);
    }

    // 日期範圍
    if (from) {
      query += ' AND date(createdAt) >= date(?)';
      params.push(from as string);
    }

    if (to) {
      query += ' AND date(createdAt) <= date(?)';
      params.push(to as string);
    }

    query += ' ORDER BY createdAt DESC';

    const routes = db.prepare(query).all(...params) as any[];

    // 將 geojson 字串解析為 JSON 物件
    const parsedRoutes = routes.map(route => ({
      ...route,
      geojson: route.geojson ? JSON.parse(route.geojson) : null
    }));

    res.json(parsedRoutes);
  } catch (error) {
    console.error('List routes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/routes/:id
router.get('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const routeId = parseInt(req.params.id);

    const route = db.prepare(
      'SELECT * FROM routes WHERE id = ? AND createdBy = ?'
    ).get(routeId, userId) as any;

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // 將 geojson 字串解析為 JSON 物件
    const parsedRoute = {
      ...route,
      geojson: route.geojson ? JSON.parse(route.geojson) : null
    };

    res.json(parsedRoute);
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/routes
router.post('/', async (req: AuthRequest, res) => {
  try {
    const validated = createRouteSchema.parse(req.body);
    const userId = req.user!.userId;

    // 驗證 GeoJSON 必須是 LineString
    if (validated.geojson.type !== 'LineString') {
      return res.status(422).json({ error: 'GeoJSON must be LineString type' });
    }

    // 處理 startAddress：如果沒有提供，從 geojson 第一個點反查
    let finalStartAddress: string | null = validated.startAddress || null;
    if (!finalStartAddress && validated.geojson.coordinates.length > 0) {
      const [lng, lat] = validated.geojson.coordinates[0];
      finalStartAddress = await reverseGeocode({ lat, lng });
    }

    // 插入路線
    const result = db.prepare(`
      INSERT INTO routes (title, description, distanceMeters, startedAt, finishedAt, geojson, startAddress, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      validated.title,
      validated.description || null,
      validated.distanceMeters || 0,
      validated.startedAt || null,
      validated.finishedAt || null,
      JSON.stringify(validated.geojson),
      finalStartAddress || null,
      userId
    );

    // 取得剛建立的路線
    const route = db.prepare('SELECT * FROM routes WHERE id = ?').get(result.lastInsertRowid) as any;

    // 將 geojson 字串解析為 JSON 物件
    const parsedRoute = {
      ...route,
      geojson: route.geojson ? JSON.parse(route.geojson) : null
    };

    res.status(201).json(parsedRoute);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.reduce((acc, issue) => {
        const field = issue.path.join('.');
        acc[field] = issue.message;
        return acc;
      }, {} as Record<string, string>);
      
      return res.status(400).json({ 
        error: 'Validation failed', 
        fieldErrors,
        details: error.issues 
      });
    }
    console.error('Create route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/routes/:id
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const validated = updateRouteSchema.parse(req.body);
    const userId = req.user!.userId;
    const routeId = parseInt(req.params.id);

    // 檢查路線是否存在且屬於使用者
    const existingRoute = db.prepare(
      'SELECT * FROM routes WHERE id = ? AND createdBy = ?'
    ).get(routeId, userId);

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // 建構更新語句
    const updates: string[] = [];
    const values: any[] = [];

    if (validated.title) {
      updates.push('title = ?');
      values.push(validated.title);
    }
    if (validated.description !== undefined) {
      updates.push('description = ?');
      values.push(validated.description);
    }
    if (validated.distanceMeters !== undefined) {
      updates.push('distanceMeters = ?');
      values.push(validated.distanceMeters);
    }
    if (validated.startedAt !== undefined) {
      updates.push('startedAt = ?');
      values.push(validated.startedAt);
    }
    if (validated.finishedAt !== undefined) {
      updates.push('finishedAt = ?');
      values.push(validated.finishedAt);
    }
    if (validated.geojson) {
      if (validated.geojson.type !== 'LineString') {
        return res.status(422).json({ error: 'GeoJSON must be LineString type' });
      }
      updates.push('geojson = ?');
      values.push(JSON.stringify(validated.geojson));
      
      // 如果更新了 geojson 但沒有明確提供 startAddress，嘗試從第一個點反查
      if (validated.startAddress === undefined && validated.geojson.coordinates.length > 0) {
        const [lng, lat] = validated.geojson.coordinates[0];
        const address = await reverseGeocode({ lat, lng });
        if (address) {
          updates.push('startAddress = ?');
          values.push(address);
        }
      }
    }
    if (validated.startAddress !== undefined) {
      updates.push('startAddress = ?');
      values.push(validated.startAddress);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(routeId, userId);

    const query = `UPDATE routes SET ${updates.join(', ')} WHERE id = ? AND createdBy = ?`;
    db.prepare(query).run(...values);

    // 取得更新後的路線
    const updatedRoute = db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId) as any;

    // 將 geojson 字串解析為 JSON 物件
    const parsedRoute = {
      ...updatedRoute,
      geojson: updatedRoute.geojson ? JSON.parse(updatedRoute.geojson) : null
    };

    res.json(parsedRoute);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.reduce((acc, issue) => {
        const field = issue.path.join('.');
        acc[field] = issue.message;
        return acc;
      }, {} as Record<string, string>);
      
      return res.status(400).json({ 
        error: 'Validation failed', 
        fieldErrors,
        details: error.issues 
      });
    }
    console.error('Update route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/routes/:id
router.delete('/:id', (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const routeId = parseInt(req.params.id);

    // 檢查路線是否存在且屬於使用者
    const existingRoute = db.prepare(
      'SELECT * FROM routes WHERE id = ? AND createdBy = ?'
    ).get(routeId, userId);

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // 刪除路線
    db.prepare('DELETE FROM routes WHERE id = ? AND createdBy = ?').run(routeId, userId);

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
