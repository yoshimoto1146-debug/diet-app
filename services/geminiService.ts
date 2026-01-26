
import { GoogleGenAI, Type } from "@google/genai";
import { MealLog, InBodyData, UserProfile, DietGoal } from "../types";

/**
 * AIインスタンスの生成
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
    // マークダウンのコードブロックが含まれる場合に対応
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
        responseMimeType: "application/json"
      }
    });
    return parseJsonSafe(response.text);
  } catch (error) {
    return { calories: 0, protein: 0, fat: 0, carbs: 0, aiAnalysis: "解析に失敗しました。" };
  }
};

export const evaluateDailyDiet = async (meals: MealLog[], user: UserProfile, targets: any): Promise<{ score: number; comment: string }> => {
  if (meals.length === 0) return { score: 0, comment: "まずは今日の食事を1つ記録してみましょう！" };
  
  const ai = getAI();
  const totalCal = meals.reduce((s, m) => s + m.calories, 0);
  const prompt = `あなたはプロのダイエットコーチです。
  ユーザーの目的: ${user.goal}
  今日の総摂取カロリー: ${totalCal}kcal / 目標: ${targets.calories}kcal
  
  評価とアドバイスをJSONで返してください。
  目的が「糖尿病予防」なら糖質制限、「高血圧予防」なら塩分、「産後」なら骨盤ケアや栄養、「授乳中」なら必要な追加栄養に焦点を当ててください。
  { "score": 0-100, "comment": "50文字以内" }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return parseJsonSafe(response.text);
  } catch (error) {
    return { score: 70, comment: "継続こそが成功の鍵です。明日も頑張りましょう！" };
  }
};

export const generateSeikotsuinPlan = async (user: UserProfile, latestInBody?: InBodyData): Promise<string> => {
  const ai = getAI();
  const prompt = `あなたは整骨院の専属ダイエットコーチです。
  ユーザーの目的: ${user.goal}
  現在の状態に基づき、姿勢や代謝に関する専門的なアドバイスを1文（30文字以内）で作成してください。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "正しい姿勢で過ごし、基礎代謝を高めていきましょう。";
  } catch (error) {
    return "ストレッチを取り入れて、巡りの良い体を作っていきましょう。";
  }
};
