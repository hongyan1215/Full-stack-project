import db from './index';

export const initSchema = () => {
  // 建立 users 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 建立 routes 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      distanceMeters REAL DEFAULT 0,
      startedAt DATETIME,
      finishedAt DATETIME,
      geojson TEXT NOT NULL CHECK(json_valid(geojson)),
      startAddress TEXT,
      createdBy INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 建立索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_routes_user_date 
    ON routes(createdBy, createdAt DESC)
  `);

  console.log('Database schema initialized');
};

export const seed = () => {
  // 檢查是否已有使用者
  const userExists = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userExists.count === 0) {
    // 建立測試使用者 (password: test123)
    const passwordHash = '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNuY22m';
    
    const insertUser = db.prepare(`
      INSERT INTO users (email, username, passwordHash)
      VALUES (?, ?, ?)
    `);

    const result = insertUser.run('test@example.com', 'testuser', passwordHash);
    const userId = result.lastInsertRowid;

    // 建立測試路線
    const testGeojson = JSON.stringify({
      type: 'LineString',
      coordinates: [
        [121.5654, 25.0330],
        [121.5674, 25.0350],
        [121.5694, 25.0370]
      ]
    });

    const insertRoute = db.prepare(`
      INSERT INTO routes (title, description, distanceMeters, geojson, startAddress, createdBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertRoute.run(
      '台北測試路線',
      '這是一條測試路線',
      500,
      testGeojson,
      '台北市信義區',
      userId
    );

    console.log('Database seeded with test data');
  } else {
    console.log('Database already seeded');
  }
};
