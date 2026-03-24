'use client';

import { Button, Card, Col, Row, Space, Tag, Typography, Spin, Divider, Modal, Image } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, StarFilled, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReviewSection from '@/components/ReviewSection';

const { Title, Paragraph, Text } = Typography;

interface Flight {
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

export default function FlightDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [flight, setFlight] = useState<Flight | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedHotels, setRelatedHotels] = useState<any[]>([]);
    const [relatedTours, setRelatedTours] = useState<any[]>([]);

    useEffect(() => {
        if (params?.id) {
            fetch(`/api/flights/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setFlight(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [params?.id]);

    useEffect(() => {
        if (flight?.location) {
            fetch('/api/hotels')
                .then(res => res.json())
                .then((data: any[]) => {
                    const related = data.filter(h => h.location === flight.location);
                    setRelatedHotels(related.slice(0, 8));
                });

            fetch('/api/tours')
                .then(res => res.json())
                .then((data: any[]) => {
                    const related = data.filter(t => t.location === flight.location);
                    setRelatedTours(related.slice(0, 8));
                });
        }
    }, [flight]);

    const handleBooking = () => {
        if (!session) {
            Modal.confirm({
                title: 'Yêu cầu đăng nhập',
                icon: <LockOutlined />,
                content: 'Vui lòng đăng nhập để có thể tiến hành đặt vé máy bay và nhận các ưu đãi hấp dẫn.',
                okText: 'Đăng nhập ngay',
                cancelText: 'Quay lại',
                onOk: () => {
                    router.push('/auth/signin');
                },
            });
            return;
        }
        router.push(`/order?type=FLIGHT&id=${flight?.id}&seatClass=ECONOMY`);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!flight) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Title level={4}>Không tìm thấy chuyến bay</Title>
                <Button onClick={() => router.back()}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="section">
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 20 }}>
                Quay lại danh sách
            </Button>

            <Card style={{ marginBottom: 32 }}>
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={12}>
                        <Image
                            src={flight.image || ''}
                            alt={flight.name}
                            style={{ width: '100%', height: 340, objectFit: 'cover', borderRadius: 12 }}
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Tag color="green">{flight.category === 'DOMESTIC' ? 'Nội địa' : 'Quốc tế'}</Tag>
                                <Title level={2} style={{ marginTop: 8 }}>{flight.name}</Title>
                                <Space>
                                    <StarFilled style={{ color: '#fadb14' }} />
                                    <Text>{flight.rating?.toFixed(1)} (Đánh giá)</Text>
                                    <Divider orientation="vertical" />
                                    <EnvironmentOutlined />
                                    <Text>{flight.location}</Text>
                                </Space>
                            </div>

                            <div style={{ display: 'flex', gap: 24 }}>
                                <Space><ClockCircleOutlined /> Thời gian: 2h 30m</Space>
                                <Space><DollarOutlined /> Thuế & Phí: Đã bao gồm</Space>
                            </div>

                            <Paragraph>{flight.description}</Paragraph>

                            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                                <Row align="middle" justify="space-between">
                                    <Col>
                                        <Text type="secondary">Giá vé từ</Text>
                                        <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                                            {formatCurrency(flight.price || 0)}
                                        </Title>
                                    </Col>
                                    <Col>
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={handleBooking}
                                        >
                                            Đặt Vé Ngay
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <ReviewSection type="FLIGHT" itemId={Number(params.id)} />

            <div style={{ marginTop: 48 }}>
                {relatedHotels.length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                        <Title level={4}>Khách sạn tại {flight.location}</Title>
                        <Row gutter={[16, 16]}>
                            {relatedHotels.map(h => (
                                <Col xs={24} sm={12} md={8} lg={6} key={h.id}>
                                    <Card
                                        hoverable
                                        cover={<img alt={h.name} src={h.image} style={{ height: 150, objectFit: 'cover' }} />}
                                        size="small"
                                        onClick={() => router.push(`/hotels/${h.id}`)}
                                    >
                                        <Card.Meta title={h.name} description={h.location} />
                                        <div style={{ marginTop: 8, fontWeight: 'bold', color: '#1677ff' }}>
                                            {formatCurrency(h.price || 0)}/đêm
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {relatedTours.length > 0 && (
                    <div>
                        <Title level={4}>Tour du lịch tại {flight.location}</Title>
                        <Row gutter={[16, 16]}>
                            {relatedTours.map(t => (
                                <Col xs={24} sm={12} md={8} lg={6} key={t.id}>
                                    <Card
                                        hoverable
                                        cover={<img alt={t.name} src={t.image} style={{ height: 150, objectFit: 'cover' }} />}
                                        size="small"
                                        onClick={() => router.push(`/tours/${t.id}`)}
                                    >
                                        <Card.Meta title={t.name} description={t.location} />
                                        <div style={{ marginTop: 8, fontWeight: 'bold', color: '#faad14' }}>
                                            {formatCurrency(t.price || 0)}
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </div>
        </div>
    );
}
