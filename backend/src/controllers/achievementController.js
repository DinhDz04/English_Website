const { Achievement, DailyChallenge } = require("../models/Achievement");

// ========== ACHIEVEMENTS ==========

// Get all achievements
exports.getAllAchievements = async (req, res) => {
  try {
    const { condition_type } = req.query;

    let achievements;
    if (condition_type) {
      achievements = await Achievement.findByType(condition_type);
    } else {
      achievements = await Achievement.findAll();
    }

    res.json({ achievements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách thành tích" });
  }
};

// Get achievement by ID
exports.getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;
    const achievement = await Achievement.findById(id);
    res.json({ achievement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin thành tích" });
  }
};

// Create achievement
exports.createAchievement = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      condition_type,
      condition_value,
      reward_points,
    } = req.body;

    if (!name || !condition_type || !condition_value) {
      return res.status(400).json({
        message: "Tên, loại điều kiện và giá trị điều kiện không được để trống",
      });
    }

    const achievementData = {
      name,
      description,
      icon,
      condition_type,
      condition_value,
      reward_points: reward_points || 0,
    };

    const achievement = await Achievement.create(achievementData);
    res.status(201).json({ achievement, message: "Tạo thành tích thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo thành tích" });
  }
};

// Update achievement
exports.updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const achievement = await Achievement.update(id, req.body);
    res.json({ achievement, message: "Cập nhật thành tích thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật thành tích" });
  }
};

// Delete achievement
exports.deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    await Achievement.delete(id);
    res.json({ message: "Xóa thành tích thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa thành tích" });
  }
};

// ========== DAILY CHALLENGES ==========

// Get all daily challenges
exports.getAllChallenges = async (req, res) => {
  try {
    const { limit } = req.query;
    const challenges = await DailyChallenge.findAll(limit ? parseInt(limit) : 30);
    res.json({ challenges });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách thử thách" });
  }
};

// Get today's challenge
exports.getTodayChallenge = async (req, res) => {
  try {
    const challenge = await DailyChallenge.getToday();
    res.json({ challenge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thử thách hôm nay" });
  }
};

// Get challenge by ID
exports.getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await DailyChallenge.findById(id);
    res.json({ challenge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin thử thách" });
  }
};

// Create daily challenge
exports.createChallenge = async (req, res) => {
  try {
    const { challenge_date, description, reward_points, target_words } = req.body;

    if (!challenge_date || !description || !reward_points || !target_words) {
      return res.status(400).json({
        message: "Tất cả các trường đều bắt buộc",
      });
    }

    const challengeData = {
      challenge_date,
      description,
      reward_points,
      target_words,
    };

    const challenge = await DailyChallenge.create(challengeData);
    res.status(201).json({ challenge, message: "Tạo thử thách thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo thử thách" });
  }
};

// Update daily challenge
exports.updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const challenge = await DailyChallenge.update(id, req.body);
    res.json({ challenge, message: "Cập nhật thử thách thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật thử thách" });
  }
};

// Delete daily challenge
exports.deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    await DailyChallenge.delete(id);
    res.json({ message: "Xóa thử thách thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa thử thách" });
  }
};