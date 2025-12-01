// backend/src/controllers/platformController.js
const { supabase } = require("../utils/supabase");

class PlatformController {
  static async getPlatformStatistics(req, res) {
    try {
      console.log('Fetching platform statistics...');
      
      // Lấy tổng số người dùng
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Lấy tổng số topics
      const { count: totalTopics, error: topicsError } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true });

      // Lấy tổng số từ vựng
     const { count: totalWords, error: wordsError } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true });

      // Lấy tổng số quests (thay thế cho learning_sessions)
      const { count: totalQuests, error: questsError } = await supabase
        .from('quests')
        .select('*', { count: 'exact', head: true });

      // Kiểm tra lỗi
      const errors = [usersError, topicsError, wordsError, questsError].filter(error => error);
      if (errors.length > 0) {
        console.error('Errors fetching platform statistics:', errors);
        throw new Error('Error fetching platform statistics');
      }

      console.log('Platform statistics:', {
        totalUsers,
        totalTopics, 
        totalWords,
        totalQuests
      });

      res.json({
        success: true,
        totalUsers: totalUsers || 0,
        totalTopics: totalTopics || 0,
        totalWords: totalWords || 0,
        totalQuests: totalQuests || 0
      });

    } catch (error) {
      console.error('Get platform statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê nền tảng'
      });
    }
  }
}

module.exports = PlatformController;