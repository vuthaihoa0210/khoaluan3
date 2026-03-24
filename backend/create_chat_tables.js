// Script tạo bảng ChatRoom và ChatMessage trực tiếp
const path = require('path');
const fs = require('fs');

// Path to the SQLite database
const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
console.log('DB path:', dbPath);
console.log('DB exists:', fs.existsSync(dbPath));

// Try to use sqlite3 module
try {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS "ChatRoom" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('ChatRoom error:', err.message);
      else console.log('✅ ChatRoom table created/exists');
    });

    db.run(`CREATE TABLE IF NOT EXISTS "ChatMessage" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "roomId" INTEGER NOT NULL,
      "senderId" INTEGER NOT NULL,
      "senderRole" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('ChatMessage error:', err.message);
      else console.log('✅ ChatMessage table created/exists');
    });

    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) console.error(err);
      else console.log('All tables:', rows.map(r => r.name).join(', '));
      db.close();
    });
  });
} catch (e) {
  console.error('sqlite3 not available:', e.message);
  console.log('\nSolution: Stop the backend, then run: npx prisma db push');
}
