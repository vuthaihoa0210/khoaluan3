'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: 'bot' | 'user' | 'admin';
  text: string;
  time: string;
}

interface LiveMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderRole: string;
  content: string;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getTime = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const BOT_NAME = 'TravelEasy AI';

// ── AI Bot Rules ─────────────────────────────────────────────────────────────
const rules: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['xin chào', 'hello', 'hi', 'chào', 'hey'],
    answer: 'Xin chào! 👋 Mình là trợ lý AI của **TravelEasy**. Mình có thể giúp bạn đặt vé, tìm tour, khách sạn hoặc tra cứu ưu đãi. Bạn cần hỗ trợ gì hôm nay?',
  },
  {
    keywords: ['vé máy bay', 'vé bay', 'chuyến bay', 'flight', 'bay'],
    answer: '✈️ **Đặt vé máy bay tại TravelEasy:**\n- Hỗ trợ bay trong nước & quốc tế\n- Nhiều hãng bay: Vietnam Airlines, Vietjet, Bamboo...\n- Giá tốt, đặt nhanh, thanh toán an toàn\n\n👉 Truy cập [Đặt vé máy bay](/flights) để xem ngay!',
  },
  {
    keywords: ['khách sạn', 'phòng', 'nghỉ', 'hotel', 'resort'],
    answer: '🏨 **Đặt phòng khách sạn tại TravelEasy:**\n- Hơn 1.200 khách sạn từ 2★ đến 5★\n- Khu vực trong nước & quốc tế\n- Đặt phòng tức thì, hủy linh hoạt\n\n👉 Xem danh sách tại [Khách sạn](/hotels)!',
  },
  {
    keywords: ['tour', 'lịch trình', 'du lịch', 'tham quan'],
    answer: '🗺️ **Tour du lịch tại TravelEasy:**\n- Tour trong nước: Hà Nội, Đà Nẵng, Nha Trang, Phú Quốc...\n- Tour quốc tế: Singapore, Nhật Bản, Hàn Quốc, Châu Âu...\n- Lịch trình rõ ràng, hướng dẫn viên nhiệt tình\n\n👉 Xem tất cả tour tại [Tour du lịch](/tours)!',
  },
  {
    keywords: ['voucher', 'mã giảm giá', 'ưu đãi', 'khuyến mãi', 'discount', 'coupon'],
    answer: '🎟️ **Ưu đãi & Voucher TravelEasy:**\n- **WELCOME10**: Giảm 10% cho đơn đầu tiên\n- **SUMMER2026**: Giảm 15% mùa hè\n- **TOUR500**: Giảm 500K cho tour từ 5 triệu\n- **FLYHIGH**: Giảm 5% vé máy bay\n\n👉 Xem tất cả tại [Ưu đãi](/vouchers)!',
  },
  {
    keywords: ['đặt phòng', 'booking', 'đơn hàng', 'lịch sử'],
    answer: '📋 **Quản lý đặt chỗ:**\n- Xem lịch sử đặt phòng/tour/vé tại trang **Lịch sử đơn hàng**\n- Trạng thái đơn: Chờ xác nhận → Đã xác nhận → Hoàn thành\n- Hỗ trợ hủy/thay đổi trong vòng 24h\n\n👉 Kiểm tra tại [Lịch sử đặt chỗ](/bookings)!',
  },
  {
    keywords: ['thanh toán', 'payment', 'trả tiền', 'chuyển khoản'],
    answer: '💳 **Thanh toán tại TravelEasy:**\n- Thanh toán online an toàn\n- Hỗ trợ thẻ ATM, VISA, MasterCard\n- Ví điện tử: MoMo, ZaloPay, VNPay\n- Giữ chỗ ngay, không cần trả trước toàn bộ',
  },
  {
    keywords: ['đăng ký', 'tạo tài khoản', 'register'],
    answer: '📝 **Đăng ký tài khoản TravelEasy:**\n1. Truy cập trang [Đăng ký](/auth/register)\n2. Nhập email và tạo mật khẩu\n3. Xác nhận mã OTP gửi về email\n4. Hoàn tất và bắt đầu đặt chỗ!\n\nHoàn toàn **miễn phí**, không mất phí đăng ký.',
  },
  {
    keywords: ['đăng nhập', 'login', 'quên mật khẩu'],
    answer: '🔐 **Đăng nhập TravelEasy:**\n- Truy cập [Đăng nhập](/auth/signin)\n- Nhập email & mật khẩu đã đăng ký\n- Nếu quên mật khẩu: [Quên mật khẩu](/auth/forgot-password)\n\nGặp vấn đề? Liên hệ **1800 6868** hoặc **info@traveleasy.vn**',
  },
  {
    keywords: ['liên hệ', 'hỗ trợ', 'hotline', 'contact'],
    answer: '📞 **Liên hệ TravelEasy:**\n- 📧 Email: info@traveleasy.vn\n- ☎️ Hotline: **1800 6868** (miễn phí, 24/7)\n- 📍 Địa chỉ: Hà Nội, Việt Nam\n\nĐội ngũ hỗ trợ luôn sẵn sàng phục vụ bạn!',
  },
  {
    keywords: ['giá', 'bao nhiêu', 'chi phí', 'phí', 'tiền'],
    answer: '💰 **Bảng giá tham khảo:**\n- 🏨 Khách sạn: từ **1.5 triệu/đêm**\n- 🗺️ Tour nội địa: từ **2 triệu/người**\n- 🗺️ Tour quốc tế: từ **8 triệu/người**\n- ✈️ Vé nội địa: từ **1 triệu/chiều**\n\nGiá thực tế phụ thuộc ngày đi, mùa vụ và số lượng người.',
  },
  {
    keywords: ['cảm ơn', 'thanks', 'thank you', 'tuyệt', 'ok', 'được rồi'],
    answer: '😊 Rất vui khi được giúp bạn! Nếu cần thêm thông tin, đừng ngần ngại hỏi mình nhé. Chúc bạn có chuyến đi thật tuyệt vời! 🌟',
  },
];

