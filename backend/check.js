const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const flightCount = await prisma.flight.count();
  const tourCount = await prisma.tour.count();
  const hotelCount = await prisma.hotel.count();
  const reviewCount = await prisma.review.count();
  const userCount = await prisma.review.findMany({ select: { userId: true }, distinct: ['userId'] });
  
  console.log(`Flights: ${flightCount}, Tours: ${tourCount}, Hotels: ${hotelCount}`);
  console.log(`Total Reviews: ${reviewCount} (Expected: ${(flightCount + tourCount + hotelCount) * 5})`);
  console.log(`Distinct Users leaving reviews: ${userCount.length}`);
}

main().finally(() => prisma.$disconnect());
