// backend/src/services/AutoQuestService.js
const { supabase } = require("../utils/supabase");

class AutoQuestService {
  // Cấu hình giá trị mỗi từ vựng
  static getWordValues() {
    return {
      pointsPerWord: 2,    // 2 kinh nghiệm mỗi từ
      coinsPerWord: 1      // 1 vàng mỗi từ
    };
  }

  // Tạo nhiệm vụ dựa trên dữ liệu hệ thống
  static async generateAutoQuests() {
    try {
      const quests = [];
      
      // Lấy dữ liệu hệ thống với cấu trúc đầy đủ
      const levels = await AutoQuestService.getLevelsWithTopicsData();
      const words = await AutoQuestService.getWordsData();
      
      console.log('📊 Debug Data:');
      console.log('- Total words:', words.length);
      console.log('- Levels with topics:', JSON.stringify(levels.map(l => ({
        level: l.level_number,
        name: l.name,
        topics: l.topics.map(t => ({ name: t.name, word_count: t.total_words }))
      })), null, 2));
      
      // Tạo nhiệm vụ theo từng loại
      quests.push(...await AutoQuestService.generateLevelQuests(levels));
      quests.push(...await AutoQuestService.generateTopicQuests(levels));
      quests.push(...await AutoQuestService.generateVocabularyQuests(words));
      quests.push(...await AutoQuestService.generateStreakQuests());
      
      return quests;
    } catch (error) {
      console.error('Error generating auto quests:', error);
      throw error;
    }
  }

  // Tạo nhiệm vụ level - TÍNH TỔNG CÁC TOPICS TRONG LEVEL
  static async generateLevelQuests(levels) {
    const quests = [];
    const wordValues = AutoQuestService.getWordValues();
    
    for (const level of levels) {
      // Tính tổng từ vựng của tất cả topics trong level
      let totalWordsInLevel = 0;
      level.topics.forEach(topic => {
        totalWordsInLevel += topic.total_words || 0;
      });

      console.log(`🔢 Level ${level.level_number} (${level.name}): ${totalWordsInLevel} words total`);

      // Tính phần thưởng dựa trên tổng từ vựng
      const reward = {
        points: totalWordsInLevel * wordValues.pointsPerWord,
        coins: totalWordsInLevel * wordValues.coinsPerWord
      };
      
      quests.push({
        name: `Chinh phục Level ${level.level_number}: ${level.name}`,
        description: `Hoàn thành tất cả ${level.topics.length} topics trong Level ${level.level_number}`,
        type: 'level',
        category: 'completion',
        condition_type: 'level_completed',
        condition_value: level.level_number,
        reward_points: reward.points,
        reward_coins: reward.coins,
        difficulty: AutoQuestService.getLevelDifficulty(level.level_number),
        is_auto_generated: true,
        is_recurring: false,
        is_active: true,
        sort_order: level.level_number * 10
      });
    }
    
    return quests;
  }

  // Tạo nhiệm vụ topic - TÍNH THEO SỐ TỪ VỰNG TRONG TOPIC
  static async generateTopicQuests(levels) {
    const quests = [];
    const wordValues = AutoQuestService.getWordValues();
    let topicCounter = 1;
    
    for (const level of levels) {
      for (const topic of level.topics) {
        const wordCount = topic.total_words || 0;
        
        console.log(`📚 Topic "${topic.name}": ${wordCount} words`);

        // Tính phần thưởng dựa trên số từ vựng trong topic
        const reward = {
          points: wordCount * wordValues.pointsPerWord,
          coins: wordCount * wordValues.coinsPerWord
        };
        
        quests.push({
          name: `Hoàn thành Topic: ${topic.name}`,
          description: `Học tất cả ${wordCount} từ vựng trong topic ${topic.name}`,
          type: 'topic',
          category: 'completion',
          condition_type: 'topic_completed',
          condition_value: topicCounter,
          reward_points: reward.points,
          reward_coins: reward.coins,
          difficulty: topic.difficulty,
          is_auto_generated: true,
          is_recurring: false,
          is_active: true,
          sort_order: 100 + topicCounter
        });
        
        topicCounter++;
      }
    }
    
    return quests;
  }

