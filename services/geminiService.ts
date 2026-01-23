import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

// API Key is handled by process.env.API_KEY
const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (str: string) => {
  if (!str) return '{}';
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : str.replace(/```json\n?|\n?```/g, '').trim();
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  const ai = createAI();
  const prompt = `JSON: date(YYYY-MM-DD), weightKg, bodyFatPercent, muscleMassKg, bmi, visceralFatLevel, score.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Image } }, { text: prompt }]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    console.error("InBody Scan failed", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = createAI();
  // 最速レスポンスのための極短プロンプト
  const prompt = `Meal analysis JSON. Input: ${description}. Fields: calories(num), protein(num), fat(num), carbs(num), aiAnalysis(short advice).`;
  
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
      aiAnalysis: "ネットワークまたは解析エラーが発生しました。手動で入力を補完してください。"
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

  const prompt = `Score(0-100) and short advice for day. Target: ${targets.calories}kcal, Actual: ${total.cal}kcal. JSON: {score, comment}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    return { score: 70, comment: "継続は力なり！明日も頑張りましょう。" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = createAI();
  const prompt = `Short positive health advice (1 sentence).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "今日も水分をしっかり摂りましょう！";
  } catch (error) {
    return "ストレッチで代謝を上げましょう！";
  }
}
