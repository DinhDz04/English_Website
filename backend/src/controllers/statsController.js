const { supabase } = require("../utils/supabase");

// Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Total levels
    const { count: totalLevels } = await supabase
      .from("levels")
      .select("*", { count: "exact", head: true });

    // Total topics
    const { count: totalTopics } = await supabase
      .from("topics")
      .select("*", { count: "exact", head: true });

    // Total words
    const { count: totalWords } = await supabase
      .from("words")
      .select("*", { count: "exact", head: true });

    // Total shop items
    const { count: totalItems } = await supabase
      .from("shop_items")
      .select("*", { count: "exact", head: true });

    // Active users (registered in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalLevels: totalLevels || 0,
        totalTopics: totalTopics || 0,
        totalWords: totalWords || 0,
        totalItems: totalItems || 0,
        activeUsers: activeUsers || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thống kê dashboard" });
  }
};

// User growth chart data
exports.getUserGrowth = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const { data, error } = await supabase
      .from("users")
      .select("created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Group by date
    const growthData = {};
    data.forEach((user) => {
      const date = new Date(user.created_at).toISOString().split("T")[0];
      growthData[date] = (growthData[date] || 0) + 1;
    });

    const chartData = Object.entries(growthData).map(([date, count]) => ({
      date,
      count,
    }));

    res.json({ growth: chartData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy dữ liệu tăng trưởng" });
  }
};

// Topics distribution by level
exports.getTopicsDistribution = async (req, res) => {
  try {
    const { data: levels, error } = await supabase
      .from("levels")
      .select("id, level_number, name")
      .order("level_number", { ascending: true });

    if (error) throw error;

    const distribution = await Promise.all(
      levels.map(async (level) => {
        const { count } = await supabase
          .from("topics")
          .select("*", { count: "exact", head: true })
          .eq("level_id", level.id);

        return {
          level_number: level.level_number,
          level_name: level.name,
          topic_count: count || 0,
        };
      })
    );

    res.json({ distribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy phân bố topics" });
  }
};

// Words distribution by difficulty
exports.getWordsDifficulty = async (req, res) => {
  try {
    const difficulties = ["easy", "medium", "hard"];
    
    const distribution = await Promise.all(
      difficulties.map(async (difficulty) => {
        const { count } = await supabase
          .from("words")
          .select("*", { count: "exact", head: true })
          .eq("difficulty", difficulty);

        return {
          difficulty,
          count: count || 0,
        };
      })
    );

    res.json({ distribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy phân bố độ khó" });
  }
};

// Recent activities
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent users
    const { data: recentUsers, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (usersError) throw usersError;

    // Get recent topics
    const { data: recentTopics, error: topicsError } = await supabase
      .from("topics")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (topicsError) throw topicsError;

    // Get recent words
    const { data: recentWords, error: wordsError } = await supabase
      .from("words")
      .select("id, word, meaning, created_at")
      .order("created_at", { ascending: false })
      .limit(parseInt(limit));

    if (wordsError) throw wordsError;

    res.json({
      recentUsers,
      recentTopics,
      recentWords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy hoạt động gần đây" });
  }
};