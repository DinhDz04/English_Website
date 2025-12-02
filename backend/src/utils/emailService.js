const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Gửi email đặt lại mật khẩu
  async sendPasswordReset(email, fullName, newPassword) {
    try {
      const mailOptions = {
        from: `"English Learning System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔑 Đặt lại mật khẩu - English Learning System',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đặt lại mật khẩu</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f9fafb;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                border-radius: 12px 12px 0 0;
                text-align: center;
                color: white;
              }
              .logo {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .content {
                background: white;
                padding: 40px;
                border-radius: 0 0 12px 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .password-box {
                background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
                color: #333;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 2px;
                margin: 20px 0;
                border: 2px dashed #e74c3c;
              }
              .info-box {
                background: #f8f9fa;
                border-left: 4px solid #3498db;
                padding: 15px;
                margin: 20px 0;
              }
              .steps {
                margin: 25px 0;
              }
              .step {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
              }
              .step-number {
                background: #3498db;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🎯 English Learning</div>
                <p>Hệ thống học tiếng Anh thông minh</p>
              </div>
              
              <div class="content">
                <h2>Xin chào ${fullName},</h2>
                
                <p>Quản trị viên đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                
                <p>Đây là mật khẩu mới của bạn:</p>
                
                <div class="password-box">
                  ${newPassword}
                </div>
                
                <div class="info-box">
                  <strong>⚠️ Lưu ý quan trọng:</strong>
                  <ul style="margin-top: 10px;">
                    <li>Mật khẩu này có giá trị trong 24 giờ</li>
                    <li>Vui lòng đăng nhập và thay đổi mật khẩu ngay</li>
                    <li>Không chia sẻ mật khẩu này với bất kỳ ai</li>
                  </ul>
                </div>
                
                <div class="steps">
                  <h3>Hướng dẫn đăng nhập:</h3>
                  
                  <div class="step">
                    <div class="step-number">1</div>
                    <div>
                      <strong>Truy cập trang đăng nhập</strong><br>
                      <a href="https://your-domain.com/login" style="color: #3498db;">https://your-domain.com/login</a>
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-number">2</div>
                    <div>
                      <strong>Sử dụng thông tin đăng nhập:</strong><br>
                      Email: ${email}<br>
                      Mật khẩu: [Sử dụng mật khẩu trên]
                    </div>
                  </div>
                  
                  <div class="step">
                    <div class="step-number">3</div>
                    <div>
                      <strong>Vào phần Cài đặt → Đổi mật khẩu</strong><br>
                      Để đặt lại mật khẩu mới của riêng bạn
                    </div>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="https://your-domain.com/login" class="button">Đăng nhập ngay</a>
                </div>
                
                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ ngay với quản trị viên.</p>
                
                <div class="footer">
                  <p>📧 Email hỗ trợ: ${process.env.EMAIL_USER}</p>
                  <p>© ${new Date().getFullYear()} English Learning System. Mọi quyền được bảo lưu.</p>
                  <p style="font-size: 12px; color: #999;">
                    Đây là email tự động, vui lòng không trả lời email này.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Gửi email thông báo thay đổi trạng thái tài khoản
  async sendAccountStatusChange(email, fullName, status) {
    try {
      const statusText = status === 'active' ? 'đã được kích hoạt' : 
                        status === 'inactive' ? 'đã bị vô hiệu hóa' : 
                        'đã bị khóa';
      
      const statusColor = status === 'active' ? '#27ae60' : 
                         status === 'inactive' ? '#f39c12' : 
                         '#e74c3c';

      const mailOptions = {
        from: `"English Learning System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `📢 Thay đổi trạng thái tài khoản - English Learning System`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thay đổi trạng thái tài khoản</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .status-badge { 
                display: inline-block; 
                padding: 10px 20px; 
                background-color: ${statusColor}; 
                color: white; 
                border-radius: 20px; 
                font-weight: bold; 
                margin: 20px 0; 
              }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>English Learning System</h1>
              </div>
              <div class="content">
                <h2>Xin chào ${fullName},</h2>
                <p>Tài khoản của bạn <strong>${statusText}</strong> bởi quản trị viên hệ thống.</p>
                
                <div class="status-badge">
                  Trạng thái: ${status === 'active' ? 'Đang hoạt động' : 
                               status === 'inactive' ? 'Không hoạt động' : 
                               'Đã khóa'}
                </div>
                
                ${status !== 'active' ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <strong>⚠️ Lưu ý:</strong>
                  <p>Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ với quản trị viên qua email: ${process.env.EMAIL_USER}</p>
                </div>
                ` : ''}
                
                <p>Trân trọng,<br>Đội ngũ English Learning System</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} English Learning System</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Account status email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending account status email:', error);
      return { success: false, error: error.message };
    }
  }

  // Kiểm tra kết nối email
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }
  async sendPasswordResetOTP(email, fullName, otp) {
  try {
    const mailOptions = {
      from: `"English Learning System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Mã OTP đặt lại mật khẩu - English Learning System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Đặt lại mật khẩu</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9fafb;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px;
              border-radius: 12px 12px 0 0;
              text-align: center;
              color: white;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              background: white;
              padding: 40px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .otp-box {
              background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
              color: #333;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 5px;
              margin: 20px 0;
              border: 2px dashed #e74c3c;
              font-family: monospace;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #3498db;
              padding: 15px;
              margin: 20px 0;
            }
            .steps {
              margin: 25px 0;
            }
            .step {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .step-number {
              background: #3498db;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              border-radius: 5px;
              margin: 15px 0;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 English Learning</div>
              <p>Hệ thống học tiếng Anh thông minh</p>
            </div>
            
            <div class="content">
              <h2>Xin chào ${fullName},</h2>
              
              <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              
              <p>Sử dụng mã OTP bên dưới để xác thực:</p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <div class="warning">
                <strong>⏰ Lưu ý quan trọng:</strong>
                <p>Mã OTP này chỉ có hiệu lực trong <strong>15 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
              </div>
              
              <div class="steps">
                <h3>Hướng dẫn sử dụng:</h3>
                
                <div class="step">
                  <div class="step-number">1</div>
                  <div>
                    <strong>Nhập mã OTP vào trang xác thực</strong><br>
                    Mã: <strong>${otp}</strong>
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-number">2</div>
                  <div>
                    <strong>Tạo mật khẩu mới</strong><br>
                    Sau khi xác thực, bạn sẽ được chuyển đến trang đặt mật khẩu mới
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-number">3</div>
                  <div>
                    <strong>Đăng nhập lại</strong><br>
                    Sử dụng mật khẩu mới để đăng nhập vào hệ thống
                  </div>
                </div>
              </div>
              
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              
              <div class="footer">
                <p>📧 Email hỗ trợ: ${process.env.EMAIL_USER}</p>
                <p>© ${new Date().getFullYear()} English Learning System. Mọi quyền được bảo lưu.</p>
                <p style="font-size: 12px; color: #999;">
                  Đây là email tự động, vui lòng không trả lời email này.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    return { success: false, error: error.message };
  }
}

// Gửi email xác nhận đã đổi mật khẩu
async sendPasswordChangedConfirmation(email, fullName) {
  try {
    const mailOptions = {
      from: `"English Learning System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Mật khẩu đã được thay đổi - English Learning System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mật khẩu đã thay đổi</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f9fafb;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
              padding: 30px;
              border-radius: 12px 12px 0 0;
              text-align: center;
              color: white;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              background: white;
              padding: 40px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .success-box {
              background: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
            }
            .info-box {
              background: #f8f9fa;
              border-left: 4px solid #3498db;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✅ English Learning</div>
              <p>Hệ thống học tiếng Anh thông minh</p>
            </div>
            
            <div class="content">
              <h2>Xin chào ${fullName},</h2>
              
              <div class="success-box">
                <h3 style="margin: 0;">🎉 Mật khẩu của bạn đã được thay đổi thành công!</h3>
              </div>
              
              <p>Chúng tôi xác nhận rằng mật khẩu cho tài khoản của bạn đã được thay đổi thành công.</p>
              
              <div class="info-box">
                <strong>📋 Thông tin chi tiết:</strong>
                <ul style="margin-top: 10px;">
                  <li>Thời gian thay đổi: ${new Date().toLocaleString('vi-VN')}</li>
                  <li>Email tài khoản: ${email}</li>
                  <li>IP thay đổi: [Tự động ghi nhận]</li>
                </ul>
              </div>
              
              <div class="warning" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>⚠️ Lưu ý bảo mật:</strong>
                <ul style="margin-top: 10px;">
                  <li>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi</li>
                  <li>Đảm bảo mật khẩu của bạn đủ mạnh và không chia sẻ với người khác</li>
                  <li>Kích hoạt xác thực 2 lớp nếu có để tăng cường bảo mật</li>
                </ul>
              </div>
              
              <p>Trân trọng,<br>Đội ngũ hỗ trợ English Learning System</p>
              
              <div class="footer">
                <p>📧 Email hỗ trợ: ${process.env.EMAIL_USER}</p>
                <p>© ${new Date().getFullYear()} English Learning System. Mọi quyền được bảo lưu.</p>
                <p style="font-size: 12px; color: #999;">
                  Đây là email tự động, vui lòng không trả lời email này.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log('Password changed confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password changed confirmation email:', error);
    return { success: false, error: error.message };
  }
}
}

module.exports = new EmailService();