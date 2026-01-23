import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (str: string) => {
  if (!str) return '{}';
  // 不要なMarkdown記法を除去
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : str.replace(/```json\n?|\n?```/g, '').trim();
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  const ai = createAI();
  const prompt = `Extract InBody data as JSON: date(YYYY-MM-DD), weightKg, bodyFatPercent, muscleMassKg, bmi, visceralFatLevel, score.`;
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
    console.error("InBody Analysis Error:", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = createAI();
  // 高速化のためプロンプトを極限まで短縮
  const prompt = `Analyze meal. Return JSON only: {description, calories(number), protein(g), fat(g), carbs(g), aiAnalysis(max 50 chars short advice)}. Input: ${description}`;
  
  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flashは非常に高速
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        // Schemaを定義することで安定性を確保
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
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
    const text = response.text;
    return JSON.parse(cleanJsonString(text || '{}'));
  } catch (error) {
    console.error("Meal Analysis Error:", error);
    // 失敗時のフォールバック
    return {
      description: description || "解析エラー",
      calories: 0, protein: 0, fat: 0, carbs: 0,
      aiAnalysis: "申し訳ありません。解析に失敗しました。もう一度お試しください。"
    };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  const ai = createAI();
  if (meals.length === 0) return { score: 0, comment: "まずは今日の食事を記録してみましょう！" };
  
  const total = {
    cal: meals.reduce((s, m) => s + m.calories, 0),
    p: meals.reduce((s, m) => s + m.protein, 0),
    f: meals.reduce((s, m) => s + m.fat, 0),
    c: meals.reduce((s, m) => s + m.carbs, 0),
  };

  const prompt = `Daily meal evaluation (0-100 score). Target: ${targets.calories}kcal. Actual: ${total.cal}kcal. Return JSON: {score, comment(max 50 chars advice)}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    return { score: 70, comment: "記録を続けて、理想の体を目指しましょう！" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = createAI();
  const prompt = `Short advice from a health coach (max 2 lines).`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "今日も姿勢を正して過ごしましょう！";
  } catch (error) {
    return "水分をしっかり摂って代謝を上げましょう。";
  }
}
