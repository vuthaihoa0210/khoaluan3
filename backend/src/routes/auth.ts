import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const router = Router();
const prisma = new PrismaClient();
// Khởi tạo an toàn: nếu trên Render bạn chưa kịp điền RESEND_API_KEY thì nó sẽ dùng 're_dummy' tạm để không bị sập (crash) app.
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

// Helper function to send email via Resend API
async function sendOTPEmail(email: string, otp: string) {
    if (!process.env.RESEND_API_KEY) {
        console.log(`[TEST MODE] Không tìm thấy RESEND_API_KEY. Giả lập gửi OTP: ${otp} tới ${email}`);
        return;
    }

    const { data, error } = await resend.emails.send({
        from: 'TravelEasy <onboarding@resend.dev>',
        to: email, // LƯU Ý: Ở gói free, Resend email chỉ gửi được đến chính email đăng ký tài khoản Resend
        subject: 'Mã xác nhận Đăng ký tài khoản TravelEasy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #1677ff; text-align: center;">Xác nhận địa chỉ Email</h2>
                <p>Xin chào,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>TravelEasy</strong>.</p>
                <p>Đây là mã OTP bảo mật gồm 6 chữ số để xác minh email của bạn. Mã OTP này sẽ hết hạn trong 10 phút:</p>
                <div style="background-color: #f0f5ff; padding: 16px; margin: 24px 0; text-align: center; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1677ff;">${otp}</span>
                </div>
                <p>Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                <p>Trân trọng,<br>Đội ngũ TravelEasy</p>
            </div>
        `,
    });

    if (error) {
        throw new Error(error.message);
    }
}

// Send OTP
router.post('/send-otp', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email là bắt buộc' });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ error: 'Email đã được sử dụng' });
            return;
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete any existing OTPs for this email to invalidate old ones
        await prisma.oTP.deleteMany({
            where: { email }
        });

        await prisma.oTP.create({
            data: {
                email,
                code: otpCode,
                expiresAt,
            }
        });

        try {
            await sendOTPEmail(email, otpCode);
        } catch (mailError) {
            console.error("MAIL ERROR:", mailError);
            res.status(500).json({ error: "Không gửi được OTP" });
            return;
        }

        res.json({ message: 'Mã OTP đã được gửi đến email của bạn' });
    } catch (error) {
        console.error("SEND OTP ERROR:", error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// Register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name, otp } = req.body;

        if (!email || !password || !name || !otp) {
            res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin và mã OTP' });
            return;
        }

        // Verify OTP
        const validateOtp = await prisma.oTP.findFirst({
            where: { email, code: otp }
        });

        if (!validateOtp) {
            res.status(400).json({ error: 'Mã OTP không đúng' });
            return;
        }

        if (validateOtp.expiresAt < new Date()) {
            res.status(400).json({ error: 'Mã OTP đã hết hạn' });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ error: 'Tài khoản đã tồn tại' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        // Clean up OTP after successful registration
        await prisma.oTP.deleteMany({
            where: { email }
        });

        res.json({ message: 'Đăng ký thành công', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// Login (for NextAuth usage)
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            res.status(401).json({ error: 'Thông tin đăng nhập không hợp lệ' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({ error: 'Thông tin đăng nhập không hợp lệ' });
            return;
        }

        res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// Forgot Password (Mock)
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email là bắt buộc' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            res.status(404).json({ error: 'Email không tồn tại trong hệ thống' });
            return;
        }

        // In a real app, send an email here
        res.json({ message: 'Yêu cầu đặt lại mật khẩu đã được gửi đến email của bạn' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

export default router;
