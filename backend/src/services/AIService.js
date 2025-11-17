// backend/src/services/AIService.js - Groq API với model mới
class AIService {
  static async generateFillBlankExercise(word, meaning, example) {
    const prompt = this.createFillBlankPrompt(word, meaning, example);
    
    try {
      return await this.callGroqAI(prompt, word);
    } catch (error) {
      console.warn('Groq failed, using smart fallback:', error.message);
      return this.generateSmartFallback(word, meaning, example);
    }
  }

  static async callGroqAI(prompt, word) {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not found. Get free key from: https://console.groq.com');
    }

    // Danh sách model mới của Groq
    const availableModels = [
      'llama-3.1-8b-instant',    // Model mới nhất, nhanh, free
      'llama-3.2-1b-preview',    // Model nhẹ, free
      'llama-3.2-3b-preview',    // Model vừa, free
      'llama-3.1-70b-versatile', // Model lớn (có thể cần credit)
      'mixtral-8x7b-32768'       // Model chất lượng cao
    ];

    let lastError = null;

    // Thử lần lượt các model
    for (const model of availableModels) {
      try {
        console.log(`🔄 Calling Groq API with model: ${model}`);
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ Model ${model} failed:`, errorText);
          
          // Kiểm tra nếu lỗi do model không available
          if (errorText.includes('not available') || errorText.includes('rate limit')) {
            lastError = new Error(`Model ${model} not available`);
            continue; // Thử model tiếp theo
          }
          
          throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        console.log(`✅ Model ${model} success, parsing response...`);
        
        try {
          const parsed = JSON.parse(content);
          if (parsed.question && parsed.correct_answer) {
            console.log(`🎯 Successfully generated exercise for: ${word}`);
            return parsed;
          } else {
            throw new Error('Invalid response structure from Groq');
          }
        } catch (parseError) {
          console.warn(`❌ Model ${model} response not valid JSON, trying next model`);
          lastError = parseError;
          continue;
        }

      } catch (error) {
        console.warn(`❌ Model ${model} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    // Nếu tất cả model đều fail
    throw new Error(`All Groq models failed. Last error: ${lastError?.message}`);
  }

  static createFillBlankPrompt(word, meaning, example) {
    return `You are an English teacher. Create a fill-in-the-blank exercise.

WORD: "${word}"
MEANING: "${meaning}"
${example ? `EXAMPLE: "${example}"` : ''}

REQUIREMENTS:
• Create a natural sentence with a blank ______ for the word "${word}"
• Sentence should be 5-15 words, suitable for daily communication
• Correct answer must be: "${word}"
• Add a short explanation in Vietnamese

CRITICAL: Return ONLY valid JSON, no other text.

JSON FORMAT:
{
  "question": "Complete the sentence: ______",
  "correct_answer": "${word}",
  "explanation": "Brief explanation in Vietnamese"
}`;
  }

  static generateSmartFallback(word, meaning, example) {
    const contexts = {
      verb: [
        `Điền động từ thích hợp: "Can you ______ this for me?"`,
        `Hoàn thành câu: "I need to ______ my homework."`,
        `Điền từ: "Please ______ the door quietly."`
      ],
      noun: [
        `Điền danh từ thích hợp: "I bought a new ______ yesterday."`,
        `Hoàn thành câu: "The ______ is very important."`,
        `Điền từ: "This is my favorite ______."`
      ],
      adjective: [
        `Điền tính từ thích hợp: "The movie was very ______."`,
        `Hoàn thành câu: "She feels ______ today."`,
        `Điền từ: "The food smells ______."`
      ],
      default: [
        `Điền từ thích hợp vào chỗ trống: "Please ______ your answer."`,
        `Hoàn thành câu: "I want to ______ something."`,
        `Điền từ: "Can you ______ it again?"`
      ]
    };

    // Phân loại từ thông minh hơn
    let category = 'default';
    const wordLower = word.toLowerCase();
    const meaningLower = meaning.toLowerCase();
    
    if (wordLower.endsWith('ing') || wordLower.endsWith('ed') || 
        meaningLower.includes('động từ') || meaningLower.includes('verb')) {
      category = 'verb';
    } else if (meaningLower.includes('tính từ') || meaningLower.includes('adjective') ||
               wordLower.endsWith('ful') || wordLower.endsWith('able')) {
      category = 'adjective';
    } else if (meaningLower.includes('danh từ') || meaningLower.includes('noun') ||
               wordLower.endsWith('tion') || wordLower.endsWith('ment')) {
      category = 'noun';
    }

    const templates = contexts[category];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      question: randomTemplate.replace('______', `"${word}"`),
      correct_answer: word,
      explanation: `Từ "${word}" có nghĩa là "${meaning}". ${example ? `Ví dụ: ${example}` : 'Từ thông dụng trong giao tiếp tiếng Anh.'}`
    };
  }
}

module.exports = AIService;