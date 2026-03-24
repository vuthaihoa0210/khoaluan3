import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#1a1a2e', color: '#ccc', paddingTop: 48, paddingBottom: 24, marginTop: 64 }}>
      <div className="container mx-auto" style={{ maxWidth: 1200, padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Image src="/logo.png" alt="TravelEasy Logo" width={40} height={40} style={{ borderRadius: 8 }} />
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>TravelEasy</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: '#aaa' }}>
              Nền tảng đặt vé, tour và phòng khách sạn uy tín hàng đầu Việt Nam. Nhanh chóng, an toàn, tiện lợi.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Dịch vụ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/flights" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14 }}>✈️ Đặt vé máy bay</Link>
              <Link href="/hotels" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14 }}>🏨 Đặt phòng khách sạn</Link>
              <Link href="/tours" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14 }}>🗺️ Tour du lịch</Link>
              <Link href="/vouchers" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14 }}>🎟️ Ưu đãi & Voucher</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Hỗ trợ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/bookings" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14 }}>📋 Lịch sử đặt chỗ</Link>
              <Link href="/auth/signin" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14 }}>🔐 Đăng nhập</Link>
              <Link href="/auth/register" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14 }}>📝 Đăng ký tài khoản</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Liên hệ</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#aaa' }}>
              <span>📧 info@traveleasy.vn</span>
              <span>📞 1800 6868</span>
              <span>📍 Hà Nội, Việt Nam</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #333', paddingTop: 20, textAlign: 'center', fontSize: 13, color: '#666' }}>
          © 2026 <strong style={{ color: '#aaa' }}>TravelEasy</strong>. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}