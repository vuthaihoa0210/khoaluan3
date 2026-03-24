const path = require('path');
process.env.DATABASE_URL = "file:" + path.join(__dirname, 'prisma', 'dev.db').replace(/\\/g, '/');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const reviewComments = [
  "Sản phẩm tuyệt vời, dịch vụ rất tốt! Tôi rất hài lòng.",
  "Trải nghiệm tuyệt vời, sẽ quay lại lần sau.",
  "Chất lượng vượt mong đợi, nhân viên nhiệt tình và chu đáo.",
  "Giá cả hợp lý, dịch vụ chuyên nghiệp, rất đáng tiền.",
  "Rất đáng tiền, mọi thứ đều hoàn hảo! Cảm ơn đội ngũ.",
  "Chuyến đi rất vui, mọi thứ được sắp xếp chu đáo và tỉ mỉ.",
  "Phòng sạch sẽ, view đẹp, phục vụ tận tâm. Xuất sắc!",
  "Đặt vé nhanh chóng, hỗ trợ khách hàng tốt, rất tin tưởng.",
  "Trải nghiệm tuyệt vời cùng gia đình. Sẽ giới thiệu cho bạn bè!",
  "Dịch vụ đẳng cấp, rất đáng để trải nghiệm. Không thất vọng.",
  "Mọi thứ đều ổn, đặc biệt là thái độ phục vụ rất tốt.",
  "Tour rất hay, hướng dẫn viên nhiệt tình và am hiểu địa phương.",
  "Phong cảnh đẹp, lịch trình hợp lý, ăn uống ngon. Tuyệt!",
  "Giá tốt so với chất lượng nhận được. Rất hài lòng!",
  "Sẽ đặt lại lần sau, dịch vụ thực sự xứng đáng với tiền bỏ ra.",
];

const mockUsers = [
  { email: 'huyen@gmail.com', name: 'Nguyễn Thị Huyền' },
  { email: 'lananh@gmail.com', name: 'Phạm Thị Lan Anh' },
  { email: 'hoang@gmail.com', name: 'Trần Minh Hoàng' },
  { email: 'tu@gmail.com', name: 'Lê Ngọc Tú' },
  { email: 'mai@gmail.com', name: 'Đặng Thanh Mai' },
  { email: 'hung@gmail.com', name: 'Nguyễn Văn Hùng' },
  { email: 'linh@gmail.com', name: 'Trần Thị Linh' },
  { email: 'nam@gmail.com', name: 'Phạm Văn Nam' },
  { email: 'trang@gmail.com', name: 'Lê Thị Trang' },
  { email: 'duc@gmail.com', name: 'Võ Minh Đức' },
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomRating() {
  // Ratings from 4 to 5 for realistic positive reviews
  return 4 + Math.random();
}

async function main() {
  console.log('🚀 Bắt đầu seed reviews...');

  // 1. Ensure mock users exist
  const hashedPass = await bcrypt.hash('123456', 10);
  const users = [];
  for (const u of mockUsers) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: u.email, name: u.name, password: hashedPass, role: 'USER' }
      });
      console.log(`  ✅ Tạo user: ${u.name}`);
    } else {
      console.log(`  ℹ️  User đã tồn tại: ${u.name}`);
    }
    users.push(user);
  }

  // 2. Delete existing reviews to avoid duplicates
  const deleted = await prisma.review.deleteMany();
  console.log(`  🗑️  Đã xóa ${deleted.count} reviews cũ`);

  // 3. Seed reviews for all Hotels
  const hotels = await prisma.hotel.findMany();
  console.log(`  📦 Tìm thấy ${hotels.length} khách sạn`);
  for (const hotel of hotels) {
    const count = getRandomInt(2, 3);
    const usedUsers = [...users].sort(() => Math.random() - 0.5).slice(0, count);
    for (const user of usedUsers) {
      await prisma.review.create({
        data: {
          userId: user.id,
          type: 'HOTEL',
          itemId: hotel.id,
          rating: getRandomRating(),
          comment: getRandom(reviewComments),
        }
      });
    }
  }
  console.log(`  ✅ Đã tạo reviews cho ${hotels.length} khách sạn`);

  // 4. Seed reviews for all Tours
  const tours = await prisma.tour.findMany();
  console.log(`  📦 Tìm thấy ${tours.length} tour`);
  for (const tour of tours) {
    const count = getRandomInt(2, 3);
    const usedUsers = [...users].sort(() => Math.random() - 0.5).slice(0, count);
    for (const user of usedUsers) {
      await prisma.review.create({
        data: {
          userId: user.id,
          type: 'TOUR',
          itemId: tour.id,
          rating: getRandomRating(),
          comment: getRandom(reviewComments),
        }
      });
    }
  }
  console.log(`  ✅ Đã tạo reviews cho ${tours.length} tour`);

  // 5. Seed reviews for all Flights
  const flights = await prisma.flight.findMany();
  console.log(`  📦 Tìm thấy ${flights.length} chuyến bay`);
  for (const flight of flights) {
    const count = getRandomInt(2, 3);
    const usedUsers = [...users].sort(() => Math.random() - 0.5).slice(0, count);
    for (const user of usedUsers) {
      await prisma.review.create({
        data: {
          userId: user.id,
          type: 'FLIGHT',
          itemId: flight.id,
          rating: getRandomRating(),
          comment: getRandom(reviewComments),
        }
      });
    }
  }
  console.log(`  ✅ Đã tạo reviews cho ${flights.length} chuyến bay`);

  const total = await prisma.review.count();
  console.log(`\n🎉 Hoàn tất! Tổng cộng ${total} reviews đã được tạo.`);
}

main()
  .catch(e => { console.error('❌ Lỗi:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
