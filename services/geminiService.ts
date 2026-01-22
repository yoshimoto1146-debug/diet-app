import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
    return JSON.parse(cleanJsonString(response.text));
  } catch (error) {
    console.error("InBody Analysis Error:", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = createAI();
  const prompt = `
    あなたは整骨院の専属ダイエットコーチです。
    食事を分析し、カロリー・PFCを算出してください。
    【重要】アドバイス(aiAnalysis)はスマホで見やすいよう、100文字以内の「ポジティブで具体的な一言」に要約してください。
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
    return JSON.parse(cleanJsonString(response.text));
  } catch (error) {
    console.error("Meal Analysis Error:", error);
    throw error;
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile): Promise<{ score: number; comment: string }> => {
  const ai = createAI();
  if (meals.length === 0) return { score: 0, comment: "まずは今日の食事を記録してみましょう！応援しています！" };
  const summary = meals.map(m => `- ${m.description}: ${m.calories}kcal`).join('\n');
  const prompt = `
    今日の食事を採点してください。
    プロフィール: ${user.gender}, ${user.age}歳
    食事内容:\n${summary}
    JSON形式で score(数値) と comment(スマホで見やすい60文字以内の励まし) を返してください。
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text));
  } catch (error) {
    return { score: 0, comment: "今日も一日お疲れ様でした！" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = createAI();
  const prompt = `
    あなたは整骨院のコーチです。
    初心者がやる気になる「今日のワンポイントアドバイス」を1つだけ提案してください。
    【重要】箇条書きなどは使わず、3行程度の短い文章で、親しみやすくポジティブに。
    性別:${user.gender}, 年齢:${user.age}歳, 体重:${latestInBody?.weightKg || '不明'}kg
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "今日も一緒に頑張りましょう！";
  } catch (error) {
    return "姿勢を正すだけで代謝が上がりますよ！";
  }
};
