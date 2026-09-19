export type TaskStatus = 'correct' | 'partial' | 'incorrect';

export interface TaskEvaluation {
  id: string;
  taskNumber: string | number;
  taskPrompt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: TaskStatus;
  pointsAwarded: number;
  maxPoints: number;
  detailedFeedback: string;
  teacherTip: string;
  substantiveVerification?: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentNumber: number;
  className: string;
  subject: string;
  testTitle: string;
  date: string;
  imageUrl: string;
  images?: string[]; // Wszystkie strony pracy (strona 1, strona 2, strona 3...)
  pageCount?: number;
  status: 'analyzing' | 'graded' | 'error';
  errorMessage?: string;
  percentageScore: number;
  totalPoints: number;
  maxPoints: number;
  gradeScale: string; // np. "5 (bardzo dobry)"
  gradeNumber: number; // 1 to 6
  overallJustification: string;
  strengths: string[];
  weaknesses: string[];
  teacherRecommendations: string;
  tasks: TaskEvaluation[];
  groundingSources: GroundingSource[];
  webSearchQueries?: string[];
  teacherCustomNotes?: string;
  adjustedGrade?: string;
  isQuotaFallback?: boolean;
}

export interface GradingCriteriaPreset {
  subject: string;
  defaultClass: string;
  defaultTestTitle: string;
  notes?: string;
}

export interface ClassSummaryStats {
  totalGraded: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeCounts: Record<number, number>; // 1: n, 2: n, ... 6: n
  passingRate: number; // percentage >= 50%
  mostDifficultTopics: Array<{
    topic: string;
    errorCount: number;
    tipForTeacher: string;
  }>;
}
