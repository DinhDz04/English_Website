const Level = require("../models/Level");

// Get all levels
exports.getAllLevels = async (req, res) => {
  try {
    const levels = await Level.findAll();
    
    // Get topics count for each level
    const levelsWithStats = await Promise.all(
      levels.map(async (level) => {
        const topicCount = await Level.countTopics(level.id);
        return { ...level, total_topics: topicCount };
      })
    );

    res.json({ levels: levelsWithStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách levels" });
  }
};

// Get level by ID with topics and prerequisites
exports.getLevelById = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await Level.findByIdWithTopics(id);
    const prerequisites = await Level.getPrerequisites(id);

    res.json({
      level: {
        ...level,
        prerequisites,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin level" });
  }
};

// Create new level
exports.createLevel = async (req, res) => {
  try {
    const {
      level_number,
      name,
      description,
      color_start,
      color_end,
      required_points,
      sort_order,
    } = req.body;

    if (!level_number || !name) {
      return res.status(400).json({
        message: "Level number và tên không được để trống",
      });
    }

    const levelData = {
      level_number,
      name,
      description,
      color_start,
      color_end,
      required_points: required_points || 0,
      sort_order,
    };

    const level = await Level.create(levelData);
    res.status(201).json({ level, message: "Tạo level thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo level" });
  }
};

// Update level
exports.updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await Level.update(id, req.body);
    res.json({ level, message: "Cập nhật level thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật level" });
  }
};

// Delete level
exports.deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;
    await Level.delete(id);
    res.json({ message: "Xóa level thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa level" });
  }
};

// Create level prerequisite
exports.createPrerequisite = async (req, res) => {
  try {
    const { 
      level_id, 
      required_level_id, 
      required_topics_count, 
      required_points 
    } = req.body;

    if (!level_id || !required_level_id) {
      return res.status(400).json({
        message: "Level ID và Required Level ID không được để trống",
      });
    }

    const prerequisiteData = {
      level_id,
      required_level_id,
      required_topics_count: required_topics_count || 0,
      required_points: required_points || 0,
    };

    const prerequisite = await Level.createPrerequisite(prerequisiteData);
    res.status(201).json({
      prerequisite,
      message: "Tạo điều kiện mở khóa thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo điều kiện mở khóa" });
  }
};

// Delete prerequisite
exports.deletePrerequisite = async (req, res) => {
  try {
    const { id } = req.params;
    await Level.deletePrerequisite(id);
    res.json({ message: "Xóa điều kiện mở khóa thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa điều kiện mở khóa" });
  }
};