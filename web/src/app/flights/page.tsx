'use client';

import { Card, Col, Input, Row, Space, Tag, Typography, Select, Pagination, Button, DatePicker, Tabs, Spin } from 'antd';
import { SearchOutlined, EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

const PAGE_SIZE = 8;

interface Destination {
  id: string;
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

const removeAccents = (str: string) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
};

export default function FlightsPage() {
  const router = useRouter();
  const [flights, setFlights] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(null);
  const [sortBy, setSortBy] = useState<string | undefined>('price-asc');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    fetch('/api/flights')
      .then(res => res.json())
      .then(data => {
        setFlights(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('search');
      if (s) setTo(s);
    }
  }, []);

  const filteredAndSortedFlights = useMemo(() => {
    let filtered = flights;
    if (activeTab !== 'ALL') {
      filtered = filtered.filter(f => f.category === activeTab);
    }

    if (from.trim()) {
      const fromLower = removeAccents(from);
      filtered = filtered.filter(f => removeAccents(f.name).includes(fromLower));
    }
    
    if (to.trim()) {
      const toLower = removeAccents(to);
      filtered = filtered.filter(f => 
        (f.location && removeAccents(f.location).includes(toLower)) || 
        removeAccents(f.name).includes(toLower)
      );
    }

    if (sortBy === 'price-asc') {
      filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-desc') {
      filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return filtered;
  }, [flights, activeTab, from, to, sortBy]);

  const pagedFlights = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedFlights.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredAndSortedFlights]);

  const tabItems = [
    { key: 'ALL', label: 'Tất cả vé' },
    { key: 'DOMESTIC', label: 'Trong nước' },
    { key: 'INTERNATIONAL', label: 'Quốc tế' },
  ];

  return (
    <div className="section">
      <Title level={3}>Đặt Vé Máy Bay</Title>
      <Paragraph type="secondary">Tìm và đặt vé máy bay nhanh chóng</Paragraph>

      <Card style={{ marginBottom: 24 }}>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Input
                size="large"
                placeholder="Điểm khởi hành"
                prefix={<EnvironmentOutlined />}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                size="large"
                placeholder="Điểm đến"
                prefix={<EnvironmentOutlined />}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <DatePicker
                size="large"
                placeholder="Chọn ngày"
                style={{ width: '100%' }}
                value={date}
                onChange={(value) => setDate(value as any)}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Sắp xếp"
                style={{ width: '100%' }}
                value={sortBy}
                options={[
                  { label: 'Giá thấp đến cao', value: 'price-asc' },
                  { label: 'Giá cao đến thấp', value: 'price-desc' },
                ]}
                onChange={(value) => setSortBy(value)}
              />
            </Col>
          </Row>
          <Button type="primary" size="large" block icon={<SearchOutlined />}>
            Tìm Vé
          </Button>
        </Space>
      </Card>

      <Tabs items={tabItems} activeKey={activeTab} onChange={(key) => { setActiveTab(key); setCurrentPage(1); }} />

      {loading ? (
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#666" }}>Đang tải dữ liệu, vui lòng chờ máy chủ khởi động...</div>
        </div>
      ) : (
      <Row gutter={[16, 16]}>
        {pagedFlights.map((f) => (
          <Col xs={24} sm={12} md={8} lg={6} key={f.id} style={{ display: 'flex' }}>
            <Card
              hoverable
              onClick={() => router.push(`/flights/${f.id}`)}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
              cover={<img alt={f.name} src={f.image} style={{ height: 200, objectFit: 'cover' }} />}
              title={f.name}
              extra={<Tag color="blue">{f.rating?.toFixed(1)} ⭐</Tag>}
              actions={[
                <div key="price" style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff', textAlign: 'center' }}>
                  {formatCurrency(f.price || 0)}
                </div>
              ]}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <Text>
                    <EnvironmentOutlined /> {f.location}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {f.description}
                    </Text>
                  </div>
                </div>
                <Button type="primary" block style={{ marginTop: 16 }}>
                  Đặt Vé
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      )}

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Pagination
          current={currentPage}
          pageSize={PAGE_SIZE}
          total={filteredAndSortedFlights.length}
          onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
}