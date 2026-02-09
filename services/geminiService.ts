
import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, UserProfile, InBodyData } from "./types";

/**
 * AIインスタンスの生成
 * Always use process.env.API_KEY directly as per guidelines.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonSafe = (text: string | undefined) => {
  if (!text) return {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text.trim());
  } catch (e) {
    return {};
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = getAI();
  const prompt = `食事内容を分析し、推定栄養素をJSONで返してください。
  項目: calories(kcal), protein(g), fat(g), carbs(g), aiAnalysis(40文字以内の日本語アドバイス)。
  PFCバランスの重要性を考慮してください。`;

  const parts: any[] = [{ text: prompt }];
  if (base64Image) parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { responseMimeType: "application/json" }
    });
    return parseJsonSafe(response.text);
  } catch (error) {
    return { calories: 0, protein: 0, fat: 0, carbs: 0, aiAnalysis: "解析エラー" };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile): Promise<{ score: number; comment: string }> => {
  if (meals.length === 0) return { score: 0, comment: "食事を記録しましょう！" };
  const ai = getAI();
  const totalP = meals.reduce((s, m) => s + m.protein, 0);
  const prompt = `今日の食事評価。PFCバランス(特にタンパク質${totalP}g)を重視し、目的${user.goal}に合わせたアドバイスをJSONで。{ "score": 0-100, "comment": "40文字以内" }`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonSafe(response.text);
  } catch {
    return { score: 0, comment: "継続しましょう！" };
  }
};

export const generateSeikotsuinTip = async (user: UserProfile): Promise<string> => {
  const ai = getAI();
  const prompt = `整骨院ダイエットコーチとして、姿勢や代謝に関する助言を1つ、30文字以内で。`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "良い姿勢を意識しましょう。";
  } catch {
    return "姿勢を整えて代謝アップ！";
  }
}
