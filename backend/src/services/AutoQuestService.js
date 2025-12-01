// backend/src/services/AutoQuestService.js - CHỈ 3 LOẠI REWARD
const { supabase } = require("../utils/supabase");

class AutoQuestService {
  // =============================================
  // CẤU HÌNH GIÁ TRỊ REWARD
  // =============================================
  
  static getRewardValues() {
    return {
      // Reward cơ bản mỗi từ vựng

      experiencePerWord: 10,    // 5 kinh nghiệm mỗi từ

      
      // Multiplier theo độ khó
      difficultyMultiplier: {
        easy: 1,
        medium: 1.5,
        hard: 2
      },
      
      // Bonus cho streak
      streakBonus: {
        experience: 40, // Bonus exp cho mỗi ngày streak
      }
    };
  }

  // =============================================
  // MAIN FUNCTION - TẠO TẤT CẢ QUESTS
  // =============================================
  
  static async generateAutoQuests() {
    try {
      const quests = [];
      
      console.log('🚀 Generating auto quests...');
      
      // Lấy dữ liệu hệ thống
      const levels = await AutoQuestService.getLevelsWithTopicsData();
      const words = await AutoQuestService.getWordsData();
      
      console.log('📊 System Data:');
      console.log(`- Total levels: ${levels.length}`);
      console.log(`- Total words: ${words.length}`);
      
      // Tạo nhiệm vụ theo từng loại
      quests.push(...await AutoQuestService.generateLevelQuests(levels));
      quests.push(...await AutoQuestService.generateTopicQuests(levels));
      quests.push(...await AutoQuestService.generateVocabularyQuests(words));
      quests.push(...await AutoQuestService.generateStreakQuests());
      quests.push(...await AutoQuestService.generateDailyQuests());
      
      console.log(`✅ Generated ${quests.length} quests total`);
      
      return quests;
    } catch (error) {
      console.error('❌ Error generating auto quests:', error);
      throw error;
    }
  }

  // =============================================
  // LEVEL QUESTS - Hoàn thành level
  // =============================================
  
  static async generateLevelQuests(levels) {
    const quests = [];
    const rewardValues = AutoQuestService.getRewardValues();
    
    for (const level of levels) {
      // Tính tổng từ vựng trong level
      let totalWords = 0;
      level.topics.forEach(topic => {
        totalWords += topic.total_words || 0;
      });

      if (totalWords === 0) continue;

      const difficulty = AutoQuestService.getLevelDifficulty(level.level_number);
      const multiplier = rewardValues.difficultyMultiplier[difficulty];

      // Tính reward
      const baseReward = {
        experience: Math.round(totalWords * rewardValues.experiencePerWord * multiplier),
      };

      console.log(`📗 Level ${level.level_number}: ${totalWords} words, ${difficulty}, ${baseReward.experience}⭐ `);

      quests.push({
        name: `Chinh phục Level ${level.level_number}: ${level.name}`,
        description: `Hoàn thành tất cả ${level.topics.length} topics trong Level ${level.level_number} với ${totalWords} từ vựng`,
        type: 'level',
        category: 'progress',
        condition_type: 'level_completed',
        condition_value: level.level_number,
        reward_experience: baseReward.experience,
        difficulty: difficulty,
        is_auto_generated: true,
        is_recurring: false,
        is_active: true,
        sort_order: level.level_number * 10
      });
    }
    
    console.log(`✅ Generated ${quests.length} level quests`);
    return quests;
  }

  // =============================================
  // TOPIC QUESTS - Hoàn thành topic
  // =============================================
  
