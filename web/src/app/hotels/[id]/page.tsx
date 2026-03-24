'use client';

import { Button, Card, Col, Row, Space, Tag, Typography, Spin, Divider, Modal } from 'antd';
import { EnvironmentOutlined, WifiOutlined, CoffeeOutlined, CarOutlined, StarFilled, ArrowLeftOutlined, LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReviewSection from '@/components/ReviewSection';
import ImageGallery from '@/components/ImageGallery';

const { Title, Paragraph, Text } = Typography;

interface Hotel {
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

export default function HotelDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [hotel, setHotel] = useState<Hotel | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedTours, setRelatedTours] = useState<any[]>([]);
    const [relatedFlights, setRelatedFlights] = useState<any[]>([]);

    useEffect(() => {
        if (params?.id) {
            fetch(`/api/hotels/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setHotel(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [params?.id]);

    useEffect(() => {
        if (hotel?.location) {
            fetch('/api/tours')
                .then(res => res.json())
                .then((data: any[]) => {
                    const related = data.filter(t => t.location === hotel.location);
                    setRelatedTours(related.slice(0, 8));
                });

            fetch('/api/flights')
                .then(res => res.json())
                .then((data: any[]) => {
                    const related = data.filter(f => f.location === hotel.location);
                    setRelatedFlights(related.slice(0, 8));
                });
        }
    }, [hotel]);

    const handleBooking = () => {
        if (!session) {
            Modal.confirm({
                title: 'Yêu cầu đăng nhập',
                icon: <LockOutlined />,
                content: 'Vui lòng đăng nhập để có thể tiến hành đặt phòng và nhận các ưu đãi hấp dẫn.',
                okText: 'Đăng nhập ngay',
                cancelText: 'Quay lại',
                onOk: () => {
                    router.push('/auth/signin');
                },
            });
            return;
        }
        router.push(`/order?type=HOTEL&id=${hotel?.id}`);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!hotel) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Title level={4}>Không tìm thấy khách sạn</Title>
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
                        <ImageGallery
                            mainImage={hotel.image || ''}
                            productId={hotel.id}
                            category="hotel"
                            altText={hotel.name}
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Tag color="blue">{hotel.category === 'DOMESTIC' ? 'Trong nước' : 'Quốc tế'}</Tag>
                                <Title level={2} style={{ marginTop: 8 }}>{hotel.name}</Title>
                                <Space>
                                    <StarFilled style={{ color: '#fadb14' }} />
                                    <Text>{hotel.rating?.toFixed(1)} (Đánh giá)</Text>
                                    <Divider orientation="vertical" />
                                    <EnvironmentOutlined />
                                    <Text>{hotel.location}</Text>
                                </Space>
                            </div>

                            <div>
                                <Title level={5}>Tiện ích nổi bật:</Title>
                                <Space size="large" wrap>
                                    <Space><WifiOutlined /> Wifi miễn phí</Space>
                                    <Space><CoffeeOutlined /> Ăn sáng</Space>
                                    <Space><CarOutlined /> Đưa đón sân bay</Space>
                                </Space>
                            </div>

                            <Paragraph>{hotel.description}</Paragraph>

                            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                                <Row align="middle" justify="space-between">
                                    <Col>
                                        <Text type="secondary">Giá từ</Text>
                                        <Title level={3} style={{ margin: 0, color: '#1677ff' }}>
                                            {formatCurrency(hotel.price || 0)}/đêm
                                        </Title>
                                    </Col>
                                    <Col>
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={handleBooking}
                                        >
                                            Đặt Phòng Ngay
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <ReviewSection type="HOTEL" itemId={Number(params.id)} />

            <div style={{ marginTop: 48 }}>
                {relatedTours.length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                        <Title level={4}>Tour du lịch tại {hotel.location}</Title>
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

                {relatedFlights.length > 0 && (
                    <div>
                        <Title level={4}>Vé máy bay đến {hotel.location}</Title>
                        <Row gutter={[16, 16]}>
                            {relatedFlights.map(f => (
                                <Col xs={24} sm={12} md={8} lg={6} key={f.id}>
                                    <Card
                                        hoverable
                                        cover={<img alt={f.name} src={f.image} style={{ height: 150, objectFit: 'cover' }} />}
                                        size="small"
                                        onClick={() => router.push(`/flights/${f.id}`)}
                                    >
                                        <Card.Meta title={f.name} description={f.location} />
                                        <div style={{ marginTop: 8, fontWeight: 'bold', color: '#1677ff' }}>
                                            {formatCurrency(f.price || 0)}
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
