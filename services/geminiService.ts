
import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

// Always use process.env.API_KEY directly and create instance right before use
const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (str: string) => {
  return str.replace(/```json\n?|\n?```/g, '').trim();
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  const ai = createAI();
  const prompt = `
    Analyze this InBody sheet.
    Extract measurement DATE (format: YYYY-MM-DD), weightKg, bodyFatPercent, muscleMassKg, bmi, visceralFatLevel, score.
    If date is not found, use current date.
    Return ONLY a valid JSON object.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Image } }, { text: prompt }]
      },
      config: { responseMimeType: "application/json" }
    });
    // Access text property directly as per guidelines
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    console.error("InBody Analysis Error:", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = createAI();
  const prompt = `
    あなたは整骨院の専属ダイエットコーチです。
    食事を分析し、カロリー・PFC(g)を算出してください。
    【重要】アドバイス(aiAnalysis)は100文字以内の「ポジティブで具体的な一言」に要約。
    入力: ${description}
  `;
  const parts: any[] = [{ text: prompt }];
  if (base64Image) parts.unshift({ inlineData: { mimeType: 'image/jpeg', data: base64Image } });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
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
          required: ["description", "calories", "protein", "fat", "carbs", "aiAnalysis"]
        }
      }
    });
    // Access text property directly as per guidelines
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    console.error("Meal Analysis Error:", error);
    throw error;
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  const ai = createAI();
  if (meals.length === 0) return { score: 0, comment: "まずは今日の食事を記録してみましょう！応援しています！" };
  
  const total = {
    cal: meals.reduce((s, m) => s + m.calories, 0),
    p: meals.reduce((s, m) => s + m.protein, 0),
    f: meals.reduce((s, m) => s + m.fat, 0),
    c: meals.reduce((s, m) => s + m.carbs, 0),
  };

  const prompt = `
    整骨院のコーチとして今日の食事を採点(0-100)してください。
    目標: カロリー${targets.calories}kcal, P:${targets.protein}g, F:${targets.fat}g, C:${targets.carbs}g
    実績: カロリー${total.cal}kcal, P:${total.p}g, F:${total.f}g, C:${total.c}g
    
    【ルール】
    1. 60文字以内で、初心者でもやる気が出る超ポジティブなアドバイスを返してください。
    2. JSON形式で score(数値) と comment を返してください。
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    // Access text property directly as per guidelines
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    return { score: 80, comment: "バランス良く食べられていますね！明日も楽しみましょう！" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = createAI();
  const prompt = `
    あなたは整骨院のコーチです。
    初心者がやる気になる「今日のワンポイントアドバイス」を1つ提案。
    3行程度の短い文章で。
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Access text property directly as per guidelines
    return response.text || "今日も一緒に頑張りましょう！";
  } catch (error) {
    return "姿勢を正すだけで代謝が上がりますよ！";
  }
}
