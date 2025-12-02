const { supabase } = require("../utils/supabase");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const EmailService = require("../utils/emailService");

class PasswordResetController {
  // Gửi OTP qua email để đặt lại mật khẩu
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email'
        });
      }

      // Kiểm tra email có tồn tại
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", email)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Email không tồn tại trong hệ thống'
        });
      }

      // Tạo OTP 6 số
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

      // Lưu OTP vào database
      const { error: otpError } = await supabase
        .from("password_resets")
        .insert({
          user_id: user.id,
          email: user.email,
          otp: otp,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (otpError) throw otpError;

      // Gửi OTP qua email
      const emailResult = await EmailService.sendPasswordResetOTP(
        user.email,
        user.full_name,
        otp
      );

      if (!emailResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Không thể gửi OTP qua email. Vui lòng thử lại sau.'
        });
      }

      res.json({
        success: true,
        message: 'Đã gửi mã OTP qua email. Vui lòng kiểm tra hộp thư.',
        expires_in: 15, // phút
        email: user.email // Trả về để frontend sử dụng
      });
    } catch (error) {
      console.error('Request password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi yêu cầu đặt lại mật khẩu'
      });
    }
  }

  // Xác thực OTP
  static async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email và mã OTP'
        });
      }

      // Tìm OTP hợp lệ
      const { data: resetRequest, error } = await supabase
        .from("password_resets")
        .select("*")
        .eq("email", email)
        .eq("otp", otp)
        .eq("status", 'pending')
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !resetRequest) {
        return res.status(400).json({
          success: false,
          message: 'Mã OTP không hợp lệ hoặc đã hết hạn'
        });
      }

      // Tạo reset token (dùng cho frontend)
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Cập nhật reset request với token
      const { error: updateError } = await supabase
        .from("password_resets")
        .update({
          reset_token: resetToken,
          token_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 phút
        })
        .eq("id", resetRequest.id);

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Xác thực OTP thành công',
        reset_token: resetToken,
        expires_in: 30 // phút
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác thực OTP'
      });
    }
  }

  // Đặt lại mật khẩu mới
  static async resetPassword(req, res) {
    try {
      const { reset_token, new_password } = req.body;

      if (!reset_token || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin cần thiết'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      // Tìm reset request hợp lệ
      const { data: resetRequest, error } = await supabase
        .from("password_resets")
        .select("*")
        .eq("reset_token", reset_token)
        .eq("status", 'pending')
        .gte("token_expires_at", new Date().toISOString())
        .single();

      if (error || !resetRequest) {
        return res.status(400).json({
          success: false,
          message: 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn'
        });
      }

      // Hash mật khẩu mới
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Cập nhật mật khẩu cho user
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq("id", resetRequest.user_id);

      if (updateError) throw updateError;

      // Đánh dấu reset request đã hoàn thành
      await supabase
        .from("password_resets")
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq("id", resetRequest.id);

      // Gửi email thông báo đã đổi mật khẩu
      const { data: user } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", resetRequest.user_id)
        .single();

      if (user) {
        await EmailService.sendPasswordChangedConfirmation(
          user.email,
          user.full_name
        );
      }

      res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đặt lại mật khẩu'
      });
    }
  }

  // Kiểm tra trạng thái reset request (dùng cho frontend)
  static async checkResetStatus(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu email'
        });
      }

      const { data: resetRequest, error } = await supabase
        .from("password_resets")
        .select("created_at, expires_at, status")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return res.json({
          success: true,
          has_pending_request: false
        });
      }

      const now = new Date();
      const expiresAt = new Date(resetRequest.expires_at);
      const isExpired = now > expiresAt;
      const timeLeft = isExpired ? 0 : Math.ceil((expiresAt - now) / (1000 * 60)); // phút

      res.json({
        success: true,
        has_pending_request: resetRequest.status === 'pending' && !isExpired,
        status: resetRequest.status,
        is_expired: isExpired,
        time_left: timeLeft,
        can_resend: isExpired || resetRequest.status === 'completed'
      });
    } catch (error) {
      console.error('Check reset status error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi kiểm tra trạng thái'
      });
    }
  }

  // Gửi lại OTP
  static async resendOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email'
        });
      }

      // Kiểm tra user tồn tại
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name")
        .eq("email", email)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Email không tồn tại'
        });
      }

      // Hủy các OTP cũ
      await supabase
        .from("password_resets")
        .update({ status: 'expired' })
        .eq("email", email)
        .eq("status", 'pending');

      // Gọi lại hàm request password reset
      return this.requestPasswordReset(req, res);
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi lại OTP'
      });
    }
  }
}

module.exports = PasswordResetController;