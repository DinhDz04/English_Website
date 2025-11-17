const Topic = require("../models/Topic");
const fs = require("fs");
const path = require("path");

// Get all topics
exports.getAllTopics = async (req, res) => {
  try {
    const { level_id, difficulty } = req.query;
    const topics = await Topic.findAll({ level_id, difficulty });
    res.json({ topics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách topics" });
  }
};

// Get topic by ID
exports.getTopicById = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findById(id);
    const wordCount = await Topic.countWords(id);
    
    res.json({ topic: { ...topic, total_words: wordCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin topic" });
  }
};

// Create new topic
exports.createTopic = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      level_id,
      difficulty,
      required_level,
      sort_order,
      estimated_minutes,
    } = req.body;

    if (!name || !level_id) {
      // Xóa file nếu có lỗi
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: "Tên và level không được để trống" 
      });
    }

     const image_url = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;
    const topicData = {
      name,
      description,
      icon,
      level_id,
      difficulty: difficulty || "beginner",
      required_level: required_level || 1,
      sort_order,
      estimated_minutes,
      image_url,
    };

    const topic = await Topic.create(topicData);
    res.status(201).json({ topic, message: "Tạo topic thành công" });
  } catch (err) {
    // Xóa file nếu có lỗi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo topic" });
  }
};

// Update topic
exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lấy topic cũ để xóa ảnh cũ nếu có
    const oldTopic = await Topic.findById(id);
    
    const updateData = { ...req.body };
    
    // Nếu có file mới, thêm image_url vào updateData
    if (req.file) {
       updateData.image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      
      // Xóa ảnh cũ nếu tồn tại
       if (oldTopic && oldTopic.image_url) {
        const oldFilename = oldTopic.image_url.split('/').pop();
        const oldImagePath = path.join(__dirname, '../uploads', oldFilename);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const topic = await Topic.update(id, updateData);
    res.json({ topic, message: "Cập nhật topic thành công" });
  } catch (err) {
    // Xóa file mới nếu có lỗi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật topic" });
  }
};

// Delete topic
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    await Topic.delete(id);
    res.json({ message: "Xóa topic thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa topic" });
  }
};

// Get topic statistics
exports.getTopicStats = async (req, res) => {
  try {
    const { id } = req.params;
    const wordCount = await Topic.updateWordCount(id);
    
    res.json({
      stats: {
        total_words: wordCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thống kê" });
  }
};