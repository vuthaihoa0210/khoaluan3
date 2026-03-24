'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Badge, Button, Card, Spin, Tag, Typography, message, Empty } from 'antd';
import { MessageOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

interface ChatRoom {
  id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; email: string };
  messages: { id: number; content: string; senderRole: string; createdAt: string }[];
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderRole: string;
  content: string;
  createdAt: string;
}

export default function AdminChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [newMsgRooms, setNewMsgRooms] = useState<Set<number>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const selectedRoomRef = useRef<ChatRoom | null>(null);

  // Keep ref in sync with state
  useEffect(() => { selectedRoomRef.current = selectedRoom; }, [selectedRoom]);

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
    else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      message.error('Bạn không có quyền truy cập');
    }
  }, [status, session, router]);

  // Fetch all rooms
  const fetchRooms = async () => {
    if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/chat/rooms`);
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch { message.error('Lỗi tải danh sách chat'); }
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') fetchRooms();
  }, [status, session]);

  // Socket.IO for admin
  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') return;
    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // New room created by user
    socket.on('new_room', (room: ChatRoom) => {
      setRooms(prev => {
        if (prev.find(r => r.id === room.id)) return prev;
        return [{ ...room, messages: [] }, ...prev];
      });
      setNewMsgRooms(prev => { const next = new Set(prev); next.add(room.id); return next; });
    });

    // New message in any room
    socket.on('new_message_notification', ({ roomId, message: msg }: { roomId: number; message: ChatMessage }) => {
      setRooms(prev => prev.map(r =>
        r.id === roomId ? { ...r, messages: [msg], updatedAt: msg.createdAt } : r
      ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

      setNewMsgRooms(prev => {
        const next = new Set(prev);
        if (selectedRoomRef.current?.id !== roomId) next.add(roomId);
        return next;
      });
    });

    // Message in selected room - skip ADMIN messages (already have optimistic update)
    socket.on('receive_message', (msg: ChatMessage) => {
      if (msg.senderRole === 'ADMIN') return; // Already shown via optimistic update
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Room closed by admin (update current selected)
    socket.on('room_closed', ({ roomId }: { roomId: number }) => {
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'CLOSED' } : r));
      setSelectedRoom(prev => prev?.id === roomId ? { ...prev, status: 'CLOSED' } : prev);
    });

    return () => { socket.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  // Select room
  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    setNewMsgRooms(prev => { const next = new Set(prev); next.delete(room.id); return next; });

    // Join socket room
    socketRef.current?.emit('join_room', room.id);

    // Load messages
    try {
      const res = await fetch(`${BACKEND}/api/chat/rooms/${room.id}/messages`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch { message.error('Lỗi tải tin nhắn'); }
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Admin send message
  const sendMessage = () => {
    if (!input.trim() || !selectedRoom || !socketRef.current) return;
    const adminId = (session?.user as { id?: number | string })?.id;
    if (!adminId) return;
    const content = input.trim();
    setInput('');
    // Optimistic update: append immediately so admin sees their own message
    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      roomId: selectedRoom.id,
      senderId: Number(adminId),
      senderRole: 'ADMIN',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    socketRef.current.emit('send_message', {
      roomId: selectedRoom.id,
      senderId: Number(adminId),
      senderRole: 'ADMIN',
      content,
    });
  };

  // Close room
  const closeRoom = async (roomId: number) => {
    try {
      await fetch(`${BACKEND}/api/chat/rooms/${roomId}/close`, { method: 'PATCH' });
      message.success('Đã đóng hội thoại');
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'CLOSED' } : r));
      if (selectedRoom?.id === roomId) setSelectedRoom(prev => prev ? { ...prev, status: 'CLOSED' } : null);
    } catch { message.error('Lỗi đóng hội thoại'); }
  };

  if (status === 'loading') return (
    <div style={{ textAlign: 'center', padding: 100 }}>
      <Spin size="large"><div style={{ height: 50 }} /></Spin>
    </div>
  );

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') return null;

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f0f5ff' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>
          <MessageOutlined style={{ marginRight: 10, color: '#1677ff' }} />
          Quản lý Chat Hỗ trợ
        </Title>
        <Button icon={<ReloadOutlined />} onClick={fetchRooms}>Làm mới</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, height: 'calc(100vh - 160px)' }}>
        {/* Room List */}
        <Card
          styles={{ body: { padding: 0, height: '100%', overflowY: 'auto' } }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
          title={<span style={{ fontWeight: 700 }}>Hội thoại ({rooms.length})</span>}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : rooms.length === 0 ? (
            <Empty description="Chưa có hội thoại nào" style={{ padding: 40 }} />
          ) : (
            rooms.map(room => {
              const lastMsg = room.messages?.[0];
              const isSelected = selectedRoom?.id === room.id;
              const hasNew = newMsgRooms.has(room.id);
              return (
                <div
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    background: isSelected ? '#e6f4ff' : hasNew ? '#fff7e6' : '#fff',
                    borderLeft: isSelected ? '3px solid #1677ff' : '3px solid transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg,#1677ff,#0958d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                      }}>
                        {room.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{room.user.name || room.user.email}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{room.user.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <Tag color={room.status === 'OPEN' ? 'green' : 'default'} style={{ fontSize: 11, margin: 0 }}>
                        {room.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                      </Tag>
                      {hasNew && <Badge dot />}
                    </div>
                  </div>
                  {lastMsg && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: lastMsg.senderRole === 'ADMIN' ? '#1677ff' : '#333', fontWeight: lastMsg.senderRole === 'ADMIN' ? 600 : 400 }}>
                        {lastMsg.senderRole === 'ADMIN' ? 'Bạn: ' : `${room.user.name}: `}
                      </span>
                      {lastMsg.content}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                    {new Date(room.updatedAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {/* Chat Panel */}
        {selectedRoom ? (
          <Card
            style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1677ff,#0958d9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                  }}>{selectedRoom.user.name?.[0]?.toUpperCase() || 'U'}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selectedRoom.user.name}</div>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>{selectedRoom.user.email}</div>
                  </div>
                </div>
                {selectedRoom.status === 'OPEN' && (
                  <Button
                    danger icon={<CloseCircleOutlined />} size="small"
                    onClick={() => closeRoom(selectedRoom.id)}
                  >Đóng hội thoại</Button>
                )}
              </div>
            }
          >
            {/* Messages */}
            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f7f9fc' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: 14 }}>
                  Chưa có tin nhắn nào trong hội thoại này
                </div>
              )}
              {messages.map(msg => {
                const isAdmin = msg.senderRole === 'ADMIN';
                return (
                  <div key={msg.id} style={{
                    display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}>
                    {!isAdmin && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#1677ff,#0958d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 13, fontWeight: 700,
                        marginRight: 8, alignSelf: 'flex-end',
                      }}>{selectedRoom.user.name?.[0]?.toUpperCase() || 'U'}</div>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      {!isAdmin && (
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 2, marginLeft: 2 }}>
                          {selectedRoom.user.name}
                        </div>
                      )}
                      <div style={{
                        background: isAdmin ? 'linear-gradient(135deg,#1677ff,#0958d9)' : '#fff',
                        color: isAdmin ? '#fff' : '#333',
                        borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 14px', fontSize: 14, lineHeight: 1.5,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }}>{msg.content}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 3, textAlign: isAdmin ? 'right' : 'left' }}>
                        {new Date(msg.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#52c41a,#389e0d)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, marginLeft: 8, alignSelf: 'flex-end',
                      }}>👨‍💼</div>
                    )}
                  </div>
                );
              })}

            </div>

            {/* Input */}
            {selectedRoom.status === 'OPEN' ? (
              <div style={{
                padding: '12px 16px', background: '#fff', borderTop: '1px solid #f0f0f0',
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                  placeholder="Nhập phản hồi..."
                  style={{
                    flex: 1, border: '1.5px solid #e0e8ff', borderRadius: 24,
                    padding: '10px 18px', fontSize: 14, outline: 'none',
                    background: '#f7f9fc', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1677ff')}
                  onBlur={e => (e.target.style.borderColor = '#e0e8ff')}
                />
                <button onClick={sendMessage} style={{
                  width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: input.trim() ? 'linear-gradient(135deg,#1677ff,#0958d9)' : '#e0e0e0',
                  color: '#fff', fontSize: 20, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}>➤</button>
              </div>
            ) : (
              <div style={{
                padding: '12px 16px', background: '#f9f9f9', borderTop: '1px solid #f0f0f0',
                textAlign: 'center', color: '#999', fontSize: 13,
              }}>
                Hội thoại này đã được đóng
              </div>
            )}
          </Card>
        ) : (
          <Card style={{ borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#aaa', padding: 60 }}>
              <MessageOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d0e4ff' }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Chọn một hội thoại</div>
              <div style={{ fontSize: 13 }}>Chọn hội thoại từ danh sách bên trái để bắt đầu trả lời</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
