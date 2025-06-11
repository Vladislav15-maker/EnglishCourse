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
    console.log("[Appwrite] fetchDataFromServer: No current user, returning empty data.");
    return {};
  }
  
  const appData: AppDataType = {};
  console.log(`[Appwrite] fetchDataFromServer: Fetching data for user: ${currentUser.id}, role: ${currentUser.role}`);
  try {
    if (currentUser.role === 'teacher') {
      const response = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_STUDENT_DATA_COLLECTION_ID);
      console.log("[Appwrite] fetchDataFromServer: Fetched all student documents for teacher:", response.documents.length);
      response.documents.forEach(doc => {
        const studentDoc = doc as any; 
        
        let attempts = {};
        if (typeof studentDoc.roundAttempts === 'string' && studentDoc.roundAttempts.trim() !== '') {
          try {
            attempts = JSON.parse(studentDoc.roundAttempts);
          } catch (e) {
            console.error(`[Appwrite] Failed to parse roundAttempts for ${studentDoc.$id}:`, studentDoc.roundAttempts, e);
          }
        } else if (studentDoc.roundAttempts && typeof studentDoc.roundAttempts === 'object') {
          attempts = studentDoc.roundAttempts;
        }

        let grades: StudentOfflineGrade[] = [];
        if (typeof studentDoc.offlineGrades === 'string' && studentDoc.offlineGrades.trim() !== '') {
          try {
            grades = JSON.parse(studentDoc.offlineGrades);
          } catch (e) {
            console.error(`[Appwrite] Failed to parse offlineGrades for ${studentDoc.$id}:`, studentDoc.offlineGrades, e);
          }
        } else if (Array.isArray(studentDoc.offlineGrades)) {
          grades = studentDoc.offlineGrades;
        }
        
        appData[studentDoc.$id] = { 
          roundAttempts: attempts,
          offlineGrades: grades,
        };
      });
    } else if (currentUser.role === 'student') {
      const studentDocId = currentUser.id;
      try {
        const doc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_STUDENT_DATA_COLLECTION_ID, studentDocId);
        const studentDoc = doc as any;
        console.log(`[Appwrite] fetchDataFromServer: Fetched document for student ${studentDocId}:`, studentDoc);
        
        let attempts = {};
        if (typeof studentDoc.roundAttempts === 'string' && studentDoc.roundAttempts.trim() !== '') {
          try {
            attempts = JSON.parse(studentDoc.roundAttempts);
          } catch (e) {
            console.error(`[Appwrite] Failed to parse roundAttempts for ${studentDoc.$id}:`, studentDoc.roundAttempts, e);
          }
        } else if (studentDoc.roundAttempts && typeof studentDoc.roundAttempts === 'object') {
          attempts = studentDoc.roundAttempts;
        }

        let grades: StudentOfflineGrade[] = [];
        if (typeof studentDoc.offlineGrades === 'string' && studentDoc.offlineGrades.trim() !== '') {
          try {
            grades = JSON.parse(studentDoc.offlineGrades);
          } catch (e) {
            console.error(`[Appwrite] Failed to parse offlineGrades for ${studentDoc.$id}:`, studentDoc.offlineGrades, e);
          }
        } else if (Array.isArray(studentDoc.offlineGrades)) {
          grades = studentDoc.offlineGrades;
        }

        appData[studentDoc.$id] = {
          roundAttempts: attempts,
          offlineGrades: grades,
        };

      } catch (error: any) {
        if (error.code === 404) { 
           console.log(`[Appwrite] fetchDataFromServer: Document not found for student ${studentDocId}. Creating initial document.`);
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
           console.log(`[Appwrite] fetchDataFromServer: Initial document created for student ${studentDocId}.`);
        } else {
            console.error(`[Appwrite] fetchDataFromServer: Error loading student data ${studentDocId} from Appwrite:`, error);
            throw error; 
        }
      }
    }
  } catch (error) {
    console.error("[Appwrite] fetchDataFromServer: General error loading data from Appwrite:", error);
  }
  console.log("[Appwrite] fetchDataFromServer: Returning appData:", appData);
  return appData;
}

