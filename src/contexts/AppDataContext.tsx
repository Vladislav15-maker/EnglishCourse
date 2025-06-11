
"use client";

import type { AppDataType, StudentRoundAttempt, StudentOfflineGrade, User, StudentData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Client, Databases, ID, Query, Permission, Role } from 'appwrite';

// --- Appwrite Configuration ---
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1'; 
const APPWRITE_PROJECT_ID = '68490a67000756367bee'; 
const APPWRITE_DATABASE_ID = '68490bde002e5a1288e6';
const APPWRITE_STUDENT_DATA_COLLECTION_ID = '68490c20002d4b93bd39';

const TEACHER_USER_ID = 'teacher-vladislav'; 

const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function fetchDataFromServer(currentUser: User | null): Promise<AppDataType> {
  if (!currentUser) {
    return {};
  }
  
  const appData: AppDataType = {};
  try {
    if (currentUser.role === 'teacher') {
      const response = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_STUDENT_DATA_COLLECTION_ID);
      response.documents.forEach(doc => {
        const studentDoc = doc as any; 
        appData[studentDoc.$id] = { 
          roundAttempts: typeof studentDoc.roundAttempts === 'string' ? JSON.parse(studentDoc.roundAttempts || '{}') : (studentDoc.roundAttempts || {}),
          offlineGrades: typeof studentDoc.offlineGrades === 'string' ? JSON.parse(studentDoc.offlineGrades || '[]') : (studentDoc.offlineGrades || []),
        };
      });
    } else if (currentUser.role === 'student') {
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
    console.warn(`saveDataToServer: No data to persist for studentId: ${studentId}`);
    return;
  }

  const dataForAppwrite = {
    roundAttempts: JSON.stringify(studentDataToPersist[studentId].roundAttempts || {}),
    offlineGrades: JSON.stringify(studentDataToPersist[studentId].offlineGrades || []),
  };

  try {
    const studentDocId = studentId;
    console.log(`Attempting to save data for ${studentDocId}:`, dataForAppwrite);
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_STUDENT_DATA_COLLECTION_ID,
      studentDocId,
      dataForAppwrite
    );
    console.log(`Data saved successfully for ${studentDocId}`);
  } catch (error: any) {
    if (error.code === 404) { 
      try {
        const permissions = [
          Permission.read(Role.user(studentId)),      
          Permission.update(Role.user(studentId)),    
          Permission.read(Role.user(TEACHER_USER_ID)),   
          Permission.update(Role.user(TEACHER_USER_ID))  
       ];
        console.log(`Document not found for ${studentId}. Attempting to create with permissions:`, permissions);
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_STUDENT_DATA_COLLECTION_ID,
          studentId,
          dataForAppwrite,
          permissions
        );
        console.log(`Document created successfully for ${studentId}`);
      } catch (createError) {
        console.error(`Error creating document for student ${studentId} in Appwrite:`, createError);
      }
    } else {
      console.error(`Error saving student data ${studentId} to Appwrite:`, error);
    }
  }
}

// --- Helper: Debounce ---
interface DebouncedFunction<F extends (...args: any[]) => Promise<any>> {
  (...args: Parameters<F>): Promise<ReturnType<F>>;
  cancel: () => void;
  flush: () => Promise<void>; // Add flush method
}

function debounce<F extends (...args: any[]) => Promise<any>>(func: F, waitFor: number): DebouncedFunction<F> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let currentPromiseReject: ((reason?: any) => void) | null = null;
  let lastArgs: Parameters<F> | null = null; // Store last arguments

  const debounced = (...args: Parameters<F>): Promise<ReturnType<F>> => {
    lastArgs = args; // Save the latest arguments
    return new Promise((resolve, reject) => {
      if (currentPromiseReject) {
        currentPromiseReject("Cancelled due to new call");
      }
      currentPromiseReject = reject;

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        timeout = null;
        currentPromiseReject = null; 
        if (lastArgs) { // Ensure lastArgs is not null
          func(...lastArgs)
            .then(resolve)
            .catch(reject);
          lastArgs = null; // Clear after execution
        }
      }, waitFor);
    });
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (currentPromiseReject) {
      currentPromiseReject("Cancelled explicitly");
      currentPromiseReject = null;
    }
    lastArgs = null; // Clear stored args on cancel
  };

  debounced.flush = (): Promise<void> => { // Flush implementation
    return new Promise((resolve, reject) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        if (lastArgs) {
            const argsToFlush = lastArgs;
            lastArgs = null; 
            currentPromiseReject = null;
            func(...argsToFlush)
                .then(() => resolve()) // Resolve the flush promise
                .catch(reject); // Reject if the func call fails
        } else {
            resolve(); // Nothing to flush
        }
    });
  };

  return debounced;
}


