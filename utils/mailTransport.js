const nodemailer = require('nodemailer')

exports.transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.VERIFY_EMAIL_NAME,
            pass: process.env.VERIFY_EMAIL_APP_PASSWORD,
        },
    });

exports.mailResetPassword = (linkVerify) => {
    return `
        <div style="width: 75%; padding: 0 12px; margin: 0 auto;">
            <div style="padding: 12px 0; text-align: center; border-bottom: 1px solid #919eab99">
                <div style="font-size: 48px; font-style: italic; font-weight: bolder; color: #00695C;">LUDWIGIA</div>
            </div>
            <div style="margin-bottom: 12px;">
                <h2>Ludwigia xin chào!</h2>
                <p style="font-size: 16px;">Bạn vừa gửi yêu cầu thay đổi mật khẩu đăng nhập cho tài khoản của bạn.</p>
                <p style="font-size: 16px;">Vì lý do bảo mật, vui lòng nhấn xác minh để chúng tôi biết đó là bạn trước khi thay đổi mật khẩu.</p>
                <p style="font-size: 16px;">Mã xác minh này chỉ có hiệu lực trong <b>15 phút</b> kể từ khi bạn gửi yêu cầu.</p>
                <a 
                    href=${linkVerify}
                    style="display: block; padding: 12px 0; margin: 32px 0; background-color: #00695C; color: white; text-align: center; text-decoration: none; border-radius: 8px"
                >
                    XÁC MINH TÀI KHOẢN
                </a>
            </div>
            <div style="border-top: 1px solid #919eab99; text-align: center; padding: 12px">
                <div style="color: #919eab; font-size: 14px; margin-bottom: 4px;">LUDWIGIA</div>
                <div style="color: #919eab; font-size: 14px; margin-bottom: 4px;">Tra cứu khoa học - Thông tin tin cậy - Tham khảo dễ dàng</div>
                <div style="color: #919eab; font-size: 14px">© Since 2023</div>
            </div>
        </div>
    `
}
