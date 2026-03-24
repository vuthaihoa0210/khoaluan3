import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
    try {
        const flights = await prisma.flight.findMany();
        res.json(flights);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch flights' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const flight = await prisma.flight.findUnique({
            where: { id: Number(id) },
        });
        if (!flight) {
            res.status(404).json({ error: 'Flight not found' });
            return;
        }
        res.json(flight);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch flight' });
    }
});

export default router;
