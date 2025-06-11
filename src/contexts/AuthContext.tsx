
"use client";

import type { User } from '@/lib/types';
import { users as predefinedUsers } from '@/lib/data';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Client, Account } from 'appwrite';

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
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const appwriteUser = await account.get();
        console.log("[AuthContext] Appwrite session found:", appwriteUser);
        // Find corresponding user in our predefinedUsers
        const matchedUser = predefinedUsers.find(u => u.id === appwriteUser.$id);
        if (matchedUser) {
          const { password, ...userToStore } = matchedUser;
          setCurrentUser(userToStore);
          localStorage.setItem('currentUser', JSON.stringify(userToStore));
          console.log("[AuthContext] User set from active Appwrite session:", userToStore);
        } else {
          // Appwrite session exists, but user not in our local list. This is an edge case.
          // For now, clear Appwrite session and local storage.
          console.warn("[AuthContext] Appwrite session user not in predefined list. Logging out.");
          await account.deleteSession('current');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      } catch (error) {
        // No active Appwrite session, try loading from localStorage (e.g., if Appwrite session expired but local one didn't)
        // However, it's better to rely on Appwrite as the source of truth for session.
        // If no Appwrite session, treat as logged out.
        console.log("[AuthContext] No active Appwrite session or error fetching account.", error);
        localStorage.removeItem('currentUser'); // Clear potentially stale local user
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
        // First, try to log into Appwrite
        console.log(`[AuthContext] Attempting Appwrite login for: ${user.email}`);
        await account.createEmailPasswordSession(user.email, password_provided);
        console.log("[AuthContext] Appwrite login successful.");

        // If Appwrite login is successful, then set local state
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
      } catch (appwriteError) {
        console.error("[AuthContext] Appwrite login failed:", appwriteError);
        toast({ title: "Login Failed", description: "Could not establish session with authentication service.", variant: "destructive" });
        // Ensure user is logged out if Appwrite session fails
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        try { await account.deleteSession('current'); } catch (e) { /* ignore */ }
        setLoading(false);
        return false;
      }
    } else {
      toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
      setLoading(false);
      return false;
    }
  };

  const logout = async () => { // Made logout async
    setLoading(true);
    try {
      await account.deleteSession('current');
      console.log("[AuthContext] Appwrite session deleted.");
    } catch (error) {
      console.error("[AuthContext] Error deleting Appwrite session:", error);
      // Continue with local logout anyway
    } finally {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      router.push('/');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      setLoading(false);
    }
  };
  
  // Prevent access to /student or /teacher routes if not logged in or incorrect role
  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;
    if (!currentUser && (path.startsWith('/student') || path.startsWith('/teacher'))) {
      if(path !== "/") router.push('/'); // Avoid pushing to '/' if already there
    } else if (currentUser) {
      if (currentUser.role === 'student' && path.startsWith('/teacher')) {
        router.push('/student/dashboard');
      } else if (currentUser.role === 'teacher' && path.startsWith('/student')) {
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
