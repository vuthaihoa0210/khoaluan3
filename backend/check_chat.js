// Script kiểm tra bảng ChatRoom và ChatMessage trong SQLite
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:./dev.db' } }
});

async function main() {
  try {
    // Check tables exist
    const tables = await prisma.$queryRawUnsafe(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    );
    console.log('📋 All tables:', JSON.stringify(tables));

    // Try to count ChatRoom records
    const rooms = await prisma.chatRoom.count();
    console.log('✅ ChatRoom count:', rooms);

    const msgs = await prisma.chatMessage.count();
    console.log('✅ ChatMessage count:', msgs);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('Full:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
