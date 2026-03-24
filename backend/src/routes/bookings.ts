
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create a booking
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, type, itemId, itemName, startDate, endDate, price, customerName, customerPhone, totalPeople, seatClass, voucherCode } = req.body;

        if (!userId || !type || !itemId || !startDate || !price || !customerName || !customerPhone) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        let discountAmount = 0;
        let finalPrice = price;

        // Verify and Apply Voucher
        if (voucherCode) {
            const voucher = await prisma.voucher.findUnique({
                where: { code: voucherCode }
            });

            if (voucher && voucher.isActive) {
                const now = new Date();
                if (now >= voucher.startDate && now <= voucher.endDate) {
                    if (price >= voucher.minOrderValue) {
                        // Check if user has ALREADY USED this voucher
                        let userVoucher = await prisma.userVoucher.findFirst({
                            where: {
                                userId: Number(userId),
                                voucherId: voucher.id,
                            }
                        });

                        if (userVoucher && userVoucher.isUsed) {
                            // Cannot use again
                            console.log("Voucher already used by user");
                        } else {
                            // Calculate Discount
                            if (voucher.type === 'PERCENT') {
                                discountAmount = (price * voucher.value) / 100;
                                if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
                                    discountAmount = voucher.maxDiscount;
                                }
                            } else {
                                discountAmount = voucher.value;
                            }
                            if (discountAmount > price) discountAmount = price;
                            finalPrice = price - discountAmount;

                            // Mark as Used (or Create and Mark)
                            if (userVoucher) {
                                await prisma.userVoucher.update({
                                    where: { id: userVoucher.id },
                                    data: { isUsed: true }
                                });
                            } else {
                                await prisma.userVoucher.create({
                                    data: {
                                        userId: Number(userId),
                                        voucherId: voucher.id,
                                        isUsed: true
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        const booking = await prisma.booking.create({
            data: {
                userId: Number(userId),
                type,
                itemId: Number(itemId),
                itemName,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                price,
                customerName,
                customerPhone,
                totalPeople: Number(totalPeople) || 1,
                seatClass,
                voucherCode,
                discountAmount,
                finalPrice,
                status: 'PENDING'
            }
        });
        res.json(booking);
    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get user bookings
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const bookings = await prisma.booking.findMany({
            where: { userId: Number(userId) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Get all bookings (Admin)
router.get('/', async (req: Request, res: Response) => {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true, email: true } } } // Optional: include user info
        });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Update booking status (Admin)
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await prisma.booking.update({
            where: { id: Number(id) },
            data: { status }
        });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update booking' });
    }
});

export default router;
