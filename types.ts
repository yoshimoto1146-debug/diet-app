export enum Gender {
  MALE = '男性',
  FEMALE = '女性',
  OTHER = 'その他'
}

export enum JobActivity {
  DESK = 'デスクワーク（ほぼ動かない）',
  WALK = '歩き回る仕事（営業など）',
  DRIVE = '運転が中心',
  HEAVY = '重い物を持つ（重労働）'
}

export enum LifestyleActivity {
  NONE = 'ほぼ動かない',
  LOW = '週1〜2回運動している',
  HIGH = '週3〜4回以上運動している'
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  targetWeightKg: number;
  jobActivity: JobActivity;
  lifestyleActivity: LifestyleActivity;
}

export interface InBodyData {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercent: number;
  muscleMassKg: number;
  bmi: number;
  visceralFatLevel?: number;
  score?: number;
}

export interface MealLog {
  id: string;
  date: string;
  time: string;
  description: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  aiAnalysis?: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  activity: string;
  durationMinutes: number;
  intensity: 'Low' | 'Medium' | 'High';
  caloriesBurned?: number;
}

export type ViewState = 'dashboard' | 'inbody' | 'meals' | 'exercise' | 'profile';