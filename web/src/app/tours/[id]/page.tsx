'use client';

import { Button, Card, Col, Row, Space, Tag, Typography, Spin, Divider, Timeline, DatePicker, message, Modal } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, StarFilled, ArrowLeftOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReviewSection from '@/components/ReviewSection';
import ImageGallery from '@/components/ImageGallery';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

interface Tour {
    id: string;
    name: string;
    description?: string;
    location?: string;
    price?: number;
    image?: string;
    rating?: number;
    category?: string;
    itinerary?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function TourDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [tour, setTour] = useState<Tour | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params?.id) {
            fetch(`/api/tours/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    setTour(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [params?.id]);

    const [relatedHotels, setRelatedHotels] = useState<any[]>([]);
    const [relatedFlights, setRelatedFlights] = useState<any[]>([]);

    useEffect(() => {
        if (tour?.location) {
            // Fetch Hotels
            fetch('/api/hotels')
                .then(res => res.json())
                .then((data: any[]) => {
                    const related = data.filter(h => h.location === tour.location);
                    setRelatedHotels(related.slice(0, 8));
                });

            // Fetch Flights
            fetch('/api/flights')
                .then(res => res.json())
                .then((data: any[]) => {
                    const related = data.filter(f => f.location === tour.location);
                    setRelatedFlights(related.slice(0, 8));
                });
        }
    }, [tour]);

    const handleBooking = () => {
        if (!session) {
            message.error('Vui lòng đăng nhập để đặt tour!');
            return;
        }
        router.push(`/order?type=TOUR&id=${tour?.id}`);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!tour) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Title level={4}>Không tìm thấy tour</Title>
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
                            mainImage={tour.image || ''}
                            productId={tour.id}
                            category="tour"
                            altText={tour.name}
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Tag color="gold">{tour.category === 'DOMESTIC' ? 'Trong nước' : 'Nước ngoài'}</Tag>
                                <Title level={2} style={{ marginTop: 8 }}>{tour.name}</Title>
                                <Space>
                                    <StarFilled style={{ color: '#fadb14' }} />
                                    <Text>{tour.rating?.toFixed(1)} (Đánh giá)</Text>
                                    <Divider orientation="vertical" />
                                    <EnvironmentOutlined />
                                    <Text>{tour.location}</Text>
                                </Space>
                            </div>

                            <Divider />

                            <Paragraph>{tour.description}</Paragraph>

                            <div>
                                <Title level={5}>Lịch trình chi tiết:</Title>
                                {tour.itinerary ? (() => {
                                    try {
                                        const itineraryList = JSON.parse(tour.itinerary);
                                        return (
                                            <div style={{ marginTop: 16 }}>
                                                {itineraryList.map((day: any, index: number) => (
                                                    <div key={index} style={{ marginBottom: 24 }}>
                                                        <Text strong style={{ fontSize: 16, color: '#faad14' }}>{day.title}</Text>
                                                        <Timeline
                                                            style={{ marginTop: 12 }}
                                                            items={day.activities.map((act: any) => ({
                                                                color: 'blue',
                                                                content: (
                                                                    <>
                                                                        <Text strong>{act.time}: </Text>
                                                                        <Text>{act.description}</Text>
                                                                    </>
                                                                )
                                                            }))}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    } catch (e) {
                                        return <Paragraph>Lịch trình đang cập nhật...</Paragraph>;
                                    }
                                })() : (
                                    <Timeline
                                        items={[
                                            { content: 'Tập trung tại điểm hẹn' },
                                            { content: 'Khởi hành tham quan các địa điểm nổi tiếng' },
                                            { content: 'Ăn trưa tại nhà hàng địa phương' },
                                            { content: 'Tự do khám phá & mua sắm' },
                                            { content: 'Kết thúc chương trình' },
                                        ]}
                                    />
                                )}
                            </div>

                            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                                <Row align="middle" justify="space-between">
                                    <Col>
                                        <Text type="secondary">Giá trọn gói</Text>
                                        <Title level={3} style={{ margin: 0, color: '#faad14' }}>
                                            {formatCurrency(tour.price || 0)}
                                        </Title>
                                    </Col>
                                    <Col>
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={() => {
                                                if (!session) {
                                                    Modal.confirm({
                                                        title: 'Yêu cầu đăng nhập',
                                                        icon: <LockOutlined />,
                                                        content: 'Vui lòng đăng nhập để có thể tiến hành đặt tour và nhận các ưu đãi hấp dẫn.',
                                                        okText: 'Đăng nhập ngay',
                                                        cancelText: 'Quay lại',
                                                        onOk: () => {
                                                            router.push('/auth/signin');
                                                        },
                                                    });
                                                    return;
                                                }
                                                router.push(`/order?type=TOUR&id=${tour.id}`);
                                            }}
                                            block
                                        >
                                            Đặt Tour Ngay
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <ReviewSection type="TOUR" itemId={Number(params.id)} />

            <div style={{ marginTop: 48 }}>
                {relatedHotels.length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                        <Title level={4}>Khách sạn tại {tour.location}</Title>
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

                {relatedFlights.length > 0 && (
                    <div>
                        <Title level={4}>Vé máy bay đến {tour.location}</Title>
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
