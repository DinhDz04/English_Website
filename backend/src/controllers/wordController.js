const Word = require("../models/Word");
const Topic = require("../models/Topic");

// Get all words by topic
exports.getWordsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { page, limit, search, difficulty } = req.query;

    const result = await Word.findByTopic(topicId, {
      page,
      limit,
      search,
      difficulty,
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách từ vựng" });
  }
};

// Get word by ID
exports.getWordById = async (req, res) => {
  try {
    const { id } = req.params;
    const word = await Word.findById(id);
    res.json({ word });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi lấy thông tin từ vựng" });
  }
};

// Create new word
exports.createWord = async (req, res) => {
  try {
    const {
      word,
      pronunciation,
      meaning,
      example,
      topic_id,
      difficulty,
      audio_url,
    } = req.body;

    if (!word || !meaning || !topic_id) {
      return res.status(400).json({
        message: "Từ, nghĩa và topic không được để trống",
      });
    }

    // KIỂM TRA TỪ ĐÃ TỒN TẠI TRONG TOÀN BỘ DATABASE CHƯA
    const wordExists = await Word.checkWordExists(word);
    if (wordExists) {
      return res.status(400).json({
        message: `Từ "${word}" đã tồn tại trong hệ thống`,
      });
    }

    const wordData = {
      word: word.trim(),
      pronunciation: pronunciation?.trim(),
      meaning: meaning.trim(),
      example: example?.trim(),
      topic_id,
      difficulty: difficulty || "easy",
      audio_url,
    };

    const newWord = await Word.create(wordData);

    // Update topic word count
    await Topic.updateWordCount(topic_id);

    res.status(201).json({ word: newWord, message: "Tạo từ vựng thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi tạo từ vựng" });
  }
};

// Update word
exports.updateWord = async (req, res) => {
  try {
    const { id } = req.params;
    const { word } = req.body;

    // KIỂM TRA TỪ ĐÃ TỒN TẠI TRONG TOÀN BỘ DATABASE CHƯA (trừ từ hiện tại)
    if (word) {
      const wordExists = await Word.checkWordExists(word, id);
      if (wordExists) {
        return res.status(400).json({
          message: `Từ "${word}" đã tồn tại trong hệ thống`,
        });
      }
    }

    const updatedWord = await Word.update(id, req.body);
    res.json({ word: updatedWord, message: "Cập nhật từ vựng thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi cập nhật từ vựng" });
  }
};

// Delete word
exports.deleteWord = async (req, res) => {
  try {
    const { id } = req.params;

    // Get topic_id before deleting
    const topicId = await Word.getTopicId(id);
    await Word.delete(id);

    // Update topic word count
    if (topicId) {
      await Topic.updateWordCount(topicId);
    }

    res.json({ message: "Xóa từ vựng thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa từ vựng" });
  }
};

// Bulk delete words
exports.bulkDeleteWords = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Danh sách ID không hợp lệ" });
    }

    // Get topic_ids before deleting
    const topicIds = await Word.getTopicIds(ids);
    await Word.bulkDelete(ids);

    // Update word counts for affected topics
    for (const topicId of topicIds) {
      await Topic.updateWordCount(topicId);
    }

    res.json({ message: `Đã xóa ${ids.length} từ vựng thành công` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xóa từ vựng" });
  }
};

// Import words from array
exports.importWords = async (req, res) => {
  try {
    const { topic_id, words } = req.body;

    if (!topic_id || !words || !Array.isArray(words)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    // KIỂM TRA TỪ TRÙNG TRONG TOÀN BỘ DATABASE
    const allExistingWords = await Word.findAllWords();
    const existingWordSet = new Set(allExistingWords.map(w => w.word.toLowerCase()));

    // Validate and prepare data
    const validWords = [];
    const duplicateWords = [];
    const skippedWords = [];

    for (const w of words) {
      if (!w.word || !w.meaning) {
        skippedWords.push(w.word || 'Unknown');
        continue;
      }

      const wordLower = w.word.trim().toLowerCase();
      if (existingWordSet.has(wordLower)) {
        duplicateWords.push(w.word);
        continue;
      }

      validWords.push({
        topic_id,
        word: w.word.trim(),
        pronunciation: w.pronunciation?.trim() || null,
        meaning: w.meaning.trim(),
        example: w.example?.trim() || null,
        difficulty: w.difficulty?.trim() || "easy",
        audio_url: w.audio_url || null,
      });

      existingWordSet.add(wordLower);
    }

    if (validWords.length === 0) {
      return res.status(400).json({
        message: "Không có từ vựng hợp lệ để import",
        duplicates: duplicateWords,
        skipped: skippedWords,
      });
    }

    const imported = await Word.bulkCreate(validWords);

    // Update topic word count
    await Topic.updateWordCount(topic_id);

    res.json({
      message: `Import thành công ${imported.length} từ vựng`,
      imported: imported.length,
      duplicates: duplicateWords.length,
      skipped: skippedWords.length,
      duplicateWords: duplicateWords,
      skippedWords: skippedWords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi import từ vựng" });
  }
};

// Export words to JSON format
exports.exportWords = async (req, res) => {
  try {
    const { topicId } = req.params;
    const words = await Word.exportByTopic(topicId);

    res.json({
      words,
      message: "Xuất dữ liệu thành công",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi xuất từ vựng" });
  }
};

// Get all words (for exercise generation)
// Get all words (for exercise generation)
exports.getAllWords = async (req, res) => {
  try {
    const { page, limit, search, difficulty } = req.query;

    // Sử dụng method mới trong Word model để lấy tất cả từ
    const result = await Word.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 2000, // TĂNG LIMIT LÊN ĐỂ LẤY NHIỀU TỪ HƠN
      search: search || '',
      difficulty: difficulty || ''
    });

    
    
    res.json(result);
  } catch (err) {
    console.error('Error fetching all words:', err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách từ vựng" });
  }
};