  // Tạo nhiệm vụ từ vựng (tích lũy)
  static async generateVocabularyQuests(words) {
    const quests = [];
    const totalWords = words.length;
    const wordValues = AutoQuestService.getWordValues();
    
    console.log(`📈 Total words in system: ${totalWords}`);
    
    // Tạo các mốc: 50, 100, 150, ... cho đến tổng số từ
    let milestone = 50;
    let questNumber = 1;
    
    while (milestone <= totalWords) {
      // Tính phần thưởng dựa trên số từ
      const reward = {
        points: milestone * wordValues.pointsPerWord,
        coins: milestone * wordValues.coinsPerWord
      };
      
      quests.push({
        name: `Tích lũy ${milestone} từ vựng`,
        description: `Học tổng cộng ${milestone} từ vựng`,
        type: 'vocabulary',
        category: 'accumulation',
        condition_type: 'words_learned',
        condition_value: milestone,
        reward_points: reward.points,
        reward_coins: reward.coins,
        difficulty: AutoQuestService.getVocabularyDifficulty(milestone),
        is_auto_generated: true,
        is_recurring: false,
        is_active: true,
        sort_order: 200 + questNumber * 10
      });
      
      milestone += 50;
      questNumber++;
    }
    
    return quests;
  }

  // Tạo nhiệm vụ chuỗi (tăng x2)
  static async generateStreakQuests() {
    const quests = [];
    let streakValue = 3;
    let questNumber = 1;
    const wordValues = AutoQuestService.getWordValues();
    
    // Tạo đến chuỗi 96 (3, 6, 12, 24, 48, 96)
    while (streakValue <= 96) {
      // Phần thưởng chuỗi dựa trên số ngày (giả sử mỗi ngày học 10 từ)
      const wordsPerDay = 10;
      const totalWords = streakValue * wordsPerDay;
      
      const reward = {
        points: totalWords * wordValues.pointsPerWord,
        coins: totalWords * wordValues.coinsPerWord
      };
      
      quests.push({
        name: `Chuỗi đăng nhập ${streakValue} ngày`,
        description: `Duy trì chuỗi đăng nhập ${streakValue} ngày liên tiếp`,
        type: 'streak',
        category: 'streak',
        condition_type: 'login_streak',
        condition_value: streakValue,
        reward_points: reward.points,
        reward_coins: reward.coins,
        difficulty: AutoQuestService.getStreakDifficulty(streakValue),
        is_auto_generated: true,
        is_recurring: false,
        is_active: true,
        sort_order: 300 + questNumber * 10
      });
      
      streakValue *= 2;
      questNumber++;
    }
    
    return quests;
  }

  // Helper: Lấy dữ liệu levels với topics đầy đủ - SỬA HOÀN TOÀN QUERY
  static async getLevelsWithTopicsData() {
    try {
      // CÁCH 1: Lấy tất cả words và nhóm theo topic
      const { data: allWords, error: wordsError } = await supabase
        .from('words')
        .select('topic_id');
      
      if (wordsError) {
        console.error('Error getting words for count:', wordsError);
        throw wordsError;
      }

      // Đếm số từ vựng theo topic
      const wordCountByTopic = {};
      allWords.forEach(word => {
        wordCountByTopic[word.topic_id] = (wordCountByTopic[word.topic_id] || 0) + 1;
      });

      console.log('📋 Word count by topic:', wordCountByTopic);

      // Lấy tất cả topics
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('sort_order');
      
      if (topicsError) {
        console.error('Error getting topics:', topicsError);
        throw topicsError;
      }

      // Lấy tất cả levels
      const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('*')
        .order('level_number');
      
      if (levelsError) {
        console.error('Error getting levels:', levelsError);
        throw levelsError;
      }

      // Gộp topics vào levels và thêm số từ vựng
      const levelsWithTopics = levels.map(level => ({
        ...level,
        topics: topics
          .filter(topic => topic.level_id === level.id)
          .map(topic => ({
            ...topic,
            total_words: wordCountByTopic[topic.id] || 0 // Số từ vựng thực tế
          }))
      }));

      console.log('✅ FINAL Processed levels with topics:', JSON.stringify(levelsWithTopics.map(l => ({
        level: l.level_number,
        name: l.name,
        topics: l.topics.map(t => ({ name: t.name, word_count: t.total_words }))
      })), null, 2));

      return levelsWithTopics;

    } catch (error) {
      console.error('Error getting levels with topics data:', error);
      return [];
    }
  }

  static async getWordsData() {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*');
      
      if (error) {
        console.error('Error getting words:', error);
        throw error;
      }
      console.log(`✅ Retrieved ${data?.length || 0} words from database`);
      return data || [];
    } catch (error) {
      console.error('Error getting words data:', error);
      return [];
    }
  }

  // Xác định độ khó
  static getLevelDifficulty(levelNumber) {
    if (levelNumber <= 3) return 'easy';
    if (levelNumber <= 6) return 'medium';
    return 'hard';
  }

  static getVocabularyDifficulty(milestone) {
    if (milestone <= 100) return 'easy';
    if (milestone <= 200) return 'medium';
    return 'hard';
  }

  static getStreakDifficulty(streakValue) {
    if (streakValue <= 6) return 'easy';
    if (streakValue <= 24) return 'medium';
    return 'hard';
  }
}

module.exports = AutoQuestService;