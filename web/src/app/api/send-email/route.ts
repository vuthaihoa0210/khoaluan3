import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Missing email or otp" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
        from: `"TravelEasy" <${process.env.GMAIL_USER}>`,
        to: email,
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
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Vercel Email Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
