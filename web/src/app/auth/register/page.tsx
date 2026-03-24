'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Typography, message, Row, Col, Card, Steps } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function Register() {
  const router = useRouter();
  const [form] = Form.useForm();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Step 1: Request OTP
  const onSendOtp = async (values: any) => {
    setLoading(true);
    const { email } = values;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        message.success(data.message || 'Mã xác nhận đã được gửi!');
        setUserEmail(email);
        setCurrentStep(1);
      } else {
        message.error(data.error || 'Có lỗi xảy ra khi gửi OTP.');
      }
    } catch (error) {
      setLoading(false);
      message.error('Không thể kết nối đến máy chủ.');
    }
  };

  // Step 2: Register with OTP
  const onRegister = async (values: any) => {
    setLoading(true);
    const allValues = form.getFieldsValue(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: allValues.name, 
          email: allValues.email, 
          password: allValues.password, 
          otp: values.otp 
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        router.push('/auth/signin');
      } else {
        message.error(data.error || 'Đăng ký thất bại.');
      }
    } catch (error) {
      setLoading(false);
      message.error('Không thể kết nối đến máy chủ.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0f2f5' }}>
      <Row style={{ width: '100%' }}>
        {/* Left side: Image */}
        <Col xs={0} sm={0} md={12} lg={14} style={{ 
          backgroundImage: 'url(/images/imghotel2.jpg)', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}>
          <div style={{ 
            height: '100%', 
            width: '100%', 
            background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <Title style={{ color: 'white', fontSize: '3rem', margin: 0 }}>Tham gia cùng TravelEasy</Title>
            <Title level={3} style={{ color: 'white', marginTop: 10, fontWeight: 300 }}>Mở khóa những ưu đãi độc quyền ngay hôm nay.</Title>
          </div>
        </Col>

        {/* Right side: Form */}
        <Col xs={24} sm={24} md={12} lg={10} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <Card style={{ width: '100%', maxWidth: 450, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} variant="borderless">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={2} style={{ color: '#52c41a', margin: 0 }}>Tạo Tài Khoản</Title>
              <Text type="secondary" style={{ fontSize: 16 }}>Chỉ vài bước đơn giản để bắt đầu</Text>
            </div>

            <Steps
              current={currentStep}
              items={[
                { title: 'Thông tin' },
                { title: 'Xác thực Email' },
              ]}
              style={{ marginBottom: 32 }}
            />

            <Form
              form={form}
              name="register"
              layout="vertical"
              onFinish={currentStep === 0 ? onSendOtp : onRegister}
              size="large"
            >
              {currentStep === 0 && (
                <>
                  <Form.Item
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập Họ Tên!' }]}
                  >
                    <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Họ và Tên" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập Email!' },
                      { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                  >
                    <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Email của bạn" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: 'Vui lòng nhập Mật khẩu!' },
                      { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mật khẩu" autoComplete="new-password" />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48, fontSize: 16, borderRadius: 8, background: '#52c41a', borderColor: '#52c41a' }}>
                      Gửi mã xác nhận OTP
                    </Button>
                  </Form.Item>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Text>Mã 6 chữ số đã được gửi đến:</Text><br/>
                    <Text strong style={{ color: '#1677ff' }}>{userEmail}</Text>
                  </div>
                  <Form.Item
                    name="otp"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mã OTP!' },
                      { len: 6, message: 'Mã OTP phải có đúng 6 chữ số!' }
                    ]}
                  >
                    <Input 
                      prefix={<SafetyCertificateOutlined style={{ color: '#bfbfbf' }} />} 
                      placeholder="Nhập mã OTP (6 số)" 
                      maxLength={6}
                      style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48, fontSize: 16, borderRadius: 8 }}>
                      Xác nhận & Đăng ký
                    </Button>
                  </Form.Item>
                  <div style={{ textAlign: 'center' }}>
                    <Button type="link" onClick={() => setCurrentStep(0)} disabled={loading}>
                      Quay lại sửa thông tin
                    </Button>
                  </div>
                </>
              )}

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Text type="secondary">Đã có tài khoản? </Text>
                <Link href="/auth/signin" style={{ fontWeight: 600, color: '#52c41a' }}>Đăng nhập</Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}