interface AppDataContextType {
  appData: AppDataType;
  loadingData: boolean;
  saveStudentAttempt: (studentId: string, attempt: StudentRoundAttempt) => void;
  getStudentAttempt: (studentId: string, unitId: string, roundId: string) => StudentRoundAttempt | undefined;
  getStudentAttempts: (studentId: string) => StudentRoundAttempt[];
  addOfflineGrade: (gradeData: Omit<StudentOfflineGrade, 'id' | 'assignedBy' | 'assignedAt'>) => void;
  getStudentOfflineGrades: (studentId: string) => StudentOfflineGrade[];
  flushPendingSaves: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, logout: authLogout } = useAuth(); // Get authLogout
  const [appData, setAppData] = useState<AppDataType>({});
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const previousUserRef = useRef<User | null>(null);

  const performSave = useCallback(async (dataToSave: AppDataType, studentIdToSave: string | null) => {
    if (!studentIdToSave || !dataToSave[studentIdToSave]) {
      return;
    }
    setIsSaving(true);
    const dataForSpecificStudent: { [key: string]: StudentData } = {
      [studentIdToSave]: dataToSave[studentIdToSave]
    };
    try {
      await saveDataToServer(dataForSpecificStudent, studentIdToSave);
    } catch (error) {
      console.error(`performSave: Error saving data for ${studentIdToSave}:`, error);
    } finally {
      setIsSaving(false);
    }
  }, []); 

  const debouncedSave = useCallback(
    debounce((dataToSave: AppDataType, studentIdToSave: string | null) => {
      return performSave(dataToSave, studentIdToSave);
    }, 1500), 
    [performSave]
  );

  const flushPendingSaves = useCallback(async () => {
    console.log("Flushing pending saves...");
    await debouncedSave.flush();
    console.log("Pending saves flushed.");
  }, [debouncedSave]);
  
  // Expose flush in context and call it before authLogout
  const appDataLogoutCleanup = useCallback(async () => {
    if (previousUserRef.current) {
      const loggedOutStudentId = previousUserRef.current.id;
      console.log(`Logout detected for ${loggedOutStudentId}. Flushing data before logout.`);
      await debouncedSave.flush(); // Ensure data is saved
      console.log(`Data flushed for ${loggedOutStudentId}.`);
    }
  }, [debouncedSave]);


  useEffect(() => {
    const userJustLoggedOut = previousUserRef.current && !currentUser;

    if (userJustLoggedOut) {
      // Data flushing is now handled by the logout process in AuthContext via flushPendingSaves
      // No need to call performSave or debouncedSave.cancel here directly for logout.
    } else if (currentUser) {
      setLoadingData(true);
      fetchDataFromServer(currentUser)
        .then(data => {
          setAppData(data);
        })
        .catch(error => console.error("Failed to load data on user change:", error))
        .finally(() => setLoadingData(false));
    } else { 
      setAppData({});
      setLoadingData(false);
    }

    previousUserRef.current = currentUser;
  }, [currentUser]); // Removed appData, debouncedSave, performSave as they should not trigger refetch/reset


  const updateAppData = (studentId: string, newStudentData: StudentData) => {
    setAppData(prevData => {
      const updatedData = {
        ...prevData,
        [studentId]: newStudentData,
      };
      debouncedSave(updatedData, studentId)
        .catch(error => {
          if (error !== "Cancelled due to new call" && error !== "Cancelled explicitly") {
            console.error("Debounced save failed:", error);
          }
        });
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
      flushPendingSaves, // Expose flush
      appDataLogoutCleanup, // Expose cleanup for AuthContext
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
