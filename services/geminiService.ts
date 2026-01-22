import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const cleanJsonString = (str: string) => {
  return str.replace(/```json\n?|\n?```/g, '').trim();
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  if (!apiKey) throw new Error("API Key missing");
  const prompt = `
    Analyze this image of an InBody result sheet.
    Extract: weightKg, bodyFatPercent, muscleMassKg, bmi, visceralFatLevel, score.
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
  if (!apiKey) throw new Error("API Key missing");
  const prompt = `
    あなたは整骨院の専属ダイエットコーチです。
    食事（画像/テキスト）を分析し、カロリーとPFC（タンパク質・脂質・炭水化物）を算出して日本語でアドバイスしてください。
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
  if (!apiKey) throw new Error("API Key missing");
  if (meals.length === 0) return { score: 0, comment: "記録を始めましょう！" };
  const summary = meals.map(m => `- ${m.description}: ${m.calories}kcal`).join('\n');
  const prompt = `
    今日の食事を100点満点で採点してください。
    プロフィール: ${user.gender}, ${user.age}歳, 仕事:${user.jobActivity}, 運動:${user.lifestyleActivity}
    食事内容:\n${summary}
    JSON形式で score(数値) と comment(日本語講評) を返してください。
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonString(response.text));
  } catch (error) {
    return { score: 0, comment: "評価に失敗しました。" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  const prompt = `
    あなたは整骨院のコーチです。
    プロフィールに基づき、仕事（${user.jobActivity}）や運動習慣（${user.lifestyleActivity}）を考慮した個別ダイエットプランを日本語・Markdownで提案してください。
    性別:${user.gender}, 年齢:${user.age}歳, 身長:${user.heightCm}cm, 体重:${latestInBody?.weightKg || '不明'}kg
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "プランを生成できませんでした。";
  } catch (error) {
    return "AIプラン作成エラー";
  }
};