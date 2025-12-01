// backend/src/services/AIService.js
require('dotenv').config();

class AIService {
  static exerciseCache = new Map();
  static pendingRequests = new Map();

  static async generateExercise(word, meaning, example, pronunciation, exerciseType = 'fill_blank', allWords = []) {
    // 🔧 FIX 1: Cache key phải bao gồm CẢ wordId và exerciseType
    const cacheKey = `${word}_${exerciseType}`;

    if (this.exerciseCache.has(cacheKey)) {
      console.log(`📚 Using cached exercise for: ${word} (${exerciseType})`);
      return this.exerciseCache.get(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const exercisePromise = this.createExercise(word, meaning, example, pronunciation, exerciseType, allWords);
    this.pendingRequests.set(cacheKey, exercisePromise);

    try {
      const result = await exercisePromise;
      this.exerciseCache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  static async createExercise(word, meaning, example, pronunciation, exerciseType, allWords = []) {
    console.log(`🎯 Creating ${exerciseType} exercise for: ${word}`);

    // 🔧 FIX 2: Xử lý ĐÚNG exerciseType, không chỉ synonym_antonym
    switch (exerciseType) {
      case 'fill_blank':
        return this.createFillBlankExercise(word, meaning, example, pronunciation);
      
      case 'multiple_choice':
        return this.createMultipleChoiceExercise(word, meaning, example, pronunciation, allWords);
      
      case 'sentence_construction':
        return this.createSentenceConstructionExercise(word, meaning, example, pronunciation);
      
      case 'pronunciation_check':
        return this.createPronunciationExercise(word, meaning, example, pronunciation, allWords);
      
      case 'synonym_antonym':
        // Chỉ loại này mới dùng AI
        return await this.callGroqAI(word, meaning, example, pronunciation, exerciseType);
      
      default:
        console.warn(`⚠️ Unknown exercise type: ${exerciseType}, defaulting to fill_blank`);
        return this.createFillBlankExercise(word, meaning, example, pronunciation);
    }
  }

  // ==================== FALLBACK EXERCISES ====================

  static createFillBlankExercise(word, meaning, example, pronunciation) {
    const questions = [
      `Từ này "${meaning}" trong tiếng Anh là: ______`,
      `Điền từ tiếng Anh có nghĩa là "${meaning}": ______`,
      `Từ tiếng Anh nào có nghĩa là "${meaning}"? ______`,
      `"${meaning}" trong tiếng Anh là: ______`
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    return {
      id: this.generateExerciseId(),
      question: randomQuestion,
      correct_answer: word,
      options: [],
      explanation: `"${word}" có nghĩa là "${meaning}"`,
      type: 'fill_blank',
      difficulty: 'medium',
      hint: `Từ này bắt đầu bằng chữ '${word[0].toUpperCase()}'`,
      word_data: {
        word: word,
        meaning: meaning,
        example: example,
        pronunciation: pronunciation
      }
    };
  }

  static createMultipleChoiceExercise(word, meaning, example, pronunciation, allWords = []) {
    // Lấy các từ ngẫu nhiên làm đáp án sai
    const distractors = this.getRandomDistractors(word, allWords, 3);
    const options = this.shuffleArray([word, ...distractors]);

    return {
      id: this.generateExerciseId(),
      question: `Từ tiếng Anh nào sau đây có nghĩa là "${meaning}"?`,
      correct_answer: word,
      options: options,
      explanation: `"${word}" có nghĩa là "${meaning}"`,
      type: 'multiple_choice',
      difficulty: 'medium',
      hint: `Nghĩa của từ là "${meaning}"`,
      word_data: {
        word: word,
        meaning: meaning,
        example: example,
        pronunciation: pronunciation
      }
    };
  }

  static createSentenceConstructionExercise(word, meaning, example, pronunciation) {
    // Nếu có ví dụ, dùng ví dụ. Nếu không, tạo câu đơn giản
    let sentence = example;
    if (!sentence || !sentence.includes(word)) {
      sentence = `This is an example with the word ${word}`;
    }

    // Loại bỏ dấu câu để dễ sắp xếp
    const cleanSentence = sentence.replace(/[.,!?;:]/g, '').trim();
    const words = cleanSentence.split(' ').filter(w => w.length > 0);

    return {
      id: this.generateExerciseId(),
      question: 'Sắp xếp các từ sau thành câu hoàn chỉnh:',
      correct_answer: cleanSentence,
      options: [],
      words: this.shuffleArray([...words]),
      explanation: `Câu hoàn chỉnh: "${cleanSentence}"`,
      type: 'sentence_construction',
      difficulty: 'medium',
      hint: `Câu nên chứa từ "${word}"`,
      word_data: {
        word: word,
        meaning: meaning,
        example: example,
        pronunciation: pronunciation
      }
    };
  }

  static createPronunciationExercise(word, meaning, example, pronunciation, allWords = []) {
    const distractors = this.getRandomDistractors(word, allWords, 3);
    const options = this.shuffleArray([word, ...distractors]);

    return {
      id: this.generateExerciseId(),
      question: `Chọn từ có nghĩa là "${meaning}"`,
      correct_answer: word,
      options: options,
      explanation: `"${word}" có nghĩa là "${meaning}"`,
      type: 'pronunciation_check',
      difficulty: 'medium',
      hint: `Từ này có nghĩa là "${meaning}"`,
      word_data: {
        word: word,
        meaning: meaning,
        example: example,
        pronunciation: pronunciation
      }
    };
  }

  // ==================== AI EXERCISE (ONLY FOR SYNONYM/ANTONYM) ====================

  static async callGroqAI(word, meaning, example, pronunciation, exerciseType) {
    console.log(`⚡ Calling Groq AI for synonym/antonym: ${word}`);

    const prompt = `Tạo bài tập TỪ ĐỒNG NGHĨA/TRÁI NGHĨA:
Từ: "${word}" - Nghĩa: "${meaning}" - Ví dụ: "${example}"

YÊU CẦU:
1. Tạo câu hỏi yêu cầu tìm từ đồng nghĩa hoặc trái nghĩa với "${word}"
2. 4 lựa chọn là các từ tiếng Anh
3. Chỉ có 1 đáp án đúng là từ đồng/trái nghĩa thực sự
4. Các lựa chọn còn lại là từ không liên quan
5. Giải thích rõ ràng mối quan hệ giữa các từ

JSON output (CHỈ JSON):
{
  "question": "Chọn từ đồng nghĩa/trái nghĩa với '${word}'",
  "correct_answer": "từ_đồng_trái_nghĩa",
  "options": ["từ_đồng_trái_nghĩa", "từ_sai_1", "từ_sai_2", "từ_sai_3"],
  "explanation": "Giải thích mối quan hệ giữa các từ",
  "type": "synonym_antonym",
  "difficulty": "hard"
}`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return this.createSynonymAntonymFallback(word, meaning);
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      console.log(`📄 Raw AI response: ${content}`);

      return this.parseAIResponse(content, word, meaning, example, pronunciation, exerciseType);

    } catch (error) {
      console.error('❌ AI call failed, using fallback:', error.message);
      return this.createSynonymAntonymFallback(word, meaning);
    }
  }

  static createSynonymAntonymFallback(word, meaning) {
    const commonSynonyms = {
      happy: ['joyful', 'glad', 'pleased'],
      sad: ['unhappy', 'sorrowful', 'depressed'],
      big: ['large', 'huge', 'enormous'],
      small: ['tiny', 'little', 'miniature'],
      beautiful: ['pretty', 'attractive', 'lovely'],
      intelligent: ['smart', 'clever', 'bright']
    };

    const commonAntonyms = {
      happy: ['sad', 'unhappy', 'miserable'],
      big: ['small', 'tiny', 'little'],
      beautiful: ['ugly', 'unattractive', 'plain'],
      intelligent: ['stupid', 'foolish', 'dumb']
    };

    const synonyms = commonSynonyms[word.toLowerCase()] || ['good', 'nice', 'fine'];
    const antonyms = commonAntonyms[word.toLowerCase()] || ['bad', 'poor', 'wrong'];

    const useSynonym = Math.random() > 0.5;
    const correctAnswer = useSynonym ? synonyms[0] : antonyms[0];
    const otherWords = useSynonym ? [...synonyms.slice(1), ...antonyms.slice(0,2)] : [...antonyms.slice(1), ...synonyms.slice(0,2)];

    const distractors = this.getRandomWords(otherWords, 3);
    const options = this.shuffleArray([correctAnswer, ...distractors]);

    return {
      id: this.generateExerciseId(),
      question: useSynonym ? `Chọn từ đồng nghĩa với "${word}"` : `Chọn từ trái nghĩa với "${word}"`,
      correct_answer: correctAnswer,
      options: options,
      explanation: useSynonym 
        ? `"${correctAnswer}" là từ đồng nghĩa với "${word}" (cùng nghĩa là "${meaning}")`
        : `"${correctAnswer}" là từ trái nghĩa với "${word}" (trái nghĩa với "${meaning}")`,
      type: 'synonym_antonym',
      difficulty: 'hard',
      hint: useSynonym ? `Tìm từ có nghĩa tương tự "${meaning}"` : `Tìm từ có nghĩa ngược với "${meaning}"`,
      word_data: {
        word: word,
        meaning: meaning,
        example: example,
        pronunciation: pronunciation
      }
    };
  }

  // ==================== HELPER METHODS ====================

  static getRandomDistractors(targetWord, allWords, count) {
    if (!allWords || allWords.length === 0) {
      const fallbackDistractors = {
        happy: ['sad', 'angry', 'tired'],
        beautiful: ['ugly', 'plain', 'ordinary'],
        intelligent: ['stupid', 'foolish', 'ignorant'],
        big: ['small', 'tiny', 'little']
      };
      return fallbackDistractors[targetWord.toLowerCase()] || ['different', 'other', 'another'];
    }

    const availableWords = allWords
      .filter(w => w.word !== targetWord)
      .map(w => w.word)
      .filter((word, index, array) => array.indexOf(word) === index);

    if (availableWords.length < count) {
      const additional = ['good', 'bad', 'new', 'old', 'high', 'low', 'long', 'short'];
      return [...availableWords, ...additional].slice(0, count);
    }

    return this.getRandomWords(availableWords, count);
  }

  static getRandomWords(words, count) {
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  static shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  static generateExerciseId() {
    return 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  static parseAIResponse(content, word, meaning, example, pronunciation, exerciseType) {
    try {
      console.log('🔍 Parsing AI response for exercise type:', exerciseType);
      
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON structure found in AI response');
      }

      const jsonStr = jsonMatch[0];
      console.log('📋 Extracted JSON:', jsonStr);

      const exercise = JSON.parse(jsonStr);
      
      if (!exercise.question || !exercise.correct_answer) {
        throw new Error('Missing required fields in exercise JSON');
      }

      if (!exercise.options || exercise.options.length !== 4) {
        throw new Error('Synonym/Antonym must have exactly 4 options');
      }

      if (!exercise.options.includes(exercise.correct_answer)) {
        throw new Error('Correct answer must be in options');
      }

      exercise.options = this.shuffleArray([...exercise.options]);

      const result = {
        id: this.generateExerciseId(),
        question: exercise.question,
        correct_answer: exercise.correct_answer,
        options: exercise.options,
        explanation: exercise.explanation || `Giải thích về mối quan hệ với từ "${word}"`,
        type: exercise.type,
        difficulty: exercise.difficulty || 'hard',
        hint: exercise.hint || `Liên quan đến từ "${word}" có nghĩa là "${meaning}"`,
        word_data: {
          word: word,
          meaning: meaning,
          example: example,
          pronunciation: pronunciation
        }
      };

      console.log('🎯 Final AI exercise result:', {
        type: result.type,
        question: result.question
      });

      return result;

    } catch (error) {
      console.error('❌ JSON Parse Error:', error.message);
      console.error('📄 Raw content:', content);
      return this.createSynonymAntonymFallback(word, meaning);
    }
  }

  // ==================== VALIDATION METHODS ====================

  static async validateAnswer(exercise, userAnswer, word, meaning) {
    try {
      console.log('🔍 AIService.validateAnswer called:', {
        exerciseType: exercise?.type,
        userAnswer,
        word,
        meaning
      });

      if (!exercise || !userAnswer) {
        return {
          is_correct: false,
          correct_answer: exercise?.correct_answer || '',
          explanation: "Câu trả lời không hợp lệ"
        };
      }

      let isCorrect = false;
      
      switch (exercise.type) {
        case 'fill_blank':
        case 'multiple_choice':
        case 'pronunciation_check':
        case 'synonym_antonym':
          isCorrect = userAnswer.trim().toLowerCase() === exercise.correct_answer.toLowerCase();
          break;
          
        case 'sentence_construction':
          const normalizedUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
          const normalizedCorrect = exercise.correct_answer.toLowerCase().replace(/\s+/g, ' ');
          isCorrect = normalizedUser === normalizedCorrect;
          break;
      }

      return {
        is_correct: isCorrect,
        correct_answer: exercise.correct_answer,
        explanation: isCorrect ? 
          exercise.explanation || `Chính xác! "${word}" có nghĩa là "${meaning}"` :
          exercise.explanation || `Chưa chính xác. Đáp án đúng là: "${exercise.correct_answer}"`
      };

    } catch (error) {
      console.error('❌ AIService.validateAnswer error:', error);
      const isCorrect = userAnswer.trim().toLowerCase() === exercise.correct_answer.toLowerCase();
      return {
        is_correct: isCorrect,
        correct_answer: exercise.correct_answer,
        explanation: isCorrect ? 
          `Chính xác! "${word}" có nghĩa là "${meaning}"` :
          `Chưa chính xác. Đáp án đúng là: "${exercise.correct_answer}"`
      };
    }
  }

  static clearCache() {
    this.exerciseCache.clear();
    this.pendingRequests.clear();
    console.log('🧹 Cache cleared');
  }
}

module.exports = AIService;