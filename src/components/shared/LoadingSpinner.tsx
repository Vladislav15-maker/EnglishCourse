import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC<{ text?: string; className?: string }> = ({ text = "Loading...", className }) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${className}`}>
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
