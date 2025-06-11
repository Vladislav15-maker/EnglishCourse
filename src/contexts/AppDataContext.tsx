"use client";

import type { AppDataType, StudentRoundAttempt, StudentOfflineGrade, User } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

const APP_DATA_STORAGE_KEY = 'englishCourseAppData';

interface AppDataContextType {
  appData: AppDataType;
  getStudentAttempts: (studentId: string) => StudentRoundAttempt[];
  getStudentAttempt: (studentId: string, unitId: string, roundId: string) => StudentRoundAttempt | undefined;
  saveStudentAttempt: (studentId: string, attempt: StudentRoundAttempt) => void;
  getStudentOfflineGrades: (studentId: string) => StudentOfflineGrade[];
  addOfflineGrade: (grade: Omit<StudentOfflineGrade, 'id' | 'assignedAt'>) => void;
  loadingData: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [appData, setAppData] = useState<AppDataType>({});
  const [loadingData, setLoadingData] = useState(true);
  const { currentUser } = useAuth(); // To ensure data is saved under the correct teacher for grades

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (storedData) {
        setAppData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to load app data from localStorage", error);
      localStorage.removeItem(APP_DATA_STORAGE_KEY);
    }
    setLoadingData(false);
  }, []);

  const persistData = useCallback((data: AppDataType) => {
    try {
      localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save app data to localStorage", error);
    }
  }, []);

  const getStudentData = useCallback((studentId: string) => {
    return appData[studentId] || { roundAttempts: {}, offlineGrades: [] };
  }, [appData]);

  const getStudentAttempts = useCallback((studentId: string): StudentRoundAttempt[] => {
    const studentData = getStudentData(studentId);
    return Object.values(studentData.roundAttempts);
  }, [getStudentData]);

  const getStudentAttempt = useCallback((studentId: string, unitId: string, roundId: string): StudentRoundAttempt | undefined => {
    const studentData = getStudentData(studentId);
    return studentData.roundAttempts[`${unitId}-${roundId}`];
  }, [getStudentData]);

  const saveStudentAttempt = useCallback((studentId: string, attempt: StudentRoundAttempt) => {
    setAppData(prevData => {
      const studentData = prevData[studentId] || { roundAttempts: {}, offlineGrades: [] };
      const updatedStudentData = {
        ...studentData,
        roundAttempts: {
          ...studentData.roundAttempts,
          [`${attempt.unitId}-${attempt.roundId}`]: attempt,
        },
      };
      const newData = { ...prevData, [studentId]: updatedStudentData };
      persistData(newData);
      return newData;
    });
  }, [persistData]);

  const getStudentOfflineGrades = useCallback((studentId: string): StudentOfflineGrade[] => {
    // For teachers, this shows grades they assigned. For students, only their own.
    // The current logic gets all grades for a student. Filtering by assigner can be added if needed.
    return getStudentData(studentId).offlineGrades.sort((a,b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }, [getStudentData]);
  

  const addOfflineGrade = useCallback((gradeData: Omit<StudentOfflineGrade, 'id' | 'assignedAt' | 'assignedBy'> & {studentId: string}) => {
    if (!currentUser || currentUser.role !== 'teacher') {
      console.error("Only teachers can add offline grades.");
      return;
    }
    
    const newGrade: StudentOfflineGrade = {
      ...gradeData,
      id: `grade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser.id, 
    };

    setAppData(prevData => {
      const studentData = prevData[newGrade.studentId] || { roundAttempts: {}, offlineGrades: [] };
      const updatedStudentData = {
        ...studentData,
        offlineGrades: [...studentData.offlineGrades, newGrade],
      };
      const newData = { ...prevData, [newGrade.studentId]: updatedStudentData };
      persistData(newData);
      return newData;
    });
  }, [currentUser, persistData]);


  return (
    <AppDataContext.Provider value={{ 
      appData, 
      getStudentAttempts, 
      getStudentAttempt,
      saveStudentAttempt, 
      getStudentOfflineGrades, 
      addOfflineGrade,
      loadingData 
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
