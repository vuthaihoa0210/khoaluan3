'use client';

import { Card, Col, Input, Row, Space, Tag, Typography, Select, Pagination, Button, Tabs, Slider, Spin } from 'antd';
import { SearchOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function ToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>('price-asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 30000000]);

  useEffect(() => {
    fetch('/api/tours')
      .then(res => res.json())
      .then(data => {
        setTours(data);
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
      if (s) setSearchTerm(s);
    }
  }, []);

  const filteredAndSortedTours = useMemo(() => {
    let filtered = tours;
    if (activeTab !== 'ALL') {
      filtered = filtered.filter(t => t.category === activeTab);
    }
    
    if (searchTerm.trim()) {
      const term = removeAccents(searchTerm);
      filtered = filtered.filter(t => 
        (t.location && removeAccents(t.location).includes(term)) ||
        removeAccents(t.name).includes(term)
      );
    }

    filtered = filtered.filter(t => (t.price || 0) >= priceRange[0] && (t.price || 0) <= priceRange[1]);

    if (sortBy === 'price-asc') {
      filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-desc') {
      filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return filtered;
  }, [tours, activeTab, searchTerm, sortBy, priceRange]);

  const pagedTours = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedTours.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredAndSortedTours]);

  const tabItems = [
    { key: 'ALL', label: 'Tất cả tour' },
    { key: 'DOMESTIC', label: 'Trong nước' },
    { key: 'INTERNATIONAL', label: 'Quốc tế' },
  ];

  return (
    <div className="section">
      <Title level={3}>Tour Du Lịch</Title>
      <Paragraph type="secondary">Chọn tour phù hợp, giá trọn gói rõ ràng</Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={12}>
              <Input
                size="large"
                placeholder="Tìm điểm đến hoặc tên tour..."
                prefix={<EnvironmentOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Select
                size="large"
                placeholder="Sắp xếp theo giá"
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
          <div style={{ padding: '0 8px' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Khoảng giá: {formatCurrency(priceRange[0])} – {formatCurrency(priceRange[1])}</Text>
            <Slider
              range
              min={0}
              max={30000000}
              step={500000}
              value={priceRange}
              onChange={(v) => { setPriceRange(v as [number,number]); setCurrentPage(1); }}
              tooltip={{ formatter: (v) => formatCurrency(v || 0) }}
            />
          </div>
        </Space>
      </Card>

      <Tabs items={tabItems} activeKey={activeTab} onChange={(key) => { setActiveTab(key); setCurrentPage(1); }} />

      {loading ? (
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#666" }}>Đang tải danh sách Tour, vui lòng đợi...</div>
        </div>
      ) : (
      <Row gutter={[16, 16]}>
        {pagedTours.map((t) => (
          <Col xs={24} sm={12} md={8} lg={6} key={t.id} style={{ display: 'flex' }}>
            <Card
              hoverable
              onClick={() => router.push(`/tours/${t.id}`)}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
              cover={<img alt={t.name} src={t.image} style={{ height: 200, objectFit: 'cover' }} />}
              title={t.name}
              extra={<Tag color="gold">{t.rating?.toFixed(1)} ⭐</Tag>}
              actions={[
                <div key="price" style={{ fontWeight: 'bold', fontSize: '16px', color: '#1890ff', textAlign: 'center' }}>
                  {formatCurrency(t.price || 0)}
                </div>
              ]}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <Text>
                    <EnvironmentOutlined /> {t.location}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </Text>
                  </div>
                </div>
                <Button type="primary" block style={{ marginTop: 16 }}>
                  Xem lịch trình
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
          total={filteredAndSortedTours.length}
          onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
}