async function saveDataToServer(
  studentDataToPersist: { [studentId: string]: StudentData },
  studentId: string | null 
): Promise<void> {
  if (!studentId || !studentDataToPersist[studentId]) {
    console.warn(`[Appwrite] saveDataToServer: No data or invalid studentId to persist. studentId: ${studentId}`);
    return;
  }

  const dataForAppwrite = {
    roundAttempts: JSON.stringify(studentDataToPersist[studentId].roundAttempts || {}),
    offlineGrades: JSON.stringify(studentDataToPersist[studentId].offlineGrades || []),
  };

  try {
    const studentDocId = studentId;
    console.log(`[Appwrite] saveDataToServer: Attempting to save data for ${studentDocId}:`, dataForAppwrite);
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_STUDENT_DATA_COLLECTION_ID,
      studentDocId,
      dataForAppwrite
    );
    console.log(`[Appwrite] saveDataToServer: Data saved successfully via update for ${studentDocId}`);
  } catch (error: any) {
    if (error.code === 404) { 
      try {
        const permissions = [
          Permission.read(Role.user(studentId)),      
          Permission.update(Role.user(studentId)),    
          Permission.read(Role.user(TEACHER_USER_ID)),   
          Permission.update(Role.user(TEACHER_USER_ID))  
       ];
        console.log(`[Appwrite] saveDataToServer: Document not found for ${studentId}. Attempting to create with permissions:`, permissions);
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_STUDENT_DATA_COLLECTION_ID,
          studentId,
          dataForAppwrite,
          permissions
        );
        console.log(`[Appwrite] saveDataToServer: Document created successfully for ${studentId}`);
      } catch (createError) {
        console.error(`[Appwrite] saveDataToServer: Error creating document for student ${studentId} in Appwrite:`, createError);
        throw createError; 
      }
    } else {
      console.error(`[Appwrite] saveDataToServer: Error saving/updating student data ${studentId} to Appwrite:`, error);
      throw error; 
    }
  }
}

// --- Helper: Debounce ---
interface DebouncedFunction<F extends (...args: any[]) => Promise<any>> {
  (...args: Parameters<F>): Promise<ReturnType<F>>;
  cancel: () => void;
  flush: () => Promise<void>; 
}

