'use client';

import { Button, Card, Col, Input, Row, Space, Statistic, Steps, Tabs, Tag, Typography, Spin } from 'antd';
import { CompassOutlined, SearchOutlined, ThunderboltOutlined, SafetyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

interface Destination {
  id: number;
  name: string;
  description?: string;
  location?: string;
  price?: number;
  image?: string;
  rating?: number;
  category?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80',
    title: 'Khám phá Việt Nam tươi đẹp',
    subtitle: 'Hàng nghìn điểm đến hấp dẫn đang chờ bạn khám phá',
  },
  {
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    title: 'Đặt phòng khách sạn dễ dàng',
    subtitle: 'Hơn 1.200 khách sạn với giá tốt nhất, đảm bảo chất lượng',
  },
  {
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80',
    title: 'Bay tới mọi nơi trên thế giới',
    subtitle: 'Vé máy bay giá rẻ, đặt nhanh, thanh toán an toàn',
  },
  {
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80',
    title: 'Tour trọn gói hấp dẫn',
    subtitle: 'Lịch trình chi tiết, hướng dẫn viên nhiệt tình, giá minh bạch',
  },
  {
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    title: 'Ưu đãi không thể bỏ lỡ',
    subtitle: 'Voucher giảm giá hấp dẫn, tiết kiệm tới 50% cho mọi chuyến đi',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchDest, setSearchDest] = useState('');
  const [hotels, setHotels] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/hotels').then(res => res.json()),
      fetch('/api/tours').then(res => res.json())
    ]).then(([hotelsData, toursData]) => {
      setHotels(hotelsData);
      setTours(toursData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
  }

  return (
    <>
      {/* ── HERO SLIDESHOW ── */}
      <div style={{ position: 'relative', width: '100%', height: 560, overflow: 'hidden' }}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: idx === currentSlide ? 1 : 0,
              transition: 'opacity 0.9s ease-in-out',
              zIndex: idx === currentSlide ? 1 : 0,
            }}
          />
        ))}

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)'
        }} />

        {/* Slide text & buttons */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', color: '#fff', padding: '0 24px', paddingBottom: 80,
        }}>
          <div style={{
            fontSize: '2.6rem', fontWeight: 800, lineHeight: 1.2,
            marginBottom: 14, textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}>
            {slides[currentSlide].title}
          </div>
          <div style={{ fontSize: '1.15rem', opacity: 0.9, marginBottom: 32, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {slides[currentSlide].subtitle}
          </div>
          <Space>
            <Link href="/flights">
              <Button type="primary" size="large" icon={<SearchOutlined />}
                style={{ height: 48, fontSize: 16, borderRadius: 8 }}>
                Bắt đầu tìm kiếm
              </Button>
            </Link>
            <Link href="/vouchers">
              <Button size="large" ghost
                style={{ height: 48, fontSize: 16, borderRadius: 8, borderColor: '#fff', color: '#fff' }}>
                Xem ưu đãi
              </Button>
            </Link>
          </Space>
        </div>

        {/* Prev arrow */}
        <button onClick={() => setCurrentSlide(p => (p - 1 + slides.length) % slides.length)}
          style={{
            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 4, background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '50%',
            width: 46, height: 46, cursor: 'pointer', fontSize: 24, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>

        {/* Next arrow */}
        <button onClick={() => setCurrentSlide(p => (p + 1) % slides.length)}
          style={{
            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 4, background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '50%',
            width: 46, height: 46, cursor: 'pointer', fontSize: 24, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>

        {/* Dots */}
        <div style={{
          position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4, display: 'flex', gap: 8,
        }}>
          {slides.map((_, idx) => (
            <div key={idx} onClick={() => setCurrentSlide(idx)} style={{
              width: idx === currentSlide ? 24 : 8, height: 8, borderRadius: 4, cursor: 'pointer',
              background: idx === currentSlide ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* ── SEARCH CARD (floating below banner) ── */}
      <div style={{ background: '#f0f4f8', padding: '0 24px 32px' }}>
        <div style={{
          maxWidth: 720, margin: '0 auto',
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '28px 32px', marginTop: -44, position: 'relative', zIndex: 5,
        }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 14, color: '#1677ff' }}>
            🔍 Tìm điểm đến của bạn
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              size="large"
              placeholder="Điểm đến (Đà Nẵng, Đà Lạt, Nha Trang...)"
              prefix={<CompassOutlined />}
              value={searchDest}
              onChange={(e) => setSearchDest(e.target.value)}
              onPressEnter={() => {
                if (searchDest.trim()) router.push(`/hotels?search=${encodeURIComponent(searchDest.trim())}`);
                else router.push('/hotels');
              }}
            />
            <Button type="primary" size="large" icon={<SearchOutlined />}
              onClick={() => {
                if (searchDest.trim()) router.push(`/hotels?search=${encodeURIComponent(searchDest.trim())}`);
                else router.push('/hotels');
              }}>
              Tìm kiếm
            </Button>
          </Space.Compact>
          <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
            <Statistic title="Khách sạn" value={1200} styles={{ content: { fontSize: 20 } }} />
            <Statistic title="Tour đã đặt" value={5600} styles={{ content: { fontSize: 20 } }} />
            <Statistic title="Đánh giá 5★" value={4800} styles={{ content: { fontSize: 20 } }} />
          </div>
        </div>
      </div>

      <div className="section">
        <Title level={3}>Khách sạn nổi bật</Title>
        <Paragraph type="secondary">Giá tốt, vị trí đẹp, đánh giá cao</Paragraph>
        <Row gutter={[16, 16]}>
          {hotels.slice(0, 3).map((h) => (
            <Col xs={24} sm={12} md={8} key={h.id}>
              <Link href={`/hotels/${h.id}`} style={{ display: 'block' }}>
                <Card
                  hoverable
                  cover={<img alt={h.name} src={h.image} style={{ height: 200, objectFit: 'cover' }} />}
                  title={h.name}
                  extra={<Tag color="blue">{h.category || 'Nổi bật'}</Tag>}
                  actions={[
                    <span key="price">
                      {h.price ? `${formatCurrency(h.price)}/đêm` : 'Liên hệ'}
                    </span>,
                  ]}
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Text strong>{h.location}</Text>
                  </Space>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      <div className="section">
        <Title level={3}>Tour đề xuất</Title>
        <Paragraph type="secondary">Chọn tour phù hợp, giá trọn gói rõ ràng</Paragraph>
        <Tabs
          items={[
            {
              key: 'tour',
              label: 'Tour hot',
              children: (
                <Row gutter={[16, 16]}>
                  {tours.slice(0, 3).map((t) => (
                    <Col xs={24} sm={12} md={8} key={t.id}>
                      <Link href={`/tours/${t.id}`} style={{ display: 'block' }}>
                        <Card
                          hoverable
                          cover={<img alt={t.name} src={t.image} style={{ height: 200, objectFit: 'cover' }} />}
                          title={t.name}
                          extra={<Tag color="gold">{t.category || 'Tour hot'}</Tag>}
                          actions={[<span key="price">{formatCurrency(t.price || 0)}</span>]}
                        >
                          <Space orientation="vertical" style={{ width: '100%' }}>
                            <Text strong>{t.location}</Text>
                          </Space>
                        </Card>
                      </Link>
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      </div>

      <div className="section">
        <Title level={3}>Vì sao nên chọn TravelEasy</Title>
        <Paragraph type="secondary">Nhanh, minh bạch và luôn sẵn sàng hỗ trợ bạn</Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card className="highlight-card" variant="borderless" title="Giữ chỗ siêu nhanh" extra={<ThunderboltOutlined />}>
              <Paragraph>Giữ booking tạm thời với TTL, không lo mất phòng/tour trong lúc thanh toán.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="highlight-card" variant="borderless" title="Thanh toán an toàn" extra={<SafetyOutlined />}>
              <Paragraph>Thanh toán online giả lập, kiểm thử luồng end-to-end trước khi go-live.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card className="highlight-card" variant="borderless" title="Hỗ trợ 24/7" extra={<ClockCircleOutlined />}>
              <Paragraph>Đội ngũ luôn trực, xử lý yêu cầu hoàn hủy, thay đổi lịch trình kịp thời.</Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      <div className="section">
        <Title level={3}>Quy trình đặt đơn giản</Title>
        <Steps
          items={[
            { title: 'Tìm kiếm', content: 'Chọn điểm đến, ngày và bộ lọc' },
            { title: 'Đặt chỗ', content: 'Giữ chỗ/booking pending với TTL' },
            { title: 'Thanh toán', content: 'Thanh toán giả lập/online' },
            { title: 'Xác nhận', content: 'Nhận email/push xác nhận' },
          ]}
        />
      </div>

      <div className="section cta-banner">
        <div className="cta-text">
          <Title level={3}>Sẵn sàng cho chuyến đi tiếp theo?</Title>
          <Paragraph type="secondary">Khám phá hàng nghìn khách sạn và tour, đặt nhanh trong vài bước.</Paragraph>
        </div>
        <Space size="middle">
          <Link href="/hotels">
            <Button type="primary" size="large">
              Khám phá khách sạn
            </Button>
          </Link>
          <Link href="/tours">
            <Button size="large">Xem tour hot</Button>
          </Link>
        </Space>
      </div>
    </>
  );
}
