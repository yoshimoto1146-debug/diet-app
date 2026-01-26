
import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile } from "../types";

/**
 * AIインスタンスの生成
 * 提示されたAPIキーは環境変数経由で注入される想定です。
 */
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

/**
 * AIのテキストレスポンスからJSONを安全に抽出する
 */
const parseJsonSafe = (text: string | undefined) => {
  if (!text) return {};
  try {
    // マークダウンのコードブロック(```json ... ```)が含まれる場合に対応
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleaned = jsonMatch ? jsonMatch[0] : text.trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parsing Error:", e, "Raw Text:", text);
    return {};
  }
};

export const analyzeInBodyImage = async (base64Image: string): Promise<Partial<InBodyData>> => {
  const ai = getAI();
  const prompt = `InBody結果用紙の写真を解析し、以下の項目をJSON形式で抽出してください:
  date (YYYY-MM-DD形式), weightKg (数値), bodyFatPercent (数値), muscleMassKg (数値), bmi (数値), visceralFatLevel (数値), score (数値).
  読み取れない項目は省略してください。`;

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
    return parseJsonSafe(response.text);
  } catch (error) {
    console.error("InBody Image Analysis Error:", error);
    throw error;
  }
};

export const analyzeMeal = async (description: string, base64Image?: string): Promise<Partial<MealLog>> => {
  const ai = getAI();
  const prompt = `食事内容を分析し、推定栄養素をJSONで返してください。
  入力: "${description}"
  抽出項目: calories (kcal), protein (g), fat (g), carbs (g), aiAnalysis (40文字以内の日本語アドバイス)`;

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
    return parseJsonSafe(response.text);
  } catch (error) {
    console.error("Meal Analysis Error:", error);
    return { calories: 0, protein: 0, fat: 0, carbs: 0, aiAnalysis: "解析中にエラーが発生しました。" };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  if (meals.length === 0) return { score: 0, comment: "まずは今日の食事を1つ記録してみましょう！" };
  
  const ai = getAI();
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const prompt = `今日の食事（合計${totalCal}kcal）を、ユーザーの目的「${user.goal}」と目標「${targets.calories}kcal」に基づいて評価してください。
  返却形式(JSON): { "score": 0-100の数値, "comment": "50文字以内のアドバイス" }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonSafe(response.text);
  } catch (error) {
    return { score: 0, comment: "評価を取得できませんでした。" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = getAI();
  const prompt = `あなたは整骨院の専属ダイエットコーチです。
  ユーザーの目的: ${user.goal}
  現在の状態に基づき、姿勢や代謝に関する専門的かつ前向きなアドバイスを1文（30文字以内）で作成してください。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "今日も正しい姿勢で過ごし、代謝を上げていきましょう！";
  } catch (error) {
    return "ストレッチを取り入れて、巡りの良い体を作っていきましょう！";
  }
};
