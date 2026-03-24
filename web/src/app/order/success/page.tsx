'use client';

import React from 'react';
import { Button, Result, Card, Typography, Space } from 'antd';
import { useRouter } from 'next/navigation';
import { CheckCircleFilled, RocketOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

export default function OrderSuccessPage() {
    const router = useRouter();

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0f2f5',
            padding: '40px 20px'
        }}>
            <Card
                style={{
                    maxWidth: 600,
                    width: '100%',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    textAlign: 'center'
                }}
            >
                <Result
                    status="success"
                    title={<Title level={2}>Đặt hàng thành công!</Title>}
                    subTitle={
                        <Space orientation="vertical" size="small">
                            <Paragraph style={{ fontSize: 16, marginBottom: 0 }}>
                                Đơn hàng của bạn đã được gửi thành công.
                            </Paragraph>
                            <Paragraph type="secondary">
                                Vui lòng chờ xác nhận từ đội ngũ TravelEasy. Chúng tôi sẽ liên hệ với bạn qua số điện thoại sớm nhất có thể.
                            </Paragraph>
                        </Space>
                    }
                    extra={[
                        <Button
                            type="primary"
                            key="history"
                            size="large"
                            icon={<HistoryOutlined />}
                            style={{ height: 48, borderRadius: 8, padding: '0 32px' }}
                            onClick={() => router.push('/bookings')}
                        >
                            Theo dõi đơn hàng
                        </Button>,
                        <Button
                            key="home"
                            size="large"
                            icon={<RocketOutlined />}
                            style={{ height: 48, borderRadius: 8, padding: '0 32px' }}
                            onClick={() => router.push('/')}
                        >
                            Quay lại trang chủ
                        </Button>,
                    ]}
                />

                <div style={{ marginTop: 24, padding: '16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
                    <Text type="success">
                        <CheckCircleFilled /> Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của TravelEasy!
                    </Text>
                </div>
            </Card>
        </div>
    );
}
