import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
    try {
        const hotels = await prisma.hotel.findMany();
        res.json(hotels);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hotels' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const hotel = await prisma.hotel.findUnique({
            where: { id: Number(id) },
        });
        if (!hotel) {
            res.status(404).json({ error: 'Hotel not found' });
            return;
        }
        res.json(hotel);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hotel' });
    }
});

export default router;