  static async generateTopicQuests(levels) {
    const quests = [];
    const rewardValues = AutoQuestService.getRewardValues();
    let sortOrder = 100;
    
    for (const level of levels) {
      for (const topic of level.topics) {
        const wordCount = topic.total_words || 0;
        if (wordCount === 0) continue;

        // Sửa: difficulty của topic có thể là 'beginner', 'intermediate', 'advanced'
        // Map sang 'easy', 'medium', 'hard'
        const difficultyMap = {
          'beginner': 'easy',
          'intermediate': 'medium', 
          'advanced': 'hard',
          'easy': 'easy',
          'medium': 'medium',
          'hard': 'hard'
        };
        
        const difficulty = difficultyMap[topic.difficulty] || 'easy';
        const multiplier = rewardValues.difficultyMultiplier[difficulty];

        // Tính reward
        const baseReward = {   
          experience: Math.round(wordCount * rewardValues.experiencePerWord * multiplier),
        };

        console.log(`📘 Topic "${topic.name}": ${wordCount} words, ${topic.difficulty} → ${difficulty}, ${baseReward.experience}⭐ `);

        quests.push({
          name: `Hoàn thành Topic: ${topic.name}`,
          description: `Học tất cả ${wordCount} từ vựng trong topic ${topic.name}`,
          type: 'topic',
          category: 'learning',
          condition_type: 'topic_completed',
          condition_value: 1, // Giá trị cố định 1 (đã hoàn thành)
          topic_id: topic.id, // UUID lưu ở đây
          reward_experience: baseReward.experience,
          difficulty: difficulty,
          is_auto_generated: true,
          is_recurring: false,
          is_active: true,
          sort_order: sortOrder
        });
        
        sortOrder += 10;
      }
    }
    
    console.log(`✅ Generated ${quests.length} topic quests`);
    return quests;
  }

  // =============================================
  // VOCABULARY QUESTS - Tích lũy từ vựng
  // =============================================
  
  static async generateVocabularyQuests(words) {
    const quests = [];
    const totalWords = words.length;
    const rewardValues = AutoQuestService.getRewardValues();
    
    if (totalWords === 0) return quests;

    console.log(`📚 Total words in system: ${totalWords}`);
    
    // Tạo các mốc: 10, 25, 50, 100, 150, 200, ...
    const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500];
    let sortOrder = 200;
    
    for (const milestone of milestones) {
      if (milestone > totalWords) break;

      const difficulty = AutoQuestService.getVocabularyDifficulty(milestone);
      const multiplier = rewardValues.difficultyMultiplier[difficulty];

      // Tính reward
      const baseReward = {
        
        experience: Math.round(milestone * rewardValues.experiencePerWord * multiplier),
      
      };

      console.log(`📖 Vocabulary ${milestone} words: ${difficulty},  ${baseReward.experience}⭐ `);

      quests.push({
        name: `Tích lũy ${milestone} từ vựng`,
        description: `Học tổng cộng ${milestone} từ vựng trong toàn bộ khóa học`,
        type: 'vocabulary',
        category: 'learning',
        condition_type: 'words_learned',
        condition_value: milestone,
        reward_experience: baseReward.experience,
        difficulty: difficulty,
        is_auto_generated: true,
        is_recurring: false,
        is_active: true,
        sort_order: sortOrder
      });
      
      sortOrder += 10;
    }
    
