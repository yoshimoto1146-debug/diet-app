
import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, UserProfile, InBodyData } from "./types";

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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `食事内容を分析し、推定栄養素をJSONで返してください。項目: calories(kcal), protein(g), fat(g), carbs(g), aiAnalysis(アドバイス)。`;

  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: { responseMimeType: "application/json" }
    });
    return parseJsonSafe(response.text);
  } catch (error) {
    return { calories: 0, protein: 0, fat: 0, carbs: 0, aiAnalysis: "解析失敗" };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile): Promise<{ score: number; comment: string }> => {
  if (meals.length === 0) return { score: 0, comment: "記録を始めましょう！" };
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `今日の食事評価をJSONで。{ "score": 0-100, "comment": "アドバイス" }`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonSafe(response.text);
  } catch {
    return { score: 0, comment: "明日も頑張りましょう" };
  }
};

export const generateSeikotsuinTip = async (user: UserProfile): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `整骨院コーチとしてのダイエット助言を1つ、30文字以内で。`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "姿勢を正しましょう。";
  } catch {
    return "姿勢を整えて代謝アップ！";
  }
};
