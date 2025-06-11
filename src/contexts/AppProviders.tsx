"use client";

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppDataProvider } from './AppDataContext';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <AppDataProvider>
        {children}
      </AppDataProvider>
    </AuthProvider>
  );
};
