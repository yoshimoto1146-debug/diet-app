import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const parseJsonSafe = (text: string) => {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return {};
  }
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  const ai = getAI();
  const prompt = `InBody結果用紙の写真を解析し、以下の項目をJSON形式で抽出してください:
  date (YYYY-MM-DD), weightKg, bodyFatPercent, muscleMassKg, bmi, visceralFatLevel, score.
  数値が不明な場合は含めないでください。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          weightKg: { type: Type.NUMBER },
          bodyFatPercent: { type: Type.NUMBER },
          muscleMassKg: { type: Type.NUMBER },
          bmi: { type: Type.NUMBER },
          visceralFatLevel: { type: Type.NUMBER },
          score: { type: Type.NUMBER },
        }
      }
    }
  });

  return parseJsonSafe(response.text);
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = getAI();
  const prompt = `食事内容を分析し、カロリーとPFCバランスをJSONで返してください。
  入力: "${description}"
  項目: calories(kcal), protein(g), fat(g), carbs(g), aiAnalysis(40文字以内の日本語アドバイス)`;

  const parts: any[] = [{ text: prompt }];
  if (base64Image) {
    parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });
  }

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

  return parseJsonSafe(response.text);
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  if (meals.length === 0) return { score: 0, comment: "記録を始めましょう！" };
  const ai = getAI();
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const prompt = `今日の食事評価をJSONで返してください。
  目標目的: ${user.goal}
  摂取カロリー: ${totalCal}kcal / 目標: ${targets.calories}kcal
  返却形式: { "score": 0-100の数値, "comment": "50文字以内の励ましコメント" }`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return parseJsonSafe(response.text);
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = getAI();
  const prompt = `あなたは整骨院の専属ダイエットコーチです。
  ユーザーの目的: ${user.goal}
  現在の体重: ${latestInBody?.weightKg || '不明'}kg
  このユーザーに寄り添った、専門的かつポジティブな健康アドバイスを1文で作成してください。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  return response.text || "今日も姿勢を正して、代謝を高めていきましょう！";
};
