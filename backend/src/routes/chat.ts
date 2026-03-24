import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export function createChatRouter(io: Server) {
  const router = Router();

  // POST /api/chat/rooms - Tạo phòng chat mới hoặc lấy phòng hiện có (OPEN)
  router.post('/rooms', async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;
      if (!userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const existing = await prisma.chatRoom.findFirst({
        where: { userId: Number(userId), status: 'OPEN' },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      if (existing) {
        res.json(existing);
        return;
      }

      // Create new room
      const room = await prisma.chatRoom.create({
        data: { userId: Number(userId) },
        include: {
          messages: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      // Notify admin panel of new room
      io.emit('new_room', room);

      res.json(room);
    } catch (err) {
      console.error('[CHAT] POST /rooms error:', err);
      res.status(500).json({ error: 'Server error', detail: String(err) });
    }
  });

  // GET /api/chat/rooms - Admin lấy tất cả rooms
  router.get('/rooms', async (_req: Request, res: Response): Promise<void> => {
    try {
      const rooms = await prisma.chatRoom.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/chat/rooms/:id/messages - Lấy lịch sử tin nhắn
  router.get('/rooms/:id/messages', async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = Number(req.params.id);
      const messages = await prisma.chatMessage.findMany({
        where: { roomId },
        orderBy: { createdAt: 'asc' },
      });
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // PATCH /api/chat/rooms/:id/close - Admin đóng room
  router.patch('/rooms/:id/close', async (req: Request, res: Response): Promise<void> => {
    try {
      const roomId = Number(req.params.id);
      const room = await prisma.chatRoom.update({
        where: { id: roomId },
        data: { status: 'CLOSED' },
      });
      // Notify user in room that it's closed
      io.to(`room_${roomId}`).emit('room_closed', { roomId });
      res.json(room);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}
