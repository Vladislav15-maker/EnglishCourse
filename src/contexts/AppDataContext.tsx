"use client";

import type { AppDataType, StudentRoundAttempt, StudentOfflineGrade, User, StudentData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Client, Databases, ID, Query, Permission, Role } from 'appwrite';

// --- Appwrite Configuration ---
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '68490a67000756367bee'; 
const APPWRITE_DATABASE_ID = '68490bde002e5a1288e6'; //  Database ID from Appwrite console
const APPWRITE_STUDENT_DATA_COLLECTION_ID = '68490c20002d4b93bd39'; //  Collection ID from Appwrite console

// User ID of the teacher, ensure this matches the User ID created in Appwrite Auth
const TEACHER_USER_ID = 'teacher-vladislav'; 

// Initialize Appwrite client
const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// --- Functions to interact with Appwrite ---

async function fetchDataFromServer(currentUser: User | null): Promise<AppDataType> {
  if (!currentUser) {
    console.warn("fetchDataFromServer: User not authenticated. Data will not be loaded.");
    return {};
  }
  if (APPWRITE_DATABASE_ID === 'YOUR_DATABASE_ID' || APPWRITE_STUDENT_DATA_COLLECTION_ID === 'YOUR_STUDENT_DATA_COLLECTION_ID') {
    console.warn("fetchDataFromServer: Appwrite configuration incomplete (Database ID or Collection ID not set). Data cannot be loaded from Appwrite. Please provide them in AppDataContext.tsx");
    return {}; 
  }

  const appData: AppDataType = {};
  try {
    if (currentUser.role === 'teacher') {
      // Teacher requests all documents
      const response = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_STUDENT_DATA_COLLECTION_ID);
      response.documents.forEach(doc => {
        const studentDoc = doc as any; 
        appData[studentDoc.$id] = { 
          roundAttempts: typeof studentDoc.roundAttempts === 'string' ? JSON.parse(studentDoc.roundAttempts || '{}') : (studentDoc.roundAttempts || {}),
          offlineGrades: typeof studentDoc.offlineGrades === 'string' ? JSON.parse(studentDoc.offlineGrades || '[]') : (studentDoc.offlineGrades || []),
        };
      });
    } else if (currentUser.role === 'student') {
      // Student requests only their document
      const studentDocId = currentUser.id;
      try {
        const doc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_STUDENT_DATA_COLLECTION_ID, studentDocId);
        const studentDoc = doc as any; 
        appData[studentDoc.$id] = {
          roundAttempts: typeof studentDoc.roundAttempts === 'string' ? JSON.parse(studentDoc.roundAttempts || '{}') : (studentDoc.roundAttempts || {}),
          offlineGrades: typeof studentDoc.offlineGrades === 'string' ? JSON.parse(studentDoc.offlineGrades || '[]') : (studentDoc.offlineGrades || []),
        };
      } catch (error: any) {
        if (error.code === 404) { 
           console.warn(`Document for student ${studentDocId} not found, attempting to create...`);
           const initialStudentData: StudentData = { roundAttempts: {}, offlineGrades: [] };
           const dataToSave = {
             roundAttempts: JSON.stringify(initialStudentData.roundAttempts),
             offlineGrades: JSON.stringify(initialStudentData.offlineGrades),
           };
           const permissions = [
              Permission.read(Role.user(studentDocId)),      
              Permission.update(Role.user(studentDocId)),    
              Permission.read(Role.user(TEACHER_USER_ID)),   
              Permission.update(Role.user(TEACHER_USER_ID))  
           ];
           await databases.createDocument(
               APPWRITE_DATABASE_ID,
               APPWRITE_STUDENT_DATA_COLLECTION_ID,
               studentDocId, 
               dataToSave,
               permissions   
           );
           appData[studentDocId] = initialStudentData;
           console.log(`Created new document for student ${studentDocId} in Appwrite with permissions.`);
        } else {
            console.error(`Error loading student data ${studentDocId} from Appwrite:`, error);
            throw error; 
        }
      }
    }
  } catch (error) {
    console.error("Error loading data from Appwrite:", error);
  }
  return appData;
}

