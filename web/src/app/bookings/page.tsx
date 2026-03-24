'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Card, Layout, Spin, message, Empty, Button, Modal, QRCode, Space, Alert } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { RocketOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

interface Booking {
    id: number;
    itemName: string;
    type: string;
    startDate: string;
    endDate?: string;
    finalPrice: number;
    status: string;
    createdAt: string;
}

export default function BookingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    const fetchBookings = () => {
        if (session?.user?.id) {
            setLoading(true);
            fetch(`/api/bookings/user/${session.user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setBookings(data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching bookings:", err);
                    message.error("Không thể tải danh sách đơn hàng");
                    setLoading(false);
                });
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [session]);

    const handlePayment = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsPaymentModalVisible(true);
    };

    const confirmPayment = async () => {
        if (!selectedBooking) return;
        setPaying(true);
        try {
            const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
            });

            if (res.ok) {
                message.success('Thanh toán thành công! Đơn hàng của bạn đang được xử lý.');
                setIsPaymentModalVisible(false);
                fetchBookings();
            } else {
                message.error('Thanh toán thất bại. Vui lòng thử lại sau.');
            }
        } catch (error) {
            message.error('Lỗi kết nối máy chủ.');
        } finally {
            setPaying(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" tip="Đang tải lịch sử đơn hàng...">
                    <div style={{ height: 50 }} />
                </Spin>
            </div>
        );
    }

    const columns = [
        {
            title: 'Dịch vụ',
            dataIndex: 'itemName',
            key: 'itemName',
            render: (text: string) => <Text strong>{text}</Text>
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => (
                <Tag color={type === 'HOTEL' ? 'blue' : type === 'FLIGHT' ? 'green' : 'gold'}>
                    {type === 'HOTEL' ? 'Khách sạn' : type === 'FLIGHT' ? 'Chuyến bay' : 'Tour'}
                </Tag>
            )
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'finalPrice',
            key: 'finalPrice',
            render: (price: number) => (
                <Text type="danger" strong>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                </Text>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'gold';
                let label = 'Đang chờ';
                if (status === 'CONFIRMED') { color = 'blue'; label = 'Đã xác nhận'; }
                if (status === 'PAID') { color = 'green'; label = 'Đã thanh toán'; }
                if (status === 'CANCELLED') { color = 'red'; label = 'Đã hủy'; }
                return <Tag color={color}>{label}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: Booking) => (
                <Space size="middle">
                    {record.status === 'CONFIRMED' && (
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handlePayment(record)}
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Thanh toán ngay
                        </Button>
                    )}
                    {record.status === 'PAID' && (
                        <Text type="success" strong>Đã thanh toán</Text>
                    )}
                </Space>
            )
        }
    ];

    return (
        <Content style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
            <Card
                style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                title={
                    <Space>
                        <HistoryOutlined style={{ color: '#1677ff' }} />
                        <Title level={3} style={{ margin: 0 }}>Lịch sử đơn hàng</Title>
                    </Space>
                }
            >
                {bookings.length === 0 ? (
                    <Empty
                        description="Bạn chưa có đơn hàng nào."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => router.push('/')} icon={<RocketOutlined />}>
                            Khám phá ngay
                        </Button>
                    </Empty>
                ) : (
                    <Table
                        dataSource={bookings}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                    />
                )}
            </Card>

            <Modal
                title="Thanh toán đơn hàng"
                open={isPaymentModalVisible}
                onCancel={() => setIsPaymentModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsPaymentModalVisible(false)}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={paying}
                        onClick={confirmPayment}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Tôi đã chuyển khoản thành công
                    </Button>,
                ]}
                centered
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Title level={4}>{selectedBooking?.itemName}</Title>
                    <Paragraph>
                        Số tiền cần thanh toán: <Text type="danger" strong style={{ fontSize: 20 }}>
                            {selectedBooking && new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedBooking.finalPrice)}
                        </Text>
                    </Paragraph>
                    <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 12, marginBottom: 20 }}>
                        <QRCode
                            value={`PAYMENT_FOR_BOOKING_${selectedBooking?.id}`}
                            size={200}
                            style={{ margin: '0 auto' }}
                        />
                        <div style={{ marginTop: 16 }}>
                            <Text strong>Quét mã QR để thanh toán qua Ngân hàng / Ví điện tử</Text>
                            <br />
                            <Text type="secondary">Nội dung chuyển khoản: <Text code>Traveleasy {selectedBooking?.id}</Text></Text>
                        </div>
                    </div>
                    <Alert
                        title="Lưu ý"
                        description="Vui lòng kiểm tra kỹ số tiền và nội dung chuyển khoản trước khi xác nhận."
                        type="warning"
                        showIcon
                    />
                </div>
            </Modal>
        </Content>
    );
}
