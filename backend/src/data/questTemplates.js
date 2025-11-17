// backend/src/data/questTemplates.js

const questTemplates = {
  // DAILY QUESTS
  daily: [
    {
      name: "Đăng nhập hàng ngày",
      description: "Đăng nhập vào ứng dụng để nhận điểm thưởng",
      type: "daily",
      category: "streak",
      condition_type: "daily_login",
      condition_value: 1,
      reward_points: 10,
      reward_coins: 5,
      is_recurring: true,
      difficulty: "easy",
      sort_order: 1
    },
    {
      name: "Học 5 từ mới",
      description: "Học 5 từ vựng mới trong ngày",
      type: "daily", 
      category: "learning",
      condition_type: "words_learned",
      condition_value: 5,
      reward_points: 25,
      reward_coins: 15,
      is_recurring: true,
      difficulty: "medium",
      sort_order: 2
    },
    {
      name: "Hoàn thành 1 bài tập",
      description: "Hoàn thành 1 bài tập bất kỳ",
      type: "daily",
      category: "practice", 
      condition_type: "exercises_completed",
      condition_value: 1,
      reward_points: 20,
      reward_coins: 10,
      is_recurring: true,
      difficulty: "easy",
      sort_order: 3
    }
  ],

  // LEVEL COMPLETION QUESTS
  level_completion: [
    {
      name: "Hoàn thành Level {name}",
      description: "Chinh phục toàn bộ Level {name}",
      type: "level",
      category: "completion",
      condition_type: "level_completed",
      condition_value: 1,
      reward_points: 100,
      reward_coins: 50,
      difficulty: "medium"
    }
  ],

  // TOPIC COMPLETION QUESTS  
  topic_completion: [
    {
      name: "Master {name}",
      description: "Hoàn thành chủ đề {name}",
      type: "topic",
      category: "completion", 
      condition_type: "topic_completed",
      condition_value: 1,
      reward_points: 50,
      reward_coins: 25,
      difficulty: "medium"
    }
  ],

  // VOCABULARY MILESTONE QUESTS
  vocabulary: [
    {
      name: "Từ vựng đầu tiên",
      description: "Học từ vựng đầu tiên của bạn",
      type: "vocabulary",
      category: "milestone",
      condition_type: "words_learned", 
      condition_value: 1,
      reward_points: 10,
      reward_coins: 5,
      difficulty: "easy"
    },
    {
      name: "10 Từ đã học",
      description: "Chúc mừng bạn đã học 10 từ",
      type: "vocabulary",
      category: "milestone",
      condition_type: "words_learned",
      condition_value: 10,
      reward_points: 30,
      reward_coins: 20,
      difficulty: "easy"
    },
    {
      name: "50 Từ thành thạo", 
      description: "Bạn đã thành thạo 50 từ vựng",
      type: "vocabulary",
      category: "milestone",
      condition_type: "words_mastered",
      condition_value: 50,
      reward_points: 100,
      reward_coins: 75,
      difficulty: "medium"
    },
    {
      name: "100 Từ vàng",
      description: "Chinh phục 100 từ vựng",
      type: "vocabulary",
      category: "milestone", 
      condition_type: "words_learned",
      condition_value: 100,
      reward_points: 200,
      reward_coins: 150,
      difficulty: "hard"
    },
    {
      name: "300 Từ bậc thầy",
      description: "Trở thành bậc thầy từ vựng với 300 từ",
      type: "vocabulary",
      category: "milestone",
      condition_type: "words_learned",
      condition_value: 300,
      reward_points: 500,
      reward_coins: 300,
      difficulty: "hard"
    }
  ],

  // STREAK QUESTS
  streak: [
    {
      name: "Chuỗi 3 ngày",
      description: "Duy trì đăng nhập 3 ngày liên tiếp",
      type: "streak", 
      category: "consistency",
      condition_type: "login_streak",
      condition_value: 3,
      reward_points: 50,
      reward_coins: 25,
      difficulty: "easy"
    },
    {
      name: "Tuần học tập",
      description: "7 ngày học liên tiếp",
      type: "streak",
      category: "consistency",
      condition_type: "learning_streak", 
      condition_value: 7,
      reward_points: 100,
      reward_coins: 75,
      difficulty: "medium"
    },
    {
      name: "Nửa tháng chăm chỉ",
      description: "15 ngày không ngừng học tập",
      type: "streak",
      category: "consistency",
      condition_type: "learning_streak",
      condition_value: 15,
      reward_points: 250, 
      reward_coins: 150,
      difficulty: "hard"
    },
    {
      name: "Tháng hoàn hảo",
      description: "30 ngày liên tục tiến bộ",
      type: "streak",
      category: "consistency",
      condition_type: "learning_streak",
      condition_value: 30,
      reward_points: 500,
      reward_coins: 300,
      difficulty: "hard"
    }
  ],

  // SPECIAL QUESTS
  special: [
    {
      name: "Buổi sáng năng động",
      description: "Học tập vào buổi sáng (6h-9h)",
      type: "special",
      category: "time_based",
      condition_type: "morning_learning",
      condition_value: 1,
      reward_points: 25,
      reward_coins: 15,
      difficulty: "medium"
    },
    {
      name: "Cuối tuần chăm chỉ",
      description: "Học tập vào cuối tuần",
      type: "special", 
      category: "time_based",
      condition_type: "weekend_learning",
      condition_value: 1,
      reward_points: 30,
      reward_coins: 20,
      difficulty: "medium"
    },
    {
      name: "Tốc độ",
      description: "Hoàn thành bài tập trong vòng 1 phút",
      type: "special",
      category: "speed",
      condition_type: "fast_completion",
      condition_value: 1,
      reward_points: 20,
      reward_coins: 10,
      difficulty: "hard"
    }
  ]
};

module.exports = questTemplates;