    console.log(`✅ Generated ${quests.length} vocabulary quests`);
    return quests;
  }

  // =============================================
  // STREAK QUESTS - Chuỗi đăng nhập
  // =============================================
  
  static async generateStreakQuests() {
    const quests = [];
    const rewardValues = AutoQuestService.getRewardValues();
    
    // Các mốc streak: 3, 7, 14, 30, 60, 90 ngày
    const streakMilestones = [3, 7, 14, 30, 60, 90];
    let sortOrder = 300;
    
    for (const streakDays of streakMilestones) {
      const difficulty = AutoQuestService.getStreakDifficulty(streakDays);
      const multiplier = rewardValues.difficultyMultiplier[difficulty];

      // Tính reward cho streak (cao hơn vì khó hơn)
      const baseReward = {
        
        experience: Math.round((streakDays * rewardValues.streakBonus.experience) * multiplier),
        
      };

      console.log(`🔥 Streak ${streakDays} days: ${difficulty}, ${baseReward.experience}⭐ `);

      quests.push({
        name: `Chuỗi ${streakDays} ngày`,
        description: `Duy trì chuỗi đăng nhập và học tập ${streakDays} ngày liên tiếp`,
        type: 'streak',
        category: 'achievement',
        condition_type: 'login_streak',
        condition_value: streakDays,
        reward_experience: baseReward.experience,
        difficulty: difficulty,
        is_auto_generated: true,
        is_recurring: false,
        is_active: true,
        sort_order: sortOrder
      });
      
      sortOrder += 10;
    }
    
    console.log(`✅ Generated ${quests.length} streak quests`);
    return quests;
  }

  // =============================================
  // DAILY QUESTS - Nhiệm vụ hằng ngày
  // =============================================
  
  static async generateDailyQuests() {
    const quests = [];
    const rewardValues = AutoQuestService.getRewardValues();
    
    // Daily quest 1: Đăng nhập hằng ngày
    quests.push({
      name: 'Đăng nhập hằng ngày',
      description: 'Đăng nhập vào ứng dụng mỗi ngày',
      type: 'daily',
      category: 'general',
      condition_type: 'daily_login',
      condition_value: 1,
      reward_experience: 40,
      difficulty: 'easy',
      is_auto_generated: true,
      is_recurring: true,
      is_active: true,
      sort_order: 1
    });

    // Daily quest 2: Học 10 từ mới
    quests.push({
      name: 'Học 10 từ mới',
      description: 'Học 10 từ vựng mới trong ngày',
      type: 'daily',
      category: 'learning',
      condition_type: 'words_learned_today',
      condition_value: 10,
      reward_experience: 50,
      difficulty: 'easy',
      is_auto_generated: true,
      is_recurring: true,
      is_active: true,
      sort_order: 2
    });

    // Daily quest 3: Hoàn thành 1 session
    quests.push({
      name: 'Hoàn thành 1 bài học',
      description: 'Hoàn thành ít nhất 1 session học tập trong ngày',
      type: 'daily',
      category: 'learning',
      condition_type: 'sessions_completed_today',
      condition_value: 1,
      reward_experience: 40,
      difficulty: 'easy',
      is_auto_generated: true,
      is_recurring: true,
      is_active: true,
      sort_order: 3
    });
    
    console.log(`✅ Generated ${quests.length} daily quests`);
    return quests;
  }

  // =============================================
  // DATA FETCHING HELPERS
  // =============================================
  
  static async getLevelsWithTopicsData() {
    try {
      // Lấy tất cả words và đếm theo topic
      const { data: allWords, error: wordsError } = await supabase
        .from('words')
        .select('topic_id');
      
      if (wordsError) throw wordsError;

      // Đếm số từ vựng theo topic
      const wordCountByTopic = {};
      (allWords || []).forEach(word => {
        if (word.topic_id) {
          wordCountByTopic[word.topic_id] = (wordCountByTopic[word.topic_id] || 0) + 1;
        }
      });

      // Lấy tất cả topics
      const { data: topics, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('sort_order');
      
      if (topicsError) throw topicsError;

      // Lấy tất cả levels
      const { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('*')
        .order('level_number');
      
      if (levelsError) throw levelsError;

      // Gộp topics vào levels với số từ vựng thực tế
      const levelsWithTopics = (levels || []).map(level => ({
        ...level,
        topics: (topics || [])
          .filter(topic => topic.level_id === level.id)
          .map(topic => ({
            ...topic,
            total_words: wordCountByTopic[topic.id] || 0
          }))
      }));

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
        .select('id');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting words data:', error);
      return [];
    }
  }

  // =============================================
  // DIFFICULTY HELPERS
  // =============================================
  
  static getLevelDifficulty(levelNumber) {
    if (levelNumber <= 2) return 'easy';
    if (levelNumber <= 5) return 'medium';
    return 'hard';
  }

  static getVocabularyDifficulty(milestone) {
    if (milestone <= 50) return 'easy';
    if (milestone <= 200) return 'medium';
    return 'hard';
  }

  static getStreakDifficulty(streakDays) {
    if (streakDays <= 7) return 'easy';
    if (streakDays <= 30) return 'medium';
    return 'hard';
  }
}

module.exports = AutoQuestService;