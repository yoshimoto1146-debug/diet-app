import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

// APIキーの取得とSDKの初期化
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

// JSON文字列を安全に抽出・パースする補助関数
const parseJsonSafe = (text: string) => {
  try {
    // ```json ... ``` のブロックを探す、なければ文字列全体をトリミング
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleaned = jsonMatch ? jsonMatch[0] : text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e, "Original text:", text);
    return {};
  }
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  const ai = getAI();
  const prompt = `InBody結果用紙の写真を解析し、以下の項目をJSON形式で抽出してください:
  date (YYYY-MM-DD形式), weightKg (数値), bodyFatPercent (数値), muscleMassKg (数値), bmi (数値), visceralFatLevel (数値), score (数値).
  読み取れない項目は含めないでください。`;

  try {
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
    return parseJsonSafe(response.text || '{}');
  } catch (error) {
    console.error("InBody Analysis Failed:", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = getAI();
  const prompt = `食事内容（テキストまたは画像）を分析し、推定栄養素をJSONで返してください。
  入力: "${description}"
  項目: calories (kcal単位の数値), protein (g単位の数値), fat (g単位の数値), carbs (g単位の数値), aiAnalysis (40文字以内の日本語アドバイス)`;

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
    return parseJsonSafe(response.text || '{}');
  } catch (error) {
    console.error("Meal Analysis Failed:", error);
    return { calories: 0, protein: 0, fat: 0, carbs: 0, aiAnalysis: "解析に失敗しました。記録のみ保存します。" };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  if (meals.length === 0) return { score: 0, comment: "食事の記録を始めましょう！" };
  const ai = getAI();
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const prompt = `今日の食事内容（合計${totalCal}kcal）を、ユーザーの目的（${user.goal}）と目標（${targets.calories}kcal）に照らして採点してください。
  結果はJSON形式で返してください: { "score": 0から100の数値, "comment": "50文字以内の具体的なアドバイス" }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonSafe(response.text || '{"score":0,"comment":""}');
  } catch (error) {
    return { score: 70, comment: "継続は力なり。明日もバランスの良い食事を心がけましょう！" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = getAI();
  const prompt = `あなたは整骨院の専属ダイエットコーチです。
  ユーザーの目的: ${user.goal}
  最新の体重: ${latestInBody?.weightKg || '未入力'}kg
  このユーザーに向けて、やる気を引き出す専門的なワンポイントアドバイスを1文で作成してください。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "今日も正しい姿勢で過ごし、代謝を上げていきましょう！";
  } catch (error) {
    return "ストレッチで体を整え、理想の体型を目指しましょう！";
  }
};
