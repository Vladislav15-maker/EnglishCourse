"use client";

import type { AppDataType, StudentRoundAttempt, StudentOfflineGrade, User, StudentData } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext'; // AuthContext will be used by AppDataProvider, not the other way for flush.
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

        appData[studentDocId] = {
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
           console.log(`[Appwrite] fetchDataFromServer: Attempting to create document for ${studentDocId} with permissions:`, permissions, "and data:", dataToSave);
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
        console.log(`[Appwrite] saveDataToServer: Document not found for ${studentId} during update. Attempting to create with permissions:`, permissions);
        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_STUDENT_DATA_COLLECTION_ID,
          studentId,
          dataForAppwrite,
          permissions
        );
        console.log(`[Appwrite] saveDataToServer: Document created successfully for ${studentId} after update attempt failed with 404.`);
      } catch (createError: any) {
        console.error(`[Appwrite] saveDataToServer: Error creating document for student ${studentId} in Appwrite (after 404 on update): Code: ${createError.code}, Message: ${createError.message}`, createError);
        throw createError;
      }
    } else {
      console.error(`[Appwrite] saveDataToServer: Error saving/updating student data ${studentId} to Appwrite: Code: ${error.code}, Message: ${error.message}`, error);
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
          console.log("[Debounce] Timeout expired. Calling function with last args:", lastArgs);
          func(...lastArgs)
            .then(resolve)
            .catch(reject);
          lastArgs = null;
        } else {
           console.log("[Debounce] Timeout expired, but no lastArgs to call function with.");
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
    console.log("[Debounce] Call cancelled explicitly.");
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
  flushPendingSaves: () => Promise<void>; // Expose flush
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [appData, setAppData] = useState<AppDataType>({});
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const previousUserRef = useRef<User | null>(null);

  const performSave = useCallback(async (dataToSave: AppDataType, studentIdToSave: string | null) => {
    if (!currentUser && !studentIdToSave) { // Allow saving if studentIdToSave is provided (e.g. during flush on logout)
      console.warn(`[AppDataContext] performSave: No current user and no explicit studentIdToSave. Aborting save.`);
      return;
    }
    const targetStudentId = studentIdToSave || (currentUser ? currentUser.id : null);

    if (!targetStudentId || !dataToSave[targetStudentId]) {
      console.warn(`[AppDataContext] performSave: No data or invalid studentId to persist. targetStudentId: ${targetStudentId}, dataToSave[targetStudentId] exists: ${!!dataToSave[targetStudentId]}`);
      return;
    }
    setIsSaving(true);
    console.log(`[AppDataContext] performSave: Starting save for studentId: ${targetStudentId}`, dataToSave[targetStudentId]);
    const dataForSpecificStudent: { [key: string]: StudentData } = {
      [targetStudentId]: dataToSave[targetStudentId]
    };
    try {
      await saveDataToServer(dataForSpecificStudent, targetStudentId);
      console.log(`[AppDataContext] performSave: Save successful for studentId: ${targetStudentId}`);
    } catch (error) {
      console.error(`[AppDataContext] performSave: Error saving data for ${targetStudentId}:`, error);
    } finally {
      setIsSaving(false);
      console.log(`[AppDataContext] performSave: Finished save attempt for studentId: ${targetStudentId}`);
    }
  }, [currentUser]);

  const debouncedSave = useCallback(
    debounce((dataToSave: AppDataType, studentIdToSave: string | null) => {
      console.log("[AppDataContext] Debounced function called. dataToSave keys:", Object.keys(dataToSave), "studentIdToSave:", studentIdToSave);
      return performSave(dataToSave, studentIdToSave);
    }, 2000), // Increased debounce time for testing, can be reduced later
    [performSave]
  );

  const flushPendingSaves = useCallback(async () => {
    const studentIdToFlush = previousUserRef.current ? previousUserRef.current.id : null;
    console.log(`[AppDataContext] Explicitly flushing pending saves for studentId: ${studentIdToFlush}... Current appData keys:`, Object.keys(appData));
    if (studentIdToFlush && appData[studentIdToFlush]) {
        // Pass a snapshot of the current appData to the flush mechanism
        await debouncedSave.flush(); // Debounce flush already uses lastArgs, which should be set by updateAppData
        console.log(`[AppDataContext] Explicit pending saves flushed for studentId: ${studentIdToFlush}.`);
    } else {
        console.log(`[AppDataContext] No specific student data to flush for studentId: ${studentIdToFlush} or appData for this student is missing.`);
        // Call flush anyway, it will do nothing if lastArgs is null
        await debouncedSave.flush();
    }
  }, [debouncedSave, appData]); // appData dependency for studentIdToFlush check

  useEffect(() => {
    const userJustLoggedOut = previousUserRef.current && !currentUser;

    if (userJustLoggedOut) {
      console.log(`[AppDataContext] Logout detected for ${previousUserRef.current?.id} by useEffect. CurrentUser is now null.`);
      // AuthContext is now responsible for calling flushPendingSaves *before* currentUser becomes null.
      // This useEffect will primarily clear local state after AuthContext has handled the save.
      setAppData({}); // Clear all data, new user will fetch fresh.
      setLoadingData(false); // No data to load for a null user.
      console.log("[AppDataContext] Cleared local appData due to logout.");
    } else if (currentUser) {
      // User logged in or changed
      if (previousUserRef.current?.id !== currentUser.id) {
          console.log(`[AppDataContext] User changed or logged in: ${currentUser.id}. Previous user: ${previousUserRef.current?.id}. Fetching data.`);
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
        // currentUser exists and is the same as previousUser.
        // This can happen on hot-reloads or if AuthContext re-verifies session.
        // No need to re-fetch if appData already has data for this user.
        if (!appData[currentUser.id]) {
            console.log(`[AppDataContext] currentUser is the same (${currentUser.id}), but no data in appData. Fetching.`);
            setLoadingData(true);
            fetchDataFromServer(currentUser)
                .then(data => {
                    console.log(`[AppDataContext] Data re-fetched for ${currentUser.id}, setting appData:`, data);
                    setAppData(data);
                })
                .catch(error => console.error("[AppDataContext] Failed to re-load data:", error))
                .finally(() => {
                    setLoadingData(false);
                });
        } else {
            // console.log(`[AppDataContext] currentUser is the same (${currentUser.id}), and data exists. No refetch needed.`);
            setLoadingData(false); // Ensure loading is false if no fetch occurs
        }
      }
    } else {
      // No current user, and wasn't a logout event (e.g., initial load, no session)
      console.log("[AppDataContext] No current user (initial load or session ended). Clearing appData state.");
      setAppData({});
      setLoadingData(false);
    }

    previousUserRef.current = currentUser;
  }, [currentUser]);


  const updateAppData = (studentId: string, newStudentData: StudentData) => {
    console.log(`[AppDataContext] updateAppData called for studentId: ${studentId}`, newStudentData);
    setAppData(prevData => {
      const updatedData = {
        ...prevData,
        [studentId]: newStudentData,
      };
      // Pass the studentId explicitly to debouncedSave so it knows which part of `updatedData` to save.
      // The debouncedSave's `performSave` will use this studentId.
      console.log(`[AppDataContext] Scheduling save for studentId: ${studentId}. New full data state being passed to debouncer:`, updatedData);
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
    if (!currentUser || currentUser.id !== studentId) {
        console.warn(`[AppDataContext] saveStudentAttempt called for ${studentId}, but current user is ${currentUser?.id}. Ignoring.`);
        return;
    }
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
