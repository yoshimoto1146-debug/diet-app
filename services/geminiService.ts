
import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (str: string) => {
  if (!str) return '{}';
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : str.replace(/```json\n?|\n?```/g, '').trim();
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  const ai = createAI();
  const prompt = `Extract InBody data as JSON. Fields: date(YYYY-MM-DD), weightKg, bodyFatPercent, muscleMassKg, bmi, visceralFatLevel, score.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Image } }, { text: prompt }]
      },
      config: { 
        responseMimeType: "application/json",
        // Recommended to use responseSchema for JSON output
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: 'Measurement date in YYYY-MM-DD format' },
            weightKg: { type: Type.NUMBER },
            bodyFatPercent: { type: Type.NUMBER },
            muscleMassKg: { type: Type.NUMBER },
            bmi: { type: Type.NUMBER },
            visceralFatLevel: { type: Type.NUMBER },
            score: { type: Type.NUMBER },
          },
          required: ["date", "weightKg", "bodyFatPercent", "muscleMassKg", "bmi"]
        },
        thinkingConfig: { thinkingBudget: 0 } // 最速レスポンス
      }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    console.error("InBody Scan failed", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = createAI();
  // 英語のプロンプトの方が生成速度が速いため最適化
  const prompt = `Analyze meal for diet coaching. Input: "${description}". Return JSON: {calories:number, protein:number, fat:number, carbs:number, aiAnalysis:string(short Japanese advice max 40 chars)}.`;
  
  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }, // 思考をスキップして即答
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            aiAnalysis: { type: Type.STRING },
          },
          required: ["calories", "protein", "fat", "carbs", "aiAnalysis"]
        }
      }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    console.warn("AI Analysis failed, returning fallback", error);
    return {
      calories: 0, protein: 0, fat: 0, carbs: 0,
      aiAnalysis: "解析をスキップしました。手動で記録を保存できます。"
    };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  const ai = createAI();
  if (meals.length === 0) return { score: 0, comment: "記録を始めましょう！" };
  
  const total = {
    cal: meals.reduce((s, m) => s + m.calories, 0),
    p: meals.reduce((s, m) => s + m.protein, 0),
    f: meals.reduce((s, m) => s + m.fat, 0),
    c: meals.reduce((s, m) => s + m.carbs, 0),
  };

  const prompt = `Score daily diet. Target: ${targets.calories}kcal, Actual: ${total.cal}kcal. JSON: {score:number, comment:string(short Japanese max 50 chars)}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        // Using responseSchema to ensure structured output
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            comment: { type: Type.STRING },
          },
          required: ["score", "comment"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    return { score: 70, comment: "一歩ずつ進んでいきましょう！" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = createAI();
  const prompt = `Give one short positive health advice for a diet app. Japanese, 1 sentence.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "今日も姿勢を正して過ごしましょう！";
  } catch (error) {
    return "ストレッチで代謝を上げましょう！";
  }
}