async function saveDataToServer(
  studentDataToPersist: { [studentId: string]: StudentData },
  studentId: string | null 
): Promise<void> {
  if (!studentId || !studentDataToPersist[studentId]) {
    console.warn("saveDataToServer: studentId not provided or no data to save.");
    return;
  }
   if (APPWRITE_DATABASE_ID === 'YOUR_DATABASE_ID' || APPWRITE_STUDENT_DATA_COLLECTION_ID === 'YOUR_STUDENT_DATA_COLLECTION_ID') {
    console.warn("saveDataToServer: Appwrite configuration incomplete (Database ID or Collection ID not set). Data cannot be saved to Appwrite.");
    return;
  }

  const dataForAppwrite = {
    roundAttempts: JSON.stringify(studentDataToPersist[studentId].roundAttempts || {}),
    offlineGrades: JSON.stringify(studentDataToPersist[studentId].offlineGrades || []),
  };

  try {
    const studentDocId = studentId;
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_STUDENT_DATA_COLLECTION_ID,
      studentDocId,
      dataForAppwrite
    );
    console.log(`Data for student ${studentDocId} successfully updated in Appwrite.`);
  } catch (error: any) {
    if (error.code === 404) { 
      console.warn(`Document for student ${studentId} not found during update, attempting to create...`);
      try {
        const permissions = [
          Permission.read(Role.user(studentId)),      
          Permission.update(Role.user(studentId)),    
          Permission.read(Role.user(TEACHER_USER_ID)),   
          Permission.update(Role.user(TEACHER_USER_ID))  
       ];
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_STUDENT_DATA_COLLECTION_ID,
          studentId,
          dataForAppwrite,
          permissions
        );
        console.log(`Created new document for student ${studentId} in Appwrite during save.`);
      } catch (createError) {
        console.error(`Error creating document for student ${studentId} in Appwrite:`, createError);
      }
    } else {
      console.error(`Error saving student data ${studentId} to Appwrite:`, error);
    }
  }
}


// --- AppDataContext ---
interface AppDataContextType {
  appData: AppDataType;
  loadingData: boolean;
  saveStudentAttempt: (studentId: string, attempt: StudentRoundAttempt) => void;
  getStudentAttempt: (studentId: string, unitId: string, roundId: string) => StudentRoundAttempt | undefined;
  getStudentAttempts: (studentId: string) => StudentRoundAttempt[];
  addOfflineGrade: (gradeData: Omit<StudentOfflineGrade, 'id' | 'assignedBy' | 'assignedAt'>) => void; // Adjusted type
  getStudentOfflineGrades: (studentId: string) => StudentOfflineGrade[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [appData, setAppData] = useState<AppDataType>({});
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useCallback(
    debounce((dataToSave: AppDataType, studentIdToSave: string | null) => {
      if (studentIdToSave) { 
        const dataForSpecificStudent: { [key: string]: StudentData } = {};
        if (dataToSave[studentIdToSave]) {
          dataForSpecificStudent[studentIdToSave] = dataToSave[studentIdToSave];
          saveDataToServer(dataForSpecificStudent, studentIdToSave).finally(() => setIsSaving(false));
        } else {
           setIsSaving(false); 
        }
      } else {
        setIsSaving(false); 
      }
    }, 1000),
    []
  );

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoadingData(false);
        setAppData({}); 
        return;
      }
      setLoadingData(true);
      const data = await fetchDataFromServer(currentUser);
      setAppData(data);
      setLoadingData(false);
    };
    loadData();
  }, [currentUser]);

  const updateAppData = (studentId: string, newStudentData: StudentData) => {
    setAppData(prevData => {
      const updatedData = {
        ...prevData,
        [studentId]: newStudentData,
      };
      setIsSaving(true);
      debouncedSave(updatedData, studentId);
      return updatedData;
    });
  };

  const saveStudentAttempt = (studentId: string, attempt: StudentRoundAttempt) => {
    const studentData = appData[studentId] || { roundAttempts: {}, offlineGrades: [] };
    const roundKey = `${attempt.unitId}-${attempt.roundId}`;
    const updatedAttempts = { ...studentData.roundAttempts, [roundKey]: attempt };
    updateAppData(studentId, { ...studentData, roundAttempts: updatedAttempts });
  };

  const getStudentAttempt = (studentId: string, unitId: string, roundId: string): StudentRoundAttempt | undefined => {
    const studentData = appData[studentId];
    if (!studentData) return undefined;
    const roundKey = `${unitId}-${roundId}`;
    return studentData.roundAttempts[roundKey];
  };

  const getStudentAttempts = (studentId: string): StudentRoundAttempt[] => {
    const studentData = appData[studentId];
    return studentData ? Object.values(studentData.roundAttempts) : [];
  };
  
  const addOfflineGrade = (gradeData: Omit<StudentOfflineGrade, 'id' | 'assignedBy'| 'assignedAt'>) => {
    if (!currentUser || currentUser.role !== 'teacher') {
      console.error("addOfflineGrade: Only a teacher can add grades.");
      return;
    }
    const studentId = gradeData.studentId;
    const studentData = appData[studentId] || { roundAttempts: {}, offlineGrades: [] };
    const newGrade: StudentOfflineGrade = {
      ...gradeData,
      id: ID.unique(), 
      assignedAt: new Date().toISOString(),
      assignedBy: currentUser.id,
    };
    const updatedGrades = [...studentData.offlineGrades, newGrade];
    updateAppData(studentId, { ...studentData, offlineGrades: updatedGrades });
  };

  const getStudentOfflineGrades = (studentId: string): StudentOfflineGrade[] => {
    const studentData = appData[studentId];
    return studentData ? studentData.offlineGrades : [];
  };

  return (
    <AppDataContext.Provider value={{ 
      appData, 
      loadingData: loadingData || isSaving, 
      saveStudentAttempt, 
      getStudentAttempt,
      getStudentAttempts,
      addOfflineGrade,
      getStudentOfflineGrades,
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

// --- Helper: Debounce ---
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
}
