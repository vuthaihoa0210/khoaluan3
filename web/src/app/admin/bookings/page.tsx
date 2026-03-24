'use client';

import { Button, Card, Space, Table, Tag, Typography, message, Modal, Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function AdminBookingsPage() {
    const { data: session, status } = useSession();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
            router.push('/');
            message.error('Bạn không có quyền truy cập trang này');
        }
    }, [status, session, router]);

    const fetchBookings = () => {
        if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') return;
        setLoading(true);
        fetch('/api/bookings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setBookings(data);
                } else {
                    message.error('Lỗi tải danh sách đơn hàng');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
            fetchBookings();
        }
    }, [status, session]);

    const handleUpdateStatus = (id: string, status: string) => {
        Modal.confirm({
            title: 'Xác nhận',
            content: `Bạn có chắc muốn chuyển trạng thái đơn hàng này sang ${status}?`,
            onOk: async () => {
                try {
                    const res = await fetch(`/api/bookings/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    });
                    if (res.ok) {
                        message.success('Cập nhật thành công');
                        fetchBookings();
                    } else {
                        message.error('Cập nhật thất bại');
                    }
                } catch (error) {
                    message.error('Lỗi kết nối');
                }
            }
        });
    };

    const columns = [
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text: string, record: any) => (
                <div>
                    <Text strong>{text}</Text><br />
                    <Text type="secondary">{record.customerPhone}</Text>
                </div>
            )
        },
        {
            title: 'Dịch vụ',
            key: 'service',
            render: (_: any, record: any) => (
                <div>
                    <Tag color={record.type === 'TOUR' ? 'gold' : record.type === 'FLIGHT' ? 'blue' : 'cyan'}>{record.type}</Tag>
                    <div style={{ marginTop: 4 }}>
                        <Text strong>{record.itemName}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Chi tiết',
            key: 'details',
            render: (_: any, record: any) => (
                <div>
                    <div>Ngày đi: {dayjs(record.startDate).format('DD/MM/YYYY')}</div>
                    {record.endDate && <div>Ngày về: {dayjs(record.endDate).format('DD/MM/YYYY')}</div>}
                    <div>SL: {record.totalPeople} | {record.seatClass || 'N/A'}</div>
                </div>
            )
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => <Text strong style={{ color: '#faad14' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}</Text>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                let text = status;
                if (status === 'PENDING') { color = 'orange'; text = 'Chờ xử lý'; }
                if (status === 'CONFIRMED') { color = 'blue'; text = 'Đã xác nhận'; }
                if (status === 'PAID') { color = 'green'; text = 'Đã thanh toán'; }
                if (status === 'CANCELLED') { color = 'red'; text = 'Đã hủy'; }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {record.status === 'PENDING' && (
                        <>
                            <Button type="primary" size="small" onClick={() => handleUpdateStatus(record.id, 'CONFIRMED')}>Duyệt đơn</Button>
                            <Button danger size="small" onClick={() => handleUpdateStatus(record.id, 'CANCELLED')}>Hủy đơn</Button>
                        </>
                    )}
                    {record.status === 'CONFIRMED' && (
                        <Button style={{ borderColor: '#52c41a', color: '#52c41a' }} size="small" onClick={() => handleUpdateStatus(record.id, 'PAID')}>Xác nhận thanh toán</Button>
                    )}
                </div>
            )
        }
    ];

    if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <Spin size="large" tip="Đang kiểm tra quyền truy cập...">
                    <div style={{ height: 50 }} />
                </Spin>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null; // Will redirect via useEffect
    }

    return (
        <div style={{ padding: 24 }}>
            <Card title={<Title level={3}>Quản lý Đơn hàng</Title>}>
                <Table
                    columns={columns}
                    dataSource={bookings}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
}