function debounce<F extends (...args: any[]) => Promise<any>>(func: F, waitFor: number): DebouncedFunction<F> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let currentPromiseReject: ((reason?: any) => void) | null = null;
  let lastArgs: Parameters<F> | null = null; 

  const debounced = (...args: Parameters<F>): Promise<ReturnType<F>> => {
    lastArgs = args; 
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
        if (lastArgs) { 
          func(...lastArgs)
            .then(resolve)
            .catch(reject);
          lastArgs = null; 
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
    lastArgs = null; 
  };

  debounced.flush = (): Promise<void> => { 
    return new Promise((resolve, reject) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        if (lastArgs) {
            const argsToSave = lastArgs;
            lastArgs = null; 
            currentPromiseReject = null;
            console.log("[Debounce] Flushing with args:", argsToSave);
            func(...argsToSave)
                .then(() => {
                    console.log("[Debounce] Flush successful.");
                    resolve();
                }) 
                .catch(err => {
                    console.error("[Debounce] Flush error:", err);
                    reject(err);
                });      
        } else {
            console.log("[Debounce] Nothing to flush or already flushed.");
            resolve(); 
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
  const { currentUser } = useAuth(); 
  const [appData, setAppData] = useState<AppDataType>({});
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const previousUserRef = useRef<User | null>(null);

  const performSave = useCallback(async (dataToSave: AppDataType, studentIdToSave: string | null) => {
    if (!studentIdToSave || !dataToSave[studentIdToSave]) {
      console.warn(`[AppDataContext] performSave: No data or invalid studentId to persist. studentId: ${studentIdToSave}, dataToSave[studentIdToSave] exists: ${!!dataToSave[studentIdToSave]}`);
      return;
    }
    setIsSaving(true);
    console.log(`[AppDataContext] performSave: Starting save for studentId: ${studentIdToSave}`, dataToSave[studentIdToSave]);
    const dataForSpecificStudent: { [key: string]: StudentData } = {
      [studentIdToSave]: dataToSave[studentIdToSave]
    };
    try {
      await saveDataToServer(dataForSpecificStudent, studentIdToSave);
      console.log(`[AppDataContext] performSave: Save successful for studentId: ${studentIdToSave}`);
    } catch (error) {
      console.error(`[AppDataContext] performSave: Error saving data for ${studentIdToSave}:`, error);
    } finally {
      setIsSaving(false);
      console.log(`[AppDataContext] performSave: Finished save attempt for studentId: ${studentIdToSave}`);
    }
  }, []); 

  const debouncedSave = useCallback(
    debounce((dataToSave: AppDataType, studentIdToSave: string | null) => {
      return performSave(dataToSave, studentIdToSave);
    }, 1500), 
    [performSave]
  );

  const flushPendingSaves = useCallback(async () => {
    console.log("[AppDataContext] Flushing pending saves explicitly...");
    await debouncedSave.flush();
    console.log("[AppDataContext] Explicit pending saves flushed.");
  }, [debouncedSave]);
  
  useEffect(() => {
    const userJustLoggedOut = previousUserRef.current && !currentUser;

    if (userJustLoggedOut && previousUserRef.current) {
      const loggedOutStudentId = previousUserRef.current.id;
      console.log(`[AppDataContext] Logout detected for ${loggedOutStudentId}. Attempting to flush data.`);
      setLoadingData(true); 
      debouncedSave.flush().then(() => {
         console.log(`[AppDataContext] Data flush completed for ${loggedOutStudentId} during logout sequence.`);
      }).catch(error => {
        console.error(`[AppDataContext] Error flushing data on logout for ${loggedOutStudentId}:`, error);
      }).finally(() => {
        console.log(`[AppDataContext] Logout flush sequence finished for ${loggedOutStudentId}. Clearing appData for previous user.`);
        // Don't clear all appData, just potentially the data for the logged out user if it's still specifically cached
        // However, the next load for a new user will overwrite or fetch fresh data.
        // For simplicity now, let fetch handle the state.
        setLoadingData(false);
      });
    } else if (currentUser) {
      console.log(`[AppDataContext] Current user changed or logged in: ${currentUser.id}. Fetching data.`);
      setLoadingData(true);
      fetchDataFromServer(currentUser)
        .then(data => {
          console.log(`[AppDataContext] Data fetched for ${currentUser.id}, setting appData:`, data);
          setAppData(data);
        })
        .catch(error => console.error("[AppDataContext] Failed to load data on user change:", error))
        .finally(() => {
          console.log(`[AppDataContext] Finished fetching data for ${currentUser.id}.`);
          setLoadingData(false);
        });
    } else { 
      console.log("[AppDataContext] No current user. Clearing appData state.");
      setAppData({});
      setLoadingData(false);
    }

    previousUserRef.current = currentUser;
  }, [currentUser, debouncedSave]); 


  const updateAppData = (studentId: string, newStudentData: StudentData) => {
    console.log(`[AppDataContext] updateAppData called for studentId: ${studentId}`, newStudentData);
    setAppData(prevData => {
      const updatedData = {
        ...prevData,
        [studentId]: newStudentData,
      };
      console.log(`[AppDataContext] Scheduling save for studentId: ${studentId}. New data:`, newStudentData);
      debouncedSave(updatedData, studentId)
        .catch(error => {
          if (error !== "Cancelled due to new call" && error !== "Cancelled explicitly") {
            console.error("[AppDataContext] Debounced save call failed for updateAppData:", error);
          }
        });
      return updatedData;
    });
  };

  const saveStudentAttempt = (studentId: string, attempt: StudentRoundAttempt) => {
    console.log(`[AppDataContext] saveStudentAttempt called for studentId: ${studentId}, unit: ${attempt.unitId}, round: ${attempt.roundId}`);
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
      console.error("[AppDataContext] addOfflineGrade: Only a teacher can add grades.");
      return;
    }
    const studentId = gradeData.studentId;
    console.log(`[AppDataContext] addOfflineGrade called for studentId: ${studentId}, test: ${gradeData.testName}`);
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
      flushPendingSaves, 
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

// Removed the 'appDataLogoutCleanup' export as its logic is now within the main useEffect.
// The AuthContext should call 'flushPendingSaves' directly if needed *before* clearing its own state,
// but the useEffect watching currentUser should also handle the flush.
// For now, let's rely on the useEffect. If issues persist, we can make AuthContext call flushPendingSaves.