const quickReplies = [
  '✈️ Đặt vé máy bay',
  '🏨 Tìm khách sạn',
  '🗺️ Xem tour du lịch',
  '🎟️ Ưu đãi hôm nay',
  '📞 Liên hệ hỗ trợ',
];

function getBotResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.answer;
    }
  }
  return '🤖 Xin lỗi, mình chưa hiểu câu hỏi của bạn. Bạn có thể hỏi về:\n- Đặt vé máy bay, khách sạn, tour\n- Voucher & ưu đãi\n- Tài khoản & đăng nhập\n\nHoặc chọn **"Nói chuyện với nhân viên"** để được hỗ trợ trực tiếp!';
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#1677ff;text-decoration:none;font-weight:600">$1</a>');
    return (
      <span key={i} style={{ display: 'block', lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: parts }} />
    );
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatBot() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'ai' | 'live'>('ai');
  const [unread, setUnread] = useState(1);

  // AI mode state
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: 1, role: 'bot',
      text: 'Xin chào! 👋 Mình là **TravelEasy AI** — trợ lý du lịch thông minh của bạn.\n\nMình có thể giúp bạn đặt vé, tìm tour, khách sạn và nhiều hơn nữa. Bạn cần gì hôm nay?',
      time: getTime(),
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [typing, setTyping] = useState(false);

  // Live chat state
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [liveInput, setLiveInput] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'closed'>('idle');
  const [liveUnread, setLiveUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const aiBottomRef = useRef<HTMLDivElement>(null);
  const liveBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => { aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, typing]);
  useEffect(() => { liveBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [liveMessages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Connect Socket.IO for live chat
  const connectLive = useCallback(async () => {
    if (!session?.user) return;
    setLiveStatus('connecting');

    try {
      const userId = (session.user as { id?: number | string }).id;
      console.log('[ChatBot] connectLive - userId:', userId, 'session:', session.user);
      const numUserId = Number(userId);
      if (!userId || isNaN(numUserId)) { 
        console.error('[ChatBot] Invalid userId:', userId);
        setLiveStatus('idle'); 
        return; 
      }

      const roomRes = await fetch(`${BACKEND}/api/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: numUserId }),
      });
      if (!roomRes.ok) {
        const errBody = await roomRes.text();
        console.error('[ChatBot] rooms fetch error:', roomRes.status, errBody);
        setLiveStatus('idle'); 
        return; 
      }
      const room = await roomRes.json();
      setRoomId(room.id);
      setLiveMessages(room.messages || []);

      if (room.status === 'CLOSED') {
        setLiveStatus('closed');
        return;
      }

      // Connect socket
      const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_room', room.id);
        setLiveStatus('connected');
      });

      socket.on('receive_message', (msg: LiveMessage) => {
        setLiveMessages(prev => [...prev, msg]);
        if (!open || mode !== 'live') setLiveUnread(n => n + 1);
      });

      socket.on('room_closed', ({ roomId: closedRoomId }: { roomId: number }) => {
        if (closedRoomId === room.id) setLiveStatus('closed');
      });

      socket.on('disconnect', () => { setLiveStatus('idle'); });
    } catch {
      setLiveStatus('idle');
    }
  }, [session, open, mode]);

  // Disconnect on unmount
  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  // Clear live unread when viewing live tab
  useEffect(() => {
    if (open && mode === 'live') setLiveUnread(0);
  }, [open, mode]);

  // ── AI send ──
  const sendAi = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: text.trim(), time: getTime() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setTyping(true);
    setTimeout(() => {
      const botText = getBotResponse(text.trim());
      setAiMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: botText, time: getTime() }]);
      setTyping(false);
    }, 800 + Math.random() * 500);
  };

  // ── Live send ──
  const sendLive = () => {
    if (!liveInput.trim() || !roomId || !socketRef.current) return;
    const userId = (session?.user as { id?: number | string })?.id;
    if (!userId) return;
    socketRef.current.emit('send_message', {
      roomId,
      senderId: Number(userId),
      senderRole: 'USER',
      content: liveInput.trim(),
    });
    setLiveInput('');
  };

  const totalUnread = unread + liveUnread;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          width: 60, height: 60, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
          boxShadow: '0 4px 20px rgba(22,119,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: '#fff',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        title="Hỗ trợ TravelEasy"
      >
        {open ? '✕' : '💬'}
        {!open && totalUnread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#ff4d4f', color: '#fff', borderRadius: '50%',
            width: 20, height: 20, fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>{totalUnread}</span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 100, right: 28, zIndex: 9998,
          width: 375, height: 580, borderRadius: 20,
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: '#fff', border: '1px solid #e8e8e8',
          animation: 'chatSlideUp 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
            color: '#fff', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {mode === 'ai' ? '🤖' : '👨‍💼'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {mode === 'ai' ? BOT_NAME : 'Nhân viên hỗ trợ'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#52c41a', display: 'inline-block' }} />
                {mode === 'ai' ? 'Trực tuyến · Phản hồi tức thì' :
                  liveStatus === 'connected' ? 'Đã kết nối với nhân viên' :
                  liveStatus === 'connecting' ? 'Đang kết nối...' :
                  liveStatus === 'closed' ? 'Hội thoại đã đóng' : 'Chưa kết nối'}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'none', border: 'none', color: '#fff', fontSize: 20,
              cursor: 'pointer', opacity: 0.8, padding: '0 4px',
            }}>✕</button>
          </div>

          {/* Mode Tabs */}
          <div style={{
            display: 'flex', background: '#f0f5ff',
            borderBottom: '1px solid #e0e8ff',
          }}>
            {(['ai', 'live'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: mode === m ? 700 : 500,
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? '#1677ff' : '#666',
                  borderBottom: mode === m ? '2px solid #1677ff' : '2px solid transparent',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {m === 'ai' ? '🤖 AI Bot' : '👨‍💼 Nhân viên'}
                {m === 'live' && liveUnread > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 36,
                    background: '#ff4d4f', color: '#fff', borderRadius: '50%',
                    width: 16, height: 16, fontSize: 10, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{liveUnread}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── AI Mode ── */}
          {mode === 'ai' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', background: '#f7f9fc' }}>
                {aiMessages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}>
                    {msg.role === 'bot' && (
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#1677ff,#0958d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, marginRight: 8, alignSelf: 'flex-end',
                      }}>🤖</div>
                    )}
                    <div style={{ maxWidth: '78%' }}>
                      <div style={{
                        background: msg.role === 'user' ? 'linear-gradient(135deg,#1677ff,#0958d9)' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#333',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 14px', fontSize: 13.5, lineHeight: 1.5,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }}>{renderText(msg.text)}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 3, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#1677ff,#0958d9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>🤖</div>
                    <div style={{
                      background: '#fff', borderRadius: '18px 18px 18px 4px',
                      padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      display: 'flex', gap: 5, alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: '#1677ff',
                          animation: `typingDot 1.2s ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={aiBottomRef} />
              </div>

              {/* Quick replies */}
              <div style={{ padding: '8px 12px', background: '#f7f9fc', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {quickReplies.map(q => (
                  <button key={q} onClick={() => sendAi(q)} style={{
                    background: '#fff', border: '1px solid #d0e4ff', borderRadius: 20,
                    padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                    color: '#1677ff', fontWeight: 500, transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e6f4ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                  >{q}</button>
                ))}
              </div>

              {/* AI Input */}
              <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendAi(aiInput); }}
                  placeholder="Nhập câu hỏi của bạn..."
                  style={{
                    flex: 1, border: '1.5px solid #e0e8ff', borderRadius: 24,
                    padding: '9px 16px', fontSize: 14, outline: 'none',
                    background: '#f7f9fc', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#1677ff')}
                  onBlur={e => (e.target.style.borderColor = '#e0e8ff')}
                />
                <button onClick={() => sendAi(aiInput)} style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: aiInput.trim() ? 'linear-gradient(135deg,#1677ff,#0958d9)' : '#e0e0e0',
                  color: '#fff', fontSize: 18, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}>➤</button>
              </div>
            </>
          )}

          {/* ── Live Chat Mode ── */}
          {mode === 'live' && (
            <>
              {liveStatus === 'idle' && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
                  background: '#f7f9fc',
                }}>
                  <div style={{ fontSize: 48 }}>👨‍💼</div>
                  <div style={{ textAlign: 'center', color: '#333' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Trò chuyện với nhân viên</div>
                    <div style={{ fontSize: 13.5, color: '#666', lineHeight: 1.6 }}>
                      Kết nối trực tiếp với đội ngũ hỗ trợ của chúng tôi. Thời gian phản hồi: <strong>trong vài phút</strong>.
                    </div>
                  </div>
                  {session?.user ? (
                    <button onClick={connectLive} style={{
                      background: 'linear-gradient(135deg,#1677ff,#0958d9)',
                      color: '#fff', border: 'none', borderRadius: 24,
                      padding: '12px 28px', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,119,255,0.35)',
                      transition: 'transform 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >💬 Bắt đầu trò chuyện</button>
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: 13, color: '#888' }}>
                      Vui lòng <a href="/auth/signin" style={{ color: '#1677ff', fontWeight: 600 }}>đăng nhập</a> để sử dụng tính năng này.
                    </div>
                  )}
                </div>
              )}

              {liveStatus === 'connecting' && (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f7f9fc', flexDirection: 'column', gap: 12,
                }}>
                  <div style={{ fontSize: 32 }}>⏳</div>
                  <div style={{ color: '#666', fontSize: 14 }}>Đang kết nối với nhân viên...</div>
                </div>
              )}

              {liveStatus === 'closed' && (
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#f7f9fc', flexDirection: 'column', gap: 12, padding: 24,
                }}>
                  <div style={{ fontSize: 36 }}>✅</div>
                  <div style={{ textAlign: 'center', color: '#666', fontSize: 14 }}>
                    Hội thoại đã được đóng bởi nhân viên. Cảm ơn bạn đã liên hệ!
                  </div>
                  <button onClick={() => { setLiveStatus('idle'); setRoomId(null); setLiveMessages([]); socketRef.current?.disconnect(); }} style={{
                    background: '#f0f5ff', color: '#1677ff', border: '1px solid #d0e4ff',
                    borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}>Bắt đầu hội thoại mới</button>
                </div>
              )}

              {liveStatus === 'connected' && (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', background: '#f7f9fc' }}>
                    {liveMessages.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#aaa', padding: '20px 0', fontSize: 13 }}>
                        Gửi tin nhắn để bắt đầu cuộc trò chuyện nhé 👋
                      </div>
                    )}
                    {liveMessages.map(msg => {
                      const isMe = msg.senderRole === 'USER';
                      return (
                        <div key={msg.id} style={{
                          display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                          marginBottom: 12,
                        }}>
                          {!isMe && (
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg,#52c41a,#389e0d)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, marginRight: 8, alignSelf: 'flex-end',
                            }}>👨‍💼</div>
                          )}
                          <div style={{ maxWidth: '78%' }}>
                            {!isMe && <div style={{ fontSize: 11, color: '#888', marginBottom: 2, marginLeft: 2 }}>Nhân viên</div>}
                            <div style={{
                              background: isMe ? 'linear-gradient(135deg,#1677ff,#0958d9)' : '#fff',
                              color: isMe ? '#fff' : '#333',
                              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              padding: '10px 14px', fontSize: 13.5, lineHeight: 1.5,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            }}>{msg.content}</div>
                            <div style={{ fontSize: 11, color: '#aaa', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                              {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={liveBottomRef} />
                  </div>

                  {/* Live Input */}
                  <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={liveInput}
                      onChange={e => setLiveInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendLive(); }}
                      placeholder="Nhắn tin cho nhân viên..."
                      style={{
                        flex: 1, border: '1.5px solid #e0e8ff', borderRadius: 24,
                        padding: '9px 16px', fontSize: 14, outline: 'none',
                        background: '#f7f9fc', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#1677ff')}
                      onBlur={e => (e.target.style.borderColor = '#e0e8ff')}
                    />
                    <button onClick={sendLive} style={{
                      width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: liveInput.trim() ? 'linear-gradient(135deg,#1677ff,#0958d9)' : '#e0e0e0',
                      color: '#fff', fontSize: 18, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                    }}>➤</button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
