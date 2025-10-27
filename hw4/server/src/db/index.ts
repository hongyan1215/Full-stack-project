import Database from 'better-sqlite3';
import path from 'path';
import { initSchema, seed } from './schema';

const dbPath = path.join(__dirname, '../../db/data.db');
const db = new Database(dbPath);

// 啟用外鍵約束
db.pragma('foreign_keys = ON');

export const initDB = () => {
  console.log('Database initialized at:', dbPath);
  initSchema();
  seed();
};

export default db; 