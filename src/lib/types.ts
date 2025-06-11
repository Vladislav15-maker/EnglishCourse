export interface User {
  id: string;
  username: string;
  password?: string; // Optional as it won't be stored in context after login
  role: 'teacher' | 'student';
  name: string;
}

export interface Word {
  id: string;
  english: string;
  russian: string;
  transcription: string; // Russian phonetic
}

export interface Round {
  id: string;
  name: string;
  words: Word[];
}

export interface Unit {
  id: string;
  name: string;
  rounds: Round[];
}

export interface StudentRoundAttempt {
  unitId: string;
  roundId: string;
  score: number; // Percentage 0-100
  errors: { wordId: string; incorrectAnswer: string }[];
  completedAt: string; // ISO date string
}

export interface StudentOfflineGrade {
  id: string; // unique id for the grade entry
  studentId: string;
  testName: string; // e.g., "Unit 1 Offline Test"
  grade: number; // 2, 3, 4, or 5
  assignedAt: string; // ISO date string
  assignedBy: string; // Teacher's ID
}

export interface StudentData {
  roundAttempts: { [roundKey: string]: StudentRoundAttempt }; // key: `${unitId}-${roundId}`
  offlineGrades: StudentOfflineGrade[];
}

// Global app data structure, mapping studentId to their data
export interface AppDataType {
  [studentId: string]: StudentData;
}
