"use client";

import type { User } from '@/lib/types';
import { users as predefinedUsers } from '@/lib/data';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

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
    // Attempt to load user from localStorage on initial load
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem('currentUser');
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password_provided: string): Promise<boolean> => {
    setLoading(true);
    const user = predefinedUsers.find(
      (u) => u.username === username && u.password === password_provided
    );
    if (user) {
      const { password, ...userToStore } = user; // Don't store password
      setCurrentUser(userToStore);
      try {
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
      } catch (error) {
         console.error("Failed to save user to localStorage", error);
      }
      toast({ title: "Login Successful", description: `Welcome, ${user.name}!` });
      setLoading(false);
      if (user.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      return true;
    } else {
      toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
    router.push('/');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };
  
  // Prevent access to /student or /teacher routes if not logged in or incorrect role
  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname;
    if (!currentUser && (path.startsWith('/student') || path.startsWith('/teacher'))) {
      router.push('/');
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
