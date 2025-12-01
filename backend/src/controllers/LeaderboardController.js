// backend/src/controllers/LeaderboardController.js
const { supabase } = require("../utils/supabase");

class LeaderboardController {
  
  // ==================== LẤY BẢNG XẾP HẠNG ====================
  static async getLeaderboard(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 50, timeframe = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // Xác định timeframe
      let timeFilter = {};
      if (timeframe === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        timeFilter = { last_activity_date: { gte: oneWeekAgo.toISOString().split('T')[0] } };
      } else if (timeframe === 'monthly') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        timeFilter = { last_activity_date: { gte: oneMonthAgo.toISOString().split('T')[0] } };
      }

      // Lấy tổng số user
      let countQuery = supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin')
        .gt('experience', 0);

      // Áp dụng filter thời gian nếu có
      if (timeFilter.last_activity_date) {
        countQuery = countQuery.gte('last_activity_date', timeFilter.last_activity_date.gte);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      // Lấy danh sách user với xếp hạng
      let leaderboardQuery = supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          experience,
          level,
          streak_data,
          last_activity_date,
          created_at
        `)
        .neq('role', 'admin')
        .gt('experience', 0)
        .order('experience', { ascending: false })
        .range(offset, offset + limit - 1);

      // Áp dụng filter thời gian nếu có
      if (timeFilter.last_activity_date) {
        leaderboardQuery = leaderboardQuery.gte('last_activity_date', timeFilter.last_activity_date.gte);
      }

      const { data: users, error } = await leaderboardQuery;

      if (error) throw error;

      // Tính toán xếp hạng và thông tin
      const leaderboard = users.map((user, index) => ({
        rank: offset + index + 1,
        user_id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        experience: user.experience || 0,
        level: user.level || 1,
        current_streak: user.streak_data?.current_streak || 0,
        last_activity_date: user.last_activity_date,
        is_current_user: user.id === userId
      }));

      // Lấy vị trí của current user
      let userRank = 0;
      let userData = null;

      if (userId) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('experience')
          .eq('id', userId)
          .single();

        if (currentUser) {
          // Đếm số user có experience cao hơn
          let rankQuery = supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .neq('role', 'admin')
            .gt('experience', currentUser.experience || 0);

          if (timeFilter.last_activity_date) {
            rankQuery = rankQuery.gte('last_activity_date', timeFilter.last_activity_date.gte);
          }

          const { count: higherCount } = await rankQuery;
          userRank = (higherCount || 0) + 1;

          // Lấy thông tin đầy đủ của current user
          const { data: userFullData } = await supabase
            .from('users')
            .select(`
              id,
              full_name,
              email,
              avatar_url,
              experience,
              level,
              streak_data,
              last_activity_date
            `)
            .eq('id', userId)
            .single();

          userData = userFullData ? {
            rank: userRank,
            user_id: userFullData.id,
            full_name: userFullData.full_name,
            email: userFullData.email,
            avatar_url: userFullData.avatar_url,
            experience: userFullData.experience || 0,
            level: userFullData.level || 1,
            current_streak: userFullData.streak_data?.current_streak || 0,
            last_activity_date: userFullData.last_activity_date,
            is_current_user: true
          } : null;
        }
      }

      res.json({
        leaderboard,
        current_user: userData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        },
        timeframe
      });

    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== LẤY THỐNG KÊ TOP USER ====================
  static async getLeaderboardStats(req, res) {
    try {
      // Top 3 users
      const { data: topUsers } = await supabase
        .from('users')
        .select('full_name, avatar_url, experience, level')
        .neq('role', 'admin')
        .gt('experience', 0)
        .order('experience', { ascending: false })
        .limit(3);

      // Total users count
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin')
        .gt('experience', 0);

      // Average experience
      const { data: avgExp } = await supabase
        .from('users')
        .select('experience')
        .neq('role', 'admin')
        .gt('experience', 0);

      const averageExperience = avgExp && avgExp.length > 0 
        ? Math.round(avgExp.reduce((sum, user) => sum + (user.experience || 0), 0) / avgExp.length)
        : 0;

      res.json({
        top_users: topUsers || [],
        stats: {
          total_users: totalUsers || 0,
          average_experience: averageExperience,
          top_experience: topUsers && topUsers[0] ? topUsers[0].experience : 0
        }
      });

    } catch (error) {
      console.error('Error getting leaderboard stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = LeaderboardController;