"use client";

import type { User } from '@/lib/types';
import { users as predefinedUsers } from '@/lib/data';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Client, Account, AppwriteException } from 'appwrite';
// import { useAppData } from './AppDataContext'; // Удалено это импортирование

const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68490a67000756367bee';

const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password_provided: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  // const appData = useAppData(); // Эта строка вызывала ошибку и была удалена

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const appwriteUser = await account.get();
        console.log("[AuthContext] Appwrite session found:", appwriteUser);
        const matchedUser = predefinedUsers.find(u => u.id === appwriteUser.$id);
        if (matchedUser) {
          const { password, ...userToStore } = matchedUser;
          setCurrentUser(userToStore);
          localStorage.setItem('currentUser', JSON.stringify(userToStore));
          console.log("[AuthContext] User set from active Appwrite session:", userToStore);
        } else {
          console.warn("[AuthContext] Appwrite session user not in predefined list. Logging out Appwrite session.");
          await account.deleteSession('current');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      } catch (error) {
        if (error instanceof AppwriteException && error.code === 401) {
             console.log("[AuthContext] No active Appwrite session (account.get() returned 401).");
        } else {
            console.error("[AuthContext] Error fetching Appwrite account during session check:", error);
        }
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);


  const login = async (username: string, password_provided: string): Promise<boolean> => {
    setLoading(true);
    const user = predefinedUsers.find(
      (u) => u.username === username && u.password === password_provided
    );

    if (user) {
      try {
        console.log(`[AuthContext] Attempting Appwrite login for: ${user.email} with id: ${user.id}`);
        await account.createEmailPasswordSession(user.email, password_provided);
        console.log("[AuthContext] Appwrite login successful.");

        const { password, ...userToStore } = user;
        setCurrentUser(userToStore);
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        toast({ title: "Login Successful", description: `Welcome, ${user.name}!` });

        if (user.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          router.push('/student/dashboard');
        }
        setLoading(false);
        return true;
      } catch (appwriteError: any) {
        // Выводим более подробную информацию об ошибке Appwrite
        console.error(`[AuthContext] Appwrite login failed for ${user.email}. Code: ${appwriteError.code}, Message: ${appwriteError.message}. Raw error:`, appwriteError);
        toast({ title: "Login Failed", description: appwriteError.message || "Could not establish session with authentication service.", variant: "destructive" });
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        try { await account.deleteSession('current'); } catch (e) { /* ignore if no session */ }
        setLoading(false);
        return false;
      }
    } else {
      toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    console.log("[AuthContext] Logout initiated.");
    // Прямой вызов appData.flushPendingSaves() здесь больше не нужен.
    // AppDataProvider.useEffect будет отслеживать currentUser и запускать flush,
    // когда currentUser станет null.

    const userLoggingOut = currentUser; // Запоминаем текущего пользователя для логирования

    setLoading(true); 
    try {
      await account.deleteSession('current');
      console.log("[AuthContext] Appwrite session deleted.");
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 401) {
        console.log("[AuthContext] No active Appwrite session to delete, or session already invalid.");
      } else {
        console.error("[AuthContext] Error deleting Appwrite session:", error);
      }
    } finally {
      setCurrentUser(null); // Это изменение вызовет useEffect в AppDataProvider
      localStorage.removeItem('currentUser');
      router.push('/');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      console.log(`[AuthContext] Local user state cleared for ${userLoggingOut?.id}, navigated to login.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;
    if (!currentUser && (path.startsWith('/student') || path.startsWith('/teacher'))) {
      if(path !== "/") {
        console.log("[AuthContext] No user, but on protected route. Redirecting to /");
        router.push('/');
      }
    } else if (currentUser) {
      if (currentUser.role === 'student' && path.startsWith('/teacher')) {
        console.log("[AuthContext] Student on teacher route. Redirecting to student dashboard.");
        router.push('/student/dashboard');
      } else if (currentUser.role === 'teacher' && path.startsWith('/student')) {
        console.log("[AuthContext] Teacher on student route. Redirecting to teacher dashboard.");
        router.push('/teacher/dashboard');
      }
    }
  }, [currentUser, loading, router]);


  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
