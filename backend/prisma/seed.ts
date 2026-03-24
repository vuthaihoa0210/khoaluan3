import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seed dữ liệu...');

  // 1. Xóa dữ liệu cũ (thứ tự: child trước parent)
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.userVoucher.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.review.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tạo Admin
  const hashedPassword = await bcrypt.hash('khoaluan', 10);
  await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(' - Đã tạo Admin user');

  // 3. Generators Data
  const domesticLocations = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Đà Lạt', 'Hải Phòng', 'Vũng Tàu', 'Sapa', 'Hạ Long', 'Quy Nhơn', 'Cần Thơ', 'Huế', 'Buôn Ma Thuột', 'Côn Đảo'];
  const intlLocations = ['Singapore', 'Tokyo', 'Seoul', 'Bangkok', 'Paris', 'London', 'New York', 'Dubai', 'Sydney', 'Las Vegas', 'Hong Kong', 'Taipei'];

  const domesticAirports = [
    { city: 'Hà Nội', code: 'HAN' }, { city: 'TP. Hồ Chí Minh', code: 'SGN' },
    { city: 'Đà Nẵng', code: 'DAD' }, { city: 'Nha Trang', code: 'CXR' },
    { city: 'Phú Quốc', code: 'PQC' }, { city: 'Đà Lạt', code: 'DLI' },
    { city: 'Hải Phòng', code: 'HPH' }, { city: 'Huế', code: 'HUI' },
    { city: 'Cần Thơ', code: 'VCA' }, { city: 'Quy Nhơn', code: 'UIH' },
    { city: 'Buôn Ma Thuột', code: 'BMV' }, { city: 'Côn Đảo', code: 'VCS' }
  ];

  const intlAirports = [
    { city: 'Singapore', code: 'SIN' }, { city: 'Tokyo', code: 'NRT' },
    { city: 'Seoul', code: 'ICN' }, { city: 'Bangkok', code: 'BKK' },
    { city: 'Paris', code: 'CDG' }, { city: 'London', code: 'LHR' },
    { city: 'Dubai', code: 'DXB' }, { city: 'Taipei', code: 'TPE' }
  ];

  const domesticAirlines = ['Vietnam Airlines', 'Vietjet Air', 'Bamboo Airways', 'Vietravel Airlines'];
  const intlAirlines = ['Singapore Airlines', 'Japan Airlines', 'Korean Air', 'Emirates', 'Qatar Airways', 'Thai Airways', 'EVA Air'];

  const hotelBrands = ['Vinpearl Resort', 'Khách sạn Mường Thanh', 'Novotel', 'InterContinental', 'Pullman', 'Victoria', 'Sheraton', 'Melia', 'Silk Path', 'FLC Resort'];
  const hotelSuffixes = ['Center', 'Boutique', 'Riverside', 'Beach Resort', 'Luxury', 'Grand', 'Spa & Resort'];

  function getFlightImage(airline: string): string {
    if (airline.includes('Vietnam Airlines')) return '/images/imgflight1.jpg';
    if (airline.includes('Vietjet')) return '/images/imgflight2.jpg';
    if (airline.includes('Bamboo')) return '/images/imgflight3.jpg';
    const otherImages = ['/images/imgflight4.jpg', '/images/imgflight5.jpg'];
    return otherImages[Math.floor(Math.random() * otherImages.length)];
  }

  function generateItinerary(location: string, days: number): string {
    const morning = ['Tham quan bảo tàng địa phương', 'Leo núi ngắm cảnh thiên nhiên', 'Đi dạo phố cổ và chụp ảnh', 'Check-in tại các địa điểm nổi tiếng', 'Tham quan di tích lịch sử văn hóa', 'Khám phá chợ địa phương', 'Viếng chùa cầu may mắn'];
    const noon = ['Ăn trưa tại nhà hàng đặc sản', 'Thưởng thức ẩm thực đường phố', 'Dùng bữa cơm niêu truyền thống', 'Tiệc buffet tại khách sạn', 'Nghỉ ngơi nạp năng lượng'];
    const afternoon = ['Tắm biển và tham gia trò chơi nước', 'Mua sắm quà lưu niệm tại trung tâm', 'Thư giãn tại Spa & Massage tri liệu', 'Tham quan làng nghề truyền thống', 'Tự do khám phá thành phố', 'Tham gia lớp học nấu ăn địa phương'];
    const evening = ['Dạo chợ đêm sầm uất', 'Thưởng thức cafe view ngắm thành phố', 'Xem biểu diễn nghệ thuật thực cảnh', 'Party sôi động tại Sky Bar', 'Ăn tối trên du thuyền', 'Đi dạo phố đi bộ'];

    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const itinerary = [];
    for (let i = 1; i <= days; i++) {
      itinerary.push({
        day: i,
        title: `Ngày ${i}: Khám phá vẻ đẹp ${location}`,
        activities: [
          { time: 'Sáng', description: `${getRandom(morning)}. Trải nghiệm tại ${location}.` },
          { time: 'Trưa', description: `${getRandom(noon)}.` },
          { time: 'Chiều', description: `${getRandom(afternoon)}.` },
          { time: 'Tối', description: `${getRandom(evening)}.` }
        ]
      });
    }
    return JSON.stringify(itinerary);
  }

  let flightCodeCounter = 1000;
  // Generate Flights
  for (let i = 0; i < domesticAirports.length; i++) {
    for (let j = 0; j < domesticAirports.length; j++) {
      if (i !== j) {
        for (let k = 0; k < 2; k++) {
          const airline = domesticAirlines[Math.floor(Math.random() * domesticAirlines.length)];
          const f = { from: domesticAirports[i].city, to: domesticAirports[j].city, airline, code: `${airline.substring(0, 2).toUpperCase()}${flightCodeCounter++}` };
          await prisma.flight.create({
            data: {
              name: `Vé máy bay ${f.from} đi ${f.to} (${f.airline})`,
              code: f.code,
              description: `Chuyến bay ${f.code} khởi hành từ ${f.from} đến ${f.to}. Hãng hàng không ${f.airline} cam kết mang đến dịch vụ chất lượng cao.`,
              location: f.to,
              price: 1000000 + Math.random() * 2500000,
              image: getFlightImage(f.airline),
              rating: 4 + Math.random(),
              category: 'DOMESTIC'
            }
          });
        }
      }
    }
  }

  const mainCities = [domesticAirports[0], domesticAirports[1], domesticAirports[2]];
  for (const domestic of mainCities) {
    for (const intl of intlAirports) {
      const airline = intlAirlines[Math.floor(Math.random() * intlAirlines.length)];
      const code = `${airline.substring(0, 2).toUpperCase()}${flightCodeCounter++}`;
      await prisma.flight.create({
        data: {
          name: `Vé quốc tế ${domestic.city} - ${intl.city} (${airline})`,
          code: code,
          description: `Chuyến bay quốc tế ${code} của hãng ${airline}. Hành trình từ ${domestic.city} đến ${intl.city}.`,
          location: intl.city,
          price: 4000000 + Math.random() * 15000000,
          image: getFlightImage(airline),
          rating: 4.2 + Math.random() * 0.8,
          category: 'INTERNATIONAL'
        }
      });
      const codeRev = `${airline.substring(0, 2).toUpperCase()}${flightCodeCounter++}`;
      await prisma.flight.create({
        data: {
          name: `Vé quốc tế ${intl.city} - ${domestic.city} (${airline})`,
          code: codeRev,
          description: `Chuyến bay quốc tế ${codeRev} của hãng ${airline}. Hành trình từ ${intl.city} đến ${domestic.city}.`,
          location: domestic.city,
          price: 4000000 + Math.random() * 15000000,
          image: getFlightImage(airline),
          rating: 4.2 + Math.random() * 0.8,
          category: 'INTERNATIONAL'
        }
      });
    }
  }
  console.log(' - Đã seed Flights tự động');

  // Generate Tours
  for (const loc of domesticLocations) {
    for (let i = 1; i <= 3; i++) {
      await prisma.tour.create({
        data: {
          name: `Tour Khám Phá ${loc} ${i + 2}N${i + 1}Đ`,
          description: `Hành trình được thiết kế chi tiết đưa du khách đến với ${loc}. Quý khách sẽ được tham quan các địa điểm nổi tiếng, nghỉ ngơi tại hệ thống khách sạn tiện nghi.`,
          location: loc,
          price: 2000000 + Math.random() * 4000000,
          image: `/images/imgtour${Math.floor(Math.random() * 20) + 1}.jpg`,
          rating: 4.0 + Math.random(),
          category: 'DOMESTIC',
          itinerary: generateItinerary(loc, i + 2)
        }
      });
    }
  }

  for (const loc of intlLocations) {
    for (let i = 1; i <= 3; i++) {
      await prisma.tour.create({
        data: {
          name: `Tour Trải Nghiệm ${loc} ${i + 3}N${i + 2}Đ`,
          description: `Cơ hội tuyệt vời để đặt chân đến ${loc} và chiêm ngưỡng những kỳ quan. Lịch trình tour được tối ưu hóa để quý khách có thời gian tham quan phong phú.`,
          location: loc,
          price: 8000000 + Math.random() * 20000000,
          image: `/images/imgtour${Math.floor(Math.random() * 20) + 21}.jpg`,
          rating: 4.3 + Math.random() * 0.7,
          category: 'INTERNATIONAL',
          itinerary: generateItinerary(loc, i + 3)
        }
      });
    }
  }
  console.log(' - Đã seed Tours tự động');

  // Generate Hotels
  for (const loc of domesticLocations) {
    for (let i = 1; i <= 8; i++) {
      const brand = hotelBrands[Math.floor(Math.random() * hotelBrands.length)];
      const suffix = hotelSuffixes[Math.floor(Math.random() * hotelSuffixes.length)];
      const hName = `${brand} ${loc} ${suffix}`;
      await prisma.hotel.create({
        data: {
          name: hName,
          description: `Chào mừng bạn đến với ${hName}, thiên đường nghỉ dưỡng tại ${loc}. Hệ thống phòng nghỉ sang trọng với tầm nhìn tuyệt đẹp.`,
          location: loc,
          price: 1500000 + Math.random() * 5000000,
          image: `/images/imghotel${Math.floor(Math.random() * 20) + 1}.jpg`,
          rating: 4.0 + Math.random(),
          category: 'DOMESTIC'
        }
      });
    }
  }

  for (const loc of intlLocations) {
    for (let i = 1; i <= 8; i++) {
      const brand = hotelBrands[Math.floor(Math.random() * hotelBrands.length)];
      const suffix = hotelSuffixes[Math.floor(Math.random() * hotelSuffixes.length)];
      const hName = `${brand} ${loc} ${suffix}`;
      await prisma.hotel.create({
        data: {
          name: hName,
          description: `Trải nghiệm phong cách sống thượng lưu tại ${hName}, biểu tượng của sự sang trọng tại ${loc}.`,
          location: loc,
          price: 5000000 + Math.random() * 10000000,
          image: `/images/imghotel${Math.floor(Math.random() * 20) + 21}.jpg`,
          rating: 4.5 + Math.random() * 0.5,
          category: 'INTERNATIONAL'
        }
      });
    }
  }
  console.log(' - Đã seed Hotels tự động');

  // 6. Seed Vouchers
  const vouchers = [
    { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrderValue: 0, maxDiscount: 500000, startDate: new Date(), endDate: new Date('2026-12-31'), category: 'ALL' },
    { code: 'STAY2026', type: 'AMOUNT', value: 200000, minOrderValue: 1500000, maxDiscount: null, startDate: new Date(), endDate: new Date('2026-12-31'), category: 'HOTEL' },
    { code: 'TOUR500', type: 'AMOUNT', value: 500000, minOrderValue: 5000000, maxDiscount: null, startDate: new Date(), endDate: new Date('2026-12-31'), category: 'TOUR' },
    { code: 'FLYHIGH', type: 'PERCENT', value: 5, minOrderValue: 2000000, maxDiscount: 200000, startDate: new Date(), endDate: new Date('2026-12-31'), category: 'FLIGHT' },
    { code: 'TET2026', type: 'AMOUNT', value: 500000, minOrderValue: 2000000, maxDiscount: null, startDate: new Date(), endDate: new Date('2026-02-28'), category: 'ALL' },
    { code: 'SUMMER2026', type: 'PERCENT', value: 15, minOrderValue: 1000000, maxDiscount: 1000000, startDate: new Date(), endDate: new Date('2026-08-31'), category: 'ALL' }
  ];

  for (const v of vouchers) {
    const voucher = await prisma.voucher.create({
      data: {
        code: v.code,
        type: v.type,
        value: v.value,
        minOrderValue: v.minOrderValue,
        maxDiscount: v.maxDiscount,
        startDate: v.startDate,
        endDate: v.endDate,
        category: v.category
      }
    });

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
    if (adminUser) {
      await prisma.userVoucher.create({
        data: { userId: adminUser.id, voucherId: voucher.id }
      });
    }
  }
  console.log(' - Đã seed Vouchers');

  // 7. Seed Reviews
  const mockUsers = [
    { email: 'huyen@gmail.com', name: 'Nguyễn Thị Huyền' },
    { email: 'lananh@gmail.com', name: 'Phạm Thị Lan Anh' },
    { email: 'hoang@gmail.com', name: 'Trần Minh Hoàng' },
    { email: 'tu@gmail.com', name: 'Lê Ngọc Tú' },
    { email: 'mai@gmail.com', name: 'Đặng Thanh Mai' },
  ];

  const createdUsers = [];
  const hashedUserPassword = await bcrypt.hash('123456', 10);

  for (const user of mockUsers) {
    const u = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        password: hashedUserPassword,
        role: 'USER'
      }
    });
    createdUsers.push(u);
  }
  console.log(' - Đã tạo Mock Users cho Reviews');

  if (createdUsers.length > 0) {
    const flights = await prisma.flight.findMany({ take: 10 });
    const tours = await prisma.tour.findMany({ take: 10 });
    const hotels = await prisma.hotel.findMany({ take: 10 });

    const reviewComments = [
      "Sản phẩm tuyệt vời, dịch vụ rất tốt!",
      "Tôi rất hài lòng với trải nghiệm này. Sẽ quay lại lần sau.",
      "Chất lượng vượt mong đợi, nhân viên nhiệt tình.",
      "Giá cả hợp lý, dịch vụ chuyên nghiệp.",
      "Rất đáng tiền, mọi thứ đều hoàn hảo!",
      "Chuyến đi rất vui, mọi thứ được sắp xếp chu đáo.",
      "Phòng sạch sẽ, view đẹp, phục vụ tận tâm.",
      "Đặt vé nhanh chóng, hỗ trợ khách hàng tốt.",
      "Trải nghiệm tuyệt vời cùng gia đình, cảm ơn đội ngũ!",
      "Dịch vụ đẳng cấp, đáng để trải nghiệm."
    ];

    for (const flight of flights) {
      const numReviews = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numReviews; i++) {
        await prisma.review.create({
          data: {
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
            type: 'FLIGHT', itemId: flight.id, rating: 5,
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)]
          }
        });
      }
    }

    for (const tour of tours) {
      const numReviews = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numReviews; i++) {
        await prisma.review.create({
          data: {
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
            type: 'TOUR', itemId: tour.id, rating: 5,
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)]
          }
        });
      }
    }

    for (const hotel of hotels) {
      const numReviews = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numReviews; i++) {
        await prisma.review.create({
          data: {
            userId: createdUsers[Math.floor(Math.random() * createdUsers.length)].id,
            type: 'HOTEL', itemId: hotel.id, rating: 5,
            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)]
          }
        });
      }
    }
    console.log(' - Đã seed Reviews với tên người dùng thực');
  }

  console.log('Seed dữ liệu hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });