'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, Typography, message, Spin, Divider, Space, Radio, Result } from 'antd';
import { MinusCircleOutlined, PlusOutlined, LockOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

function OrderContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    const [form] = Form.useForm();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);
    const [tripType, setTripType] = useState('ONE_WAY');

    const [vouchers, setVouchers] = useState<any[]>([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [selectedVoucherCode, setSelectedVoucherCode] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && session?.user) {
            form.setFieldsValue({
                customerName: session.user.name,
            });

            // Fetch Vouchers
            fetch(`/api/vouchers/available`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setVouchers(data);
                })
                .catch(err => console.error("Error fetching vouchers:", err));
        }
    }, [session, form, loading]);

    const handleApplyVoucher = useCallback(async (code: string) => {
        if (!code) {
            setDiscountAmount(0);
            return;
        }

        try {
            const res = await fetch('/api/vouchers/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    orderValue: totalPrice,
                    userId: session?.user?.id,
                    serviceType: type
                })
            });
            const data = await res.json();
            if (data.valid) {
                setDiscountAmount(data.discountAmount);
                message.success(`Đã áp dụng mã: giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.discountAmount)}`);
            } else {
                setDiscountAmount(0);
                setSelectedVoucherCode(null);
                message.error(data.message || 'Mã giảm giá không hợp lệ');
            }
        } catch (e) {
            console.error(e);
        }
    }, [totalPrice, session, type]);

    useEffect(() => {
        if (selectedVoucherCode) {
            handleApplyVoucher(selectedVoucherCode);
        } else {
            setDiscountAmount(0);
        }
    }, [selectedVoucherCode, handleApplyVoucher]); // Re-calculate if price or voucher changes

    useEffect(() => {
        if (!type || !id) {
            message.error('Thông tin đặt hàng không hợp lệ');
            router.push('/');
            return;
        }

        let endpoint = '';
        if (type === 'TOUR') endpoint = `/api/tours/${id}`;
        else if (type === 'HOTEL') endpoint = `/api/hotels/${id}`;
        else if (type === 'FLIGHT') endpoint = `/api/flights/${id}`;

        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                setItem(data);
                setLoading(false);
                setTotalPrice(data.price || 0); // Initial price
            })
            .catch(err => {
                console.error(err);
                message.error('Không tìm thấy thông tin sản phẩm');
                setLoading(false);
            });
    }, [type, id, router]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    if (status === 'loading' || (loading && status === 'authenticated') || status === 'unauthenticated') {
        return (
            <div style={{ padding: '100px', textAlign: 'center' }}>
                <Spin size="large" tip="Đang tải thông tin...">
                    <div style={{ height: 50 }} />
                </Spin>
            </div>
        );
    }

    const handleValuesChange = (changedValues: any, allValues: any) => {
        if (!item) return;

        let price = item.price || 0;
        let grandTotal = 0;

        if (type === 'HOTEL') {
            // Hotel Logic: Loop through rooms, each has its own dates
            const rooms = allValues.rooms || [];
            rooms.forEach((room: any) => {
                if (!room) return;
                const qty = room.quantity || 0;
                let multiplier = 1;
                if (room.roomType === 'DOUBLE') multiplier = 1.5;

                // Calculate days for THIS room
                let days = 1;
                if (room.dates && room.dates.length === 2) {
                    const start = room.dates[0];
                    const end = room.dates[1];
                    const diff = end.diff(start, 'day');
                    days = diff > 0 ? diff : 1;
                }

                grandTotal += price * days * qty * multiplier;
            });

        } else if (type === 'FLIGHT') {
            // Flight Logic
            const outboundSeats = allValues.outboundSeats || [];
            outboundSeats.forEach((seat: any) => {
                if (!seat) return;
                const qty = seat.quantity || 0;
                let multiplier = 1;
                if (seat.seatClass === 'BUSINESS') multiplier = 1.5;
                grandTotal += price * qty * multiplier;
            });

            if (allValues.tripType === 'ROUND_TRIP') {
                const inboundSeats = allValues.inboundSeats || [];
                inboundSeats.forEach((seat: any) => {
                    if (!seat) return;
                    const qty = seat.quantity || 0;
                    let multiplier = 1;
                    if (seat.seatClass === 'BUSINESS') multiplier = 1.5;
                    grandTotal += price * qty * multiplier;
                });
            }

        } else {
            // Tour Logic: Global dates
            let quantity = allValues.totalPeople || 1;
            grandTotal = price * quantity;
        }

        setTotalPrice(grandTotal);

        if (changedValues.tripType) {
            setTripType(changedValues.tripType);
        }
    };

    const handleSubmit = async (values: any) => {
        if (!session) {
            message.error('Vui lòng đăng nhập!');
            return;
        }

        const commonData = {
            userId: session.user.id,
            type: type,
            itemId: id,
            itemName: item.name,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
        };

        try {
            const promises: Promise<any>[] = [];

            if (type === 'HOTEL') {
                // Submit multiple bookings for Hotel with INDIVIDUAL DATES
                values.rooms.forEach((room: any) => {
                    let roomPrice = item.price || 0;
                    let multiplier = room.roomType === 'DOUBLE' ? 1.5 : 1;

                    let days = 1;
                    let startDate = new Date();
                    let endDate = null;

                    if (room.dates && room.dates.length === 2) {
                        startDate = room.dates[0];
                        endDate = room.dates[1];
                        days = room.dates[1].diff(room.dates[0], 'day') || 1;
                    }

                    const total = roomPrice * days * room.quantity * multiplier;

                    promises.push(fetch('/api/bookings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...commonData,
                            startDate: startDate,
                            endDate: endDate,
                            price: total,
                            totalPeople: room.quantity,
                            seatClass: room.roomType,
                        }),
                    }));
                });

            } else if (type === 'FLIGHT') {
                // ... Flight Submission (Same as before) ...
                // Outbound
                const outboundDate = values.startDate;
                values.outboundSeats.forEach((seat: any) => {
                    let seatPrice = item.price || 0;
                    let multiplier = seat.seatClass === 'BUSINESS' ? 1.5 : 1;
                    const total = seatPrice * seat.quantity * multiplier;

                    promises.push(fetch('/api/bookings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...commonData,
                            startDate: outboundDate,
                            price: total,
                            totalPeople: seat.quantity,
                            seatClass: seat.seatClass,
                            itemName: `${item.name} (Chiều đi)`,
                        }),
                    }));
                });

                // Inbound
                if (values.tripType === 'ROUND_TRIP') {
                    const inboundDate = values.returnDate;
                    values.inboundSeats.forEach((seat: any) => {
                        let seatPrice = item.price || 0;
                        let multiplier = seat.seatClass === 'BUSINESS' ? 1.5 : 1;
                        const total = seatPrice * seat.quantity * multiplier;

                        promises.push(fetch('/api/bookings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...commonData,
                                startDate: inboundDate,
                                price: total,
                                totalPeople: seat.quantity,
                                seatClass: seat.seatClass,
                                itemName: `${item.name} (Chiều về)`,
                            }),
                        }));
                    });
                }
            } else {
                // Tour
                promises.push(fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...commonData,
                        startDate: values.dates[0],
                        endDate: values.dates[1],
                        price: totalPrice,
                        totalPeople: values.totalPeople,
                    }),
                }));
            }

            await Promise.all(promises);
            message.success('Đặt hàng thành công!');
            router.push('/order/success');

        } catch (error) {
            console.error(error);
            message.error('Có lỗi xảy ra, vui lòng thử lại.');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;

    const getInitialValues = () => {
        if (type === 'HOTEL') return { rooms: [{ roomType: 'SINGLE', quantity: 1 }] };
        if (type === 'FLIGHT') return { tripType: 'ONE_WAY', outboundSeats: [{ seatClass: 'ECONOMY', quantity: 1 }], inboundSeats: [{ seatClass: 'ECONOMY', quantity: 1 }] };
        return { totalPeople: 1 };
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
            <Card title={<Title level={3}>Xác nhận đặt hàng</Title>}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Title level={4} style={{ color: '#1677ff' }}>{item?.name}</Title>
                        <Text strong>Loại dịch vụ:</Text> <Text>{type}</Text><br />
                        <Text strong>Đơn giá:</Text> <Text>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item?.price)}</Text>
                        <Divider />

                        <div style={{ marginBottom: 16 }}>
                            <Text strong>Mã giảm giá:</Text>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <Select
                                    style={{ flex: 1 }}
                                    placeholder="Chọn mã giảm giá"
                                    allowClear
                                    onChange={(val) => {
                                        setSelectedVoucherCode(val);
                                        // If cleared, also clear the manual input? Maybe better to keep them synced or separate.
                                        // Simple approch: Changing select updates the code to check.
                                    }}
                                    value={selectedVoucherCode}
                                    disabled={totalPrice === 0}
                                >
                                    {vouchers.filter(v => v.category === 'ALL' || v.category === type).map(v => (
                                        <Option key={v.code} value={v.code}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{v.code}</span>
                                                <span style={{ color: 'green' }}>
                                                    {v.type === 'PERCENT' ? `-${v.value}%` : `-${v.value / 1000}k`}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.8em', color: '#888' }}>
                                                Đơn tối thiểu: {v.minOrderValue / 1000}k
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <Input.Search
                                    placeholder="Nhập mã khác"
                                    enterButton="Áp dụng"
                                    onSearch={(val) => {
                                        if (val) setSelectedVoucherCode(val);
                                    }}
                                    disabled={totalPrice === 0}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text>Tạm tính:</Text>
                            <Text>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}</Text>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                            <Text>Giảm giá:</Text>
                            <Text>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}</Text>
                        </div>

                        <Divider style={{ margin: '12px 0' }} />
                        <Title level={5}>Tổng cộng:</Title>
                        <Title level={2} style={{ color: '#faad14', margin: 0 }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, totalPrice - discountAmount))}
                        </Title>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            onValuesChange={handleValuesChange}
                            initialValues={getInitialValues()}
                        >
                            <Form.Item name="customerName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                                <Input placeholder="Nguyễn Văn A" />
                            </Form.Item>

                            <Form.Item name="customerPhone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                                <Input placeholder="0912345678" />
                            </Form.Item>

                            {/* --- HOTEL FIELDS --- */}
                            {type === 'HOTEL' && (
                                <>
                                    <div style={{ marginBottom: 8 }}><Text strong>Danh sách phòng:</Text></div>
                                    <Form.List name="rooms">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Card size="small" key={key} style={{ marginBottom: 16, background: '#f5f5f5' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 8 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <Text strong>Phòng #{name + 1}</Text>
                                                                {fields.length > 1 && (
                                                                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'roomType']}
                                                                    label="Loại"
                                                                    rules={[{ required: true }]}
                                                                    style={{ margin: 0, flex: 1 }}
                                                                >
                                                                    <Select>
                                                                        <Option value="SINGLE">Phòng đơn</Option>
                                                                        <Option value="DOUBLE">Phòng đôi</Option>
                                                                    </Select>
                                                                </Form.Item>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'quantity']}
                                                                    label="SL"
                                                                    rules={[{ required: true }]}
                                                                    style={{ margin: 0, width: 80 }}
                                                                >
                                                                    <InputNumber min={1} style={{ width: '100%' }} />
                                                                </Form.Item>
                                                            </div>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'dates']}
                                                                label="Ngày nhận / trả"
                                                                rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                                                                style={{ marginBottom: 0 }}
                                                            >
                                                                <DatePicker.RangePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
                                                            </Form.Item>
                                                        </div>
                                                    </Card>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Thêm phòng
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                </>
                            )}

                            {/* --- FLIGHT FIELDS --- */}
                            {type === 'FLIGHT' && (
                                <>
                                    <Form.Item name="tripType" label="Loại chuyến đi">
                                        <Radio.Group>
                                            <Radio.Button value="ONE_WAY">Một chiều</Radio.Button>
                                            <Radio.Button value="ROUND_TRIP">Khứ hồi</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>

                                    {tripType === 'ROUND_TRIP' && <Divider titlePlacement="left">Chiều đi</Divider>}
                                    <Form.Item name="startDate" label="Ngày khởi hành" rules={[{ required: true }]}>
                                        <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
                                    </Form.Item>

                                    <div style={{ marginBottom: 8 }}><Text strong>Vé Chiều đi:</Text></div>
                                    <Form.List name="outboundSeats">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'seatClass']}
                                                            rules={[{ required: true }]}
                                                            style={{ margin: 0, flex: 1 }}
                                                        >
                                                            <Select placeholder="Hạng vé">
                                                                <Option value="ECONOMY">Phổ thông</Option>
                                                                <Option value="BUSINESS">Thương gia</Option>
                                                            </Select>
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'quantity']}
                                                            rules={[{ required: true }]}
                                                            style={{ margin: 0, width: 80 }}
                                                        >
                                                            <InputNumber min={1} placeholder="SL" style={{ width: '100%' }} />
                                                        </Form.Item>
                                                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                                    </div>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Thêm vé
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>

                                    {tripType === 'ROUND_TRIP' && (
                                        <>
                                            <Divider titlePlacement="left">Chiều về</Divider>
                                            <Form.Item
                                                name="returnDate"
                                                label="Ngày về"
                                                dependencies={['startDate']}
                                                rules={[
                                                    { required: true, message: 'Vui lòng chọn ngày về' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            if (!value || !getFieldValue('startDate') || value.isAfter(getFieldValue('startDate'))) {
                                                                return Promise.resolve();
                                                            }
                                                            return Promise.reject(new Error('Ngày về phải sau ngày đi!'));
                                                        },
                                                    }),
                                                ]}
                                            >
                                                <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
                                            </Form.Item>

                                            <div style={{ marginBottom: 8 }}><Text strong>Vé Chiều về:</Text></div>
                                            <Form.List name="inboundSeats">
                                                {(fields, { add, remove }) => (
                                                    <>
                                                        {fields.map(({ key, name, ...restField }) => (
                                                            <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'seatClass']}
                                                                    rules={[{ required: true }]}
                                                                    style={{ margin: 0, flex: 1 }}
                                                                >
                                                                    <Select placeholder="Hạng vé">
                                                                        <Option value="ECONOMY">Phổ thông</Option>
                                                                        <Option value="BUSINESS">Thương gia</Option>
                                                                    </Select>
                                                                </Form.Item>
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, 'quantity']}
                                                                    rules={[{ required: true }]}
                                                                    style={{ margin: 0, width: 80 }}
                                                                >
                                                                    <InputNumber min={1} placeholder="SL" style={{ width: '100%' }} />
                                                                </Form.Item>
                                                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                                                            </div>
                                                        ))}
                                                        <Form.Item>
                                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                                Thêm vé về
                                                            </Button>
                                                        </Form.Item>
                                                    </>
                                                )}
                                            </Form.List>
                                        </>
                                    )}
                                </>
                            )}

                            {/* --- TOUR FIELDS --- */}
                            {type === 'TOUR' && (
                                <>
                                    <Form.Item name="dates" label="Ngày đi / về" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
                                        <DatePicker.RangePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().endOf('day')} />
                                    </Form.Item>
                                    <Form.Item name="totalPeople" label="Số lượng khách" rules={[{ required: true }]}>
                                        <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                </>
                            )}

                            <Button type="primary" htmlType="submit" block size="large" style={{ marginTop: 16 }}>
                                Xác nhận đặt hàng
                            </Button>
                        </Form>
                    </Col>
                </Row>
            </Card>
        </div>
    );
}

export default function OrderPage() {
    return (
        <React.Suspense fallback={<div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>}>
            <OrderContent />
        </React.Suspense>
    );
}
