const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  connectionLimit: 20,
  queueLimit: 0,
  waitForConnections: true,
});

// 데이터베이스 연결
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to database: " + err.stack);
    return;
  }

  console.log("Connected to database as ID " + connection.threadId);
  connection.release();
});

module.exports = db;
