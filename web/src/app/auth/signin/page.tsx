'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Form, Input, Button, Typography, message, Row, Col, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    const { email, password } = values;
    
    const res = await signIn('credentials', { 
      email, 
      password, 
      redirect: false 
    });

    setLoading(false);
    if (res?.error) {
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } else {
      message.success('Đăng nhập thành công!');
      window.location.href = '/';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0f2f5' }}>
      <Row style={{ width: '100%' }}>
        {/* Left side: Image */}
        <Col xs={0} sm={0} md={12} lg={14} style={{ 
          backgroundImage: 'url(/images/imgtour3.jpg)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}>
          <div style={{ 
            height: '100%', 
            width: '100%', 
            background: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <Title style={{ color: 'white', fontSize: '3rem', margin: 0 }}>Khám phá thế giới</Title>
            <Title level={3} style={{ color: 'white', marginTop: 10, fontWeight: 300 }}>Cùng TravelEasy tạo nên những kỷ niệm khó quên.</Title>
          </div>
        </Col>

        {/* Right side: Form */}
        <Col xs={24} sm={24} md={12} lg={10} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <Card style={{ width: '100%', maxWidth: 450, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} variant="borderless">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title level={2} style={{ color: '#1677ff', margin: 0 }}>TravelEasy</Title>
              <Text type="secondary" style={{ fontSize: 16 }}>Chào mừng bạn quay trở lại!</Text>
            </div>

            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập Email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Email của bạn" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mật khẩu" autoComplete="current-password" />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                <Link href="/auth/forgot-password" style={{ color: '#1677ff' }}>Quên mật khẩu?</Link>
              </div>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48, fontSize: 16, borderRadius: 8 }}>
                  Đăng Nhập
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">Chưa có tài khoản? </Text>
                <Link href="/auth/register" style={{ fontWeight: 600, color: '#1677ff' }}>Đăng ký ngay</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}