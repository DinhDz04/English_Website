const { supabase } = require("../utils/supabase");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const EmailService = require("../utils/emailService");

class AdminUserController {
  // Get all users with pagination and filters
  static async getAllUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status = ""
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query - MẶC ĐỊNH CHỈ LẤY USER THƯỜNG
    let query = supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        role,
        level,
        experience,
        points,
        coins,
        gems,
        avatar_url,
        created_at,
        last_login,
        last_active_date,
        is_premium,
        premium_until,
        status,
        streak_data
      `, { count: 'exact' })
      .eq("role", "user"); // CHỈ LẤY ROLE = 'user'

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination and sorting
    const { data: users, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng'
    });
  }
}

  // Get user details by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const { data: user, error } = await supabase
        .from("users")
        .select(`
          *,
          learning_sessions:learning_sessions(count),
          user_word_progress(user_word_progress(count)),
          user_quests(user_quests(count))
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin người dùng'
      });
    }
  }

  // Update user information
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        full_name,
        role,
        level,
        experience,
        points,
        coins,
        gems,
        is_premium,
        premium_until,
        status
      } = req.body;

      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", id)
        .single();

      if (fetchError || !existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (full_name) updateData.full_name = full_name;
      if (role) updateData.role = role;
      if (level !== undefined) updateData.level = level;
      if (experience !== undefined) updateData.experience = experience;
      if (points !== undefined) updateData.points = points;
      if (coins !== undefined) updateData.coins = coins;
      if (gems !== undefined) updateData.gems = gems;
      if (is_premium !== undefined) updateData.is_premium = is_premium;
      if (premium_until !== undefined) updateData.premium_until = premium_until;
      if (status !== undefined) updateData.status = status;

      // Update user
      const { data: user, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Cập nhật thông tin người dùng thành công',
        user
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin người dùng'
      });
    }
  }

  // Deactivate/Activate user
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;

      // Get current status
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("status")
        .eq("id", id)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Toggle status
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      const { error: updateError } = await supabase
        .from("users")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: `Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`,
        status: newStatus
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thay đổi trạng thái người dùng'
      });
    }
  }

  // Reset password and send email
   static async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { sendEmail = true } = req.body;

      // Get user info
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", id)
        .single();

      if (fetchError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Generate new random password
      const newPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from("users")
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (updateError) throw updateError;

      let emailSent = false;
      let emailResult = null;

      // Send email if requested
      if (sendEmail) {
        try {
          emailResult = await EmailService.sendPasswordReset(
            user.email,
            user.full_name,
            newPassword
          );
          
          if (emailResult.success) {
            emailSent = true;
            console.log(`Password reset email sent to ${user.email}`);
          } else {
            console.error('Failed to send email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Send email error:', emailError);
          // Không throw error ở đây để vẫn trả về kết quả thành công
        }
      }

      res.json({
        success: true,
        message: `Đã đặt lại mật khẩu thành công${emailSent ? ' và đã gửi email' : ''}`,
        newPassword: sendEmail && !emailSent ? newPassword : undefined, // Chỉ trả về password nếu gửi email thất bại
        emailSent,
        emailError: emailResult?.error
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đặt lại mật khẩu'
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const { id } = req.params;

      // Get basic user info
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Get learning statistics
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from("learning_sessions")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", id);

      const { count: wordsLearned, error: wordsError } = await supabase
        .from("user_word_progress")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", id)
        .eq("is_learned", true);

      const { count: questsCompleted, error: questsError } = await supabase
        .from("user_quests")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", id)
        .eq("status", "completed");

      // Calculate activity rate
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: recentSessions, error: recentError } = await supabase
        .from("learning_sessions")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", id)
        .gte("completed_at", thirtyDaysAgo.toISOString());

      const stats = {
        basic: {
          level: user.level,
          experience: user.experience,
          points: user.points,
          coins: user.coins,
          gems: user.gems,
          is_premium: user.is_premium,
          premium_until: user.premium_until,
          created_at: user.created_at,
          last_login: user.last_login
        },
        learning: {
          total_sessions: sessionsCount || 0,
          words_learned: wordsLearned || 0,
          quests_completed: questsCompleted || 0,
          recent_activity: recentSessions || 0
        },
        streak: user.streak_data || {
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null
        }
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê người dùng'
      });
    }
  }
}

module.exports = AdminUserController;