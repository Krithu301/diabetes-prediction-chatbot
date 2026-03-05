import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'diabetes_app',
  waitForConnections: true,
  connectionLimit: 10,
};
let pool;
export async function initDb(){
  const tmp = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });
  await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'diabetes_app'}\``);
  await tmp.end();
  pool = mysql.createPool(poolConfig);
  const createUsers = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200),
    email VARCHAR(200) UNIQUE,
    password_hash VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;
  await pool.query(createUsers);
  const createPred = `CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user JSON,
    input JSON,
    output JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`;
  await pool.query(createPred);
  const createUserInfo = `CREATE TABLE IF NOT EXISTS user_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    info JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`;
  await pool.query(createUserInfo);
}
export async function saveUser({ name, email, password_hash }){
  const [res] = await pool.execute('INSERT INTO users (name,email,password_hash) VALUES (?,?,?)', [name,email,password_hash]);
  return res.insertId;
}
export async function findUserByEmail(email){
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows && rows.length? rows[0] : null;
}
export async function getUserById(id){
  const [rows] = await pool.query('SELECT id,name,email FROM users WHERE id = ?', [id]);
  return rows && rows.length? rows[0] : null;
}
export async function saveUserInfo(user_id, info){
  const existing = await pool.query('SELECT id FROM user_info WHERE user_id = ?', [user_id]);
  if(existing && existing[0] && existing[0].length){
    await pool.execute('UPDATE user_info SET info = ? WHERE user_id = ?', [JSON.stringify(info), user_id]);
  } else {
    await pool.execute('INSERT INTO user_info (user_id, info) VALUES (?, ?)', [user_id, JSON.stringify(info)]);
  }
}
export async function getUserInfo(user_id){
  const [rows] = await pool.query('SELECT info, updated_at FROM user_info WHERE user_id = ?', [user_id]);
  return rows && rows.length? rows[0] : null;
}
export async function savePrediction({ user_id, user, input, output }){
  const [res] = await pool.execute('INSERT INTO predictions (user_id, user, input, output) VALUES (?,?,?,?)', [user_id, user, input, output]);
  return res.insertId;
}
export async function fetchHistoryForUser(user_id, limit=200){
  const [rows] = await pool.query('SELECT id, user, input, output, created_at FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [user_id, limit]);
  return rows;
}
export async function fetchById(id){
  const [rows] = await pool.query('SELECT * FROM predictions WHERE id = ?', [id]);
  return rows && rows.length? rows[0] : null;
}
// ✅ Clear all predictions for a specific user
export async function clearHistoryForUser(userId) {
  const [result] = await pool.query('DELETE FROM history WHERE user_id = ?', [userId]);
  return result;
}

