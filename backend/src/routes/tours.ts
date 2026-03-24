import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all tours
router.get('/', async (req: Request, res: Response) => {
    try {
        const tours = await prisma.tour.findMany();
        res.json(tours);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tours' });
    }
});

// Get tour by ID
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tour = await prisma.tour.findUnique({
            where: { id: Number(id) },
        });
        if (!tour) {
            res.status(404).json({ error: 'Tour not found' });
            return
        }
        res.json(tour);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tour' });
    }
});

export default router;
