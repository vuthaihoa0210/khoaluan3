const fs = require('fs');
let content = fs.readFileSync('c:/Users/Admin/Documents/KHOALUAN3/backend/prisma/seed.ts', 'utf8');

content = content.replace(
  /const flights = await prisma\.flight\.findMany\(\{ take: 10 \}\);\s*const tours = await prisma\.tour\.findMany\(\{ take: 10 \}\);\s*const hotels = await prisma\.hotel\.findMany\(\{ take: 10 \}\);/,
  'const flights = await prisma.flight.findMany();\n    const tours = await prisma.tour.findMany();\n    const hotels = await prisma.hotel.findMany();\n    console.log(` - Đang tạo đánh giá cho ${flights.length} chuyến bay, ${tours.length} tour, ${hotels.length} khách sạn...`);'
);

content = content.replace(
  /\/\/ Seed Reviews for Flights[\s\S]*?console\.log\(' - Đã seed Reviews với tên người dùng thực'\);/,
  `// Seed Reviews for Flights
    for (const flight of flights) {
      for (const u of createdUsers) {
        await prisma.review.create({
          data: {
            userId: u.id,
            type: 'FLIGHT',
            itemId: flight.id,
            rating: 5,
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)]
          }
        });
      }
    }

    // Seed Reviews for Tours
    for (const tour of tours) {
      for (const u of createdUsers) {
        await prisma.review.create({
          data: {
            userId: u.id,
            type: 'TOUR',
            itemId: tour.id,
            rating: 5,
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)]
          }
        });
      }
    }

    // Seed Reviews for Hotels
    for (const hotel of hotels) {
      for (const u of createdUsers) {
        await prisma.review.create({
          data: {
            userId: u.id,
            type: 'HOTEL',
            itemId: hotel.id,
            rating: 5,
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)]
          }
        });
      }
    }
    console.log(' - Đã seed Reviews với 5 đánh giá (5 người dùng) cho mỗi sản phẩm.');`
);

fs.writeFileSync('c:/Users/Admin/Documents/KHOALUAN3/backend/prisma/seed.ts', content);
