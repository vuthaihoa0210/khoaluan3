import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get reviews for a specific item
router.get('/:type/:itemId', async (req: Request, res: Response) => {
    try {
        const { type, itemId } = req.params;
        const reviews = await prisma.review.findMany({
            where: {
                type: (type as string).toUpperCase(),
                itemId: Number(itemId),
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Post a new review
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, type, itemId, rating, comment } = req.body;

        if (!userId || !type || !itemId || !rating || !comment) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const uId = Number(userId);
        const iId = Number(itemId);
        const rVal = Number(rating);

        if (isNaN(uId) || isNaN(iId) || isNaN(rVal)) {
            res.status(400).json({ error: 'Invalid ID or rating format' });
            return;
        }

        const review = await prisma.review.create({
            data: {
                userId: uId,
                type: type.toUpperCase(),
                itemId: iId,
                rating: rVal,
                comment,
            },
            include: {
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        res.status(201).json(review);
    } catch (error: any) {
        console.error('Error creating review:', error);
        
        // Handle Stale Session (User no longer exists in DB after seed)
        if (error.code === 'P2003') {
            res.status(401).json({ 
                error: 'Unauthorized', 
                details: 'Người dùng không tồn tại. Vui lòng đăng xuất và đăng nhập lại để làm mới phiên làm việc.',
                code: 'P2003'
            });
            return;
        }

        res.status(500).json({ 
            error: 'Failed to create review', 
            details: error.message,
            code: error.code
        });
    }
});

export default router;
