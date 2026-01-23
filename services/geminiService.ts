import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

// APIキーが設定されていない場合でもビルドが落ちないようにする
const apiKey = process.env.API_KEY || "";
const createAI = () => new GoogleGenAI({ apiKey });

const cleanJsonString = (str: string) => {
  if (!str) return '{}';
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : str.replace(/```json\n?|\n?```/g, '').trim();
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  if (!apiKey) throw new Error("API key is not configured.");
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
          },
          required: ["date", "weightKg", "bodyFatPercent", "muscleMassKg", "bmi"]
        },
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return JSON.parse(cleanJsonString(response.text || '{}'));
  } catch (error) {
    console.error("InBody Analysis Error:", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  if (!apiKey) return { calories: 0, protein: 0, fat: 0, carbs: 0, aiAnalysis: "APIキー未設定" };
  const ai = createAI();
  const prompt = `Analyze meal. Input: "${description}". Return JSON: {calories:number, protein:number, fat:number, carbs:number, aiAnalysis:string(Japanese max 40 chars)}.`;
  
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
        thinkingConfig: { thinkingBudget: 0 },
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
    console.warn("Meal Analysis Fallback:", error);
    return {
      calories: 0, protein: 0, fat: 0, carbs: 0,
      aiAnalysis: "解析に失敗しました。記録のみ保存します。"
    };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  if (!apiKey || meals.length === 0) return { score: 0, comment: "記録を始めましょう！" };
  const ai = createAI();
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const prompt = `Score daily diet. Target: ${targets.calories}kcal, Actual: ${totalCal}kcal. JSON: {score:number, comment:string(Japanese max 50 chars)}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
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
    return { score: 70, comment: "継続して理想の体を目指しましょう！" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  if (!apiKey) return "今日も姿勢を正して過ごしましょう！";
  const ai = createAI();
  const prompt = `Give one short positive health advice for a diet app. Japanese, 1 sentence.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "ストレッチで代謝を上げましょう！";
  } catch (error) {
    return "水分をしっかり摂って代謝を上げましょう。";
  }
}
