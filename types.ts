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

export enum DietGoal {
  POSTPARTUM = '産後ダイエット',
  POSTPARTUM_NURSING = '産後ダイエット(授授中)',
  DIABETES = '糖尿病予防',
  HYPERTENSION = '高血圧予防',
  GENERAL = '一般ダイエット',
  OTHER = 'その他（カスタム）'
}

export type MealCategory = '朝食' | '昼食' | '夕食' | '間食';

export interface UserProfile {
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  targetWeightKg: number;
  jobActivity: JobActivity;
  lifestyleActivity: LifestyleActivity;
  goal: DietGoal;
  isStaff?: boolean;
  customTargets?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface InBodyData {
  id: string;
  date: string;
  weightKg: number;
  bodyFatMassKg?: number; 
  muscleMassKg?: number;   
  visceralFatLevel?: number; 
  bodyFatPercent?: number;
  bmi?: number;
  score?: number;
  isManual?: boolean;
}

export interface MealLog {
  id: string;
  date: string;
  time: string;
  category: MealCategory;
  description: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  aiAnalysis?: string;
}

export type ViewState = 'login' | 'dashboard' | 'inbody' | 'meals' | 'profile' | 'staff-portal';
