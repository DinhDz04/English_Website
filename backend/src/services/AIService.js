// backend/src/services/AIService.js
require('dotenv').config();

class AIService {
  static exerciseCache = new Map();
  static pendingRequests = new Map();

  static async generateExercise(word, meaning, example, exerciseType = 'fill_blank') {
    const cacheKey = `${word}_${meaning}_${exerciseType}`;

    if (this.exerciseCache.has(cacheKey)) {
      console.log(`📚 Using cached exercise for: ${word} (${exerciseType})`);
      return this.exerciseCache.get(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const exercisePromise = this.callGroqAI(word, meaning, example, exerciseType);
    this.pendingRequests.set(cacheKey, exercisePromise);

    try {
      const result = await exercisePromise;
      this.exerciseCache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  static async callGroqAI(word, meaning, example, exerciseType = 'fill_blank') {
    console.log(`⚡ Calling Groq AI for: ${word} (${exerciseType})`);

    const prompt = this.createVietnamesePrompt(word, meaning, example, exerciseType);
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API key not found in .env file');
    }

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
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log(`📄 Raw AI response: ${content}`);

    return this.parseAIResponse(content, word, meaning, exerciseType);
  }

  static createVietnamesePrompt(word, meaning, example, exerciseType) {
    const prompts = {
      fill_blank: `Tạo bài tập ĐIỀN TỪ tiếng Anh:
Từ: "${word}" - Nghĩa: "${meaning}" - Ví dụ: "${example}"

YÊU CẦU:
- Câu hỏi TIẾNG VIỆT yêu cầu điền từ tiếng Anh
- Đáp án đúng phải là từ tiếng Anh "${word}"
- Tạo câu hỏi dựa trên nghĩa "${meaning}" hoặc ví dụ "${example}"
- Câu hỏi phải rõ ràng, dễ hiểu

JSON output (CHỈ JSON, KHÔNG CÓ TEXT KHÁC):
{
  "question": "Từ tiếng Anh có nghĩa là '${meaning}' là gì?",
  "correct_answer": "${word}",
  "options": [],
  "explanation": "Giải thích tại sao đáp án là '${word}'",
  "type": "fill_blank"
}`,

      multiple_choice: `Tạo bài tập CHỌN ĐÁP ÁN ĐÚNG bằng tiếng Anh:
Từ: "${word}" - Nghĩa: "${meaning}" - Ví dụ: "${example}"

YÊU CẦU:
- Câu hỏi TIẾNG VIỆT hỏi về từ tiếng Anh
- 4 lựa chọn ĐỀU là từ TIẾNG ANH
- 1 đáp án đúng là "${word}"
- 3 đáp án sai là các từ tiếng Anh khác có nghĩa tương tự hoặc dễ nhầm lẫn (ví dụ: nếu từ là "happy", các từ sai có thể là "sad", "angry", "tired")

JSON output (CHỈ JSON, KHÔNG CÓ TEXT KHÁC):
{
  "question": "Từ tiếng Anh nào có nghĩa là '${meaning}'?",
  "correct_answer": "${word}",
  "options": ["${word}", "từ_sai_1", "từ_sai_2", "từ_sai_3"],
  "explanation": "Giải thích đáp án đúng là '${word}'",
  "type": "multiple_choice"
}`,

     
    };

    return prompts[exerciseType] || prompts.fill_blank;
  }

  static parseAIResponse(content, word, meaning, exerciseType = 'fill_blank') {
    try {
      console.log('🔍 Parsing AI response for exercise type:', exerciseType);
      
      // Tìm JSON trong response
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON structure found in AI response');
      }

      const jsonStr = jsonMatch[0];
      console.log('📋 Extracted JSON:', jsonStr);

      const exercise = JSON.parse(jsonStr);
      
      // Kiểm tra các trường bắt buộc
      if (!exercise.question || !exercise.correct_answer) {
        throw new Error('Missing required fields in exercise JSON');
      }

      // Đảm bảo type khớp
      exercise.type = exerciseType;

      // Xử lý đặc thù cho từng loại bài tập
      switch (exerciseType) {
        case 'fill_blank':
          exercise.options = [];
          break;
          
        case 'multiple_choice':
          // Đảm bảo có đủ 4 options và đáp án đúng nằm trong options
          if (!exercise.options || exercise.options.length !== 4) {
            throw new Error('Multiple choice must have exactly 4 options');
          }
          if (!exercise.options.includes(exercise.correct_answer)) {
            throw new Error('Correct answer must be in options');
          }
          // Xáo trộn options
          exercise.options = exercise.options.sort(() => Math.random() - 0.5);
          break;
          
  
      }

      const result = {
        question: exercise.question,
        correct_answer: exercise.correct_answer,
        options: exercise.options || [],
        words: exercise.words || [],
        explanation: exercise.explanation || `"${word}" có nghĩa là "${meaning}"`,
        type: exercise.type,
      };

      console.log('🎯 Final exercise result:', {
        question: result.question,
        correct_answer: result.correct_answer,
        options: result.options,
        words: result.words,
        type: result.type
      });

      return result;

    } catch (error) {
      console.error('❌ JSON Parse Error:', error.message);
      console.error('📄 Raw content:', content);
      
      // NÉM LỖI thay vì fallback
      throw new Error(`Failed to generate ${exerciseType} exercise: ${error.message}`);
    }
  }





  // backend/src/services/AIService.js
static async validateAnswer(exercise, userAnswer, word, meaning) {
  try {
    console.log('🔍 AIService.validateAnswer called:', {
      exerciseType: exercise?.type,
      userAnswer,
      word,
      meaning
    });

    if (!exercise || !userAnswer) {
      console.log('❌ Missing exercise or userAnswer');
      return {
        is_correct: false,
        correct_answer: exercise?.correct_answer || '',
        explanation: "Câu trả lời không hợp lệ"
      };
    }

    // ĐƠN GIẢN HÓA: So sánh trực tiếp trước
    const simpleCheck = userAnswer.trim().toLowerCase() === exercise.correct_answer.toLowerCase();
    
    console.log('🔍 Simple validation result:', {
      userAnswer: userAnswer.toLowerCase(),
      correctAnswer: exercise.correct_answer.toLowerCase(), 
      match: simpleCheck
    });

    if (simpleCheck) {
      return {
        is_correct: true,
        correct_answer: exercise.correct_answer,
        explanation: `Chính xác! "${word}" có nghĩa là "${meaning}"`
      };
    }

    // Nếu không khớp, dùng AI để kiểm tra phức tạp hơn
    console.log('🔍 Using AI for complex validation...');
    const aiResult = await this.validateWithAI(exercise, userAnswer, word, meaning);
    
    return {
      is_correct: aiResult,
      correct_answer: exercise.correct_answer,
      explanation: aiResult ? 
        `Chính xác! "${word}" có nghĩa là "${meaning}"` :
        `Chưa chính xác. Đáp án đúng là: "${exercise.correct_answer}". "${word}" có nghĩa là "${meaning}"`
    };

  } catch (aiError) {
    console.error('❌ AIService.validateAnswer error:', aiError);
    // Fallback to simple check
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

  static async validateWithAI(exercise, userAnswer, word, meaning) {
    const prompt = `Kiểm tra xem câu trả lời có đúng không với bài tập tiếng Anh:
    
Bài tập: ${exercise.question}
Loại bài tập: ${exercise.type}
Đáp án đúng: ${exercise.correct_answer}
Câu trả lời của người dùng: "${userAnswer}"
Từ mục tiêu: "${word}" - Nghĩa: "${meaning}"

Yêu cầu:
- Với bài tập điền từ (fill_blank): So sánh từ người dùng điền có khớp với "${word}" không (bỏ qua hoa thường)
- Với bài tập trắc nghiệm (multiple_choice): Kiểm tra lựa chọn có đúng là "${word}" không


CHỈ trả về "true" nếu câu trả lời hoàn toàn chính xác, "false" nếu sai.`;

    const apiKey = process.env.GROQ_API_KEY;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      throw new Error('AI validation failed');
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim().toLowerCase();
    
    console.log('🤖 AI validation result:', content);
    
    return content === 'true';
  }


  

  static clearCache() {
    this.exerciseCache.clear();
    this.pendingRequests.clear();
    console.log('🧹 Cache cleared');
  }
}

module.exports = AIService;