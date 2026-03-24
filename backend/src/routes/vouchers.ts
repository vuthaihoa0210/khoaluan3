import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get Vouchers for a User
router.get('/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const userVouchers = await prisma.userVoucher.findMany({
            where: {
                userId: Number(userId),
                isUsed: false,
                voucher: {
                    isActive: true,
                    endDate: { gte: new Date() } // Not expired
                }
            },
            include: { voucher: true }
        });
        res.json(userVouchers.map(uv => uv.voucher));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
});

// Get Available Vouchers (Public/Active)
router.get('/available', async (req: Request, res: Response) => {
    try {
        const vouchers = await prisma.voucher.findMany({
            where: {
                isActive: true,
                endDate: { gte: new Date() }
            }
        });
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch vouchers' });
    }
});

// Check/Validate Voucher
router.post('/check', async (req: Request, res: Response) => {
    try {
        const { code, orderValue, userId } = req.body;

        const voucher = await prisma.voucher.findUnique({
            where: { code }
        });

        if (!voucher) {
            res.status(404).json({ valid: false, message: 'Invalid voucher code' });
            return;
        }

        if (!voucher.isActive) {
            res.status(400).json({ valid: false, message: 'Voucher is inactive' });
            return;
        }

        const now = new Date();
        if (now < voucher.startDate || now > voucher.endDate) {
            res.status(400).json({ valid: false, message: 'Voucher is expired or not ready' });
            return;
        }

        if (orderValue < voucher.minOrderValue) {
            res.status(400).json({
                valid: false,
                message: `Order value must be at least ${voucher.minOrderValue.toLocaleString()} VND`
            });
            return;
        }

        // Check if user has ALREADY USED this voucher
        if (userId) {
            const userVoucher = await prisma.userVoucher.findFirst({
                where: {
                    userId: Number(userId),
                    voucherId: voucher.id
                }
            });

            if (userVoucher && userVoucher.isUsed) {
                res.status(400).json({ valid: false, message: 'Voucher already used' });
                return;
            }
        }

        // Calculate Discount
        let discount = 0;
        if (voucher.type === 'PERCENT') {
            discount = (orderValue * voucher.value) / 100;
            if (voucher.maxDiscount && discount > voucher.maxDiscount) {
                discount = voucher.maxDiscount;
            }
        } else {
            discount = voucher.value;
        }

        // Ensure discount doesn't exceed order value
        if (discount > orderValue) discount = orderValue;

        // Service Type Check
        const { serviceType } = req.body; // FLIGHT, HOTEL, TOUR
        if (voucher.category !== 'ALL' && voucher.category !== serviceType) {
            const serviceMap: any = {
                'HOTEL': 'Khách sạn',
                'FLIGHT': 'Chuyến bay',
                'TOUR': 'Tour'
            };
            res.status(400).json({
                valid: false,
                message: `Mã này chỉ áp dụng cho dịch vụ ${serviceMap[voucher.category] || voucher.category}`
            });
            return;
        }

        res.json({
            valid: true,
            discountAmount: discount,
            finalPrice: orderValue - discount,
            voucherId: voucher.id,
            message: 'Voucher applied successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to validate voucher' });
    }
});

export default router;
