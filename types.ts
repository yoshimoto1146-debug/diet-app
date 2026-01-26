

export interface UserProfile {
  patientId: string;
  clinicCode: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  targetWeightKg: number;
  jobActivity: JobActivity;
  lifestyleActivity: LifestyleActivity;
  goal: DietGoal;
  isStaff?: boolean;
}

export interface InBodyData {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  bmi?: number;
  visceralFatLevel?: number;
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

export interface ExerciseLog {
  id: string;
  date: string;
  activity: string;
  durationMinutes: number;
  intensity: 'Low' | 'Medium' | 'High';
  caloriesBurned?: number;
}

export type ViewState = 'login' | 'dashboard' | 'inbody' | 'meals' | 'exercise' | 'profile' | 'staff-portal';

