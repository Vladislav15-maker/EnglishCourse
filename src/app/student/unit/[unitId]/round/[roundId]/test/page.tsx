"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { units } from '@/lib/data';
import TestForm from '@/components/student/TestForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function TestRoundPage() {
  const params = useParams();
  const router = useRouter();
  const { unitId, roundId } = params;

  const unit = units.find(u => u.id === unitId);
  const round = unit?.rounds.find(r => r.id === roundId);

  if (!unit || !round) {
    return <LoadingSpinner text="Loading test..." />;
  }

  const handleTestComplete = (score: number) => {
    // Optionally, could show a summary here or redirect
    // For now, TestForm handles summary, and user can navigate back
    console.log(`Test completed for ${unit.name} - ${round.name} with score: ${score}%`);
  };

  return (
    <div className="space-y-8">
       <Button variant="outline" onClick={() => router.push('/student/dashboard')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="text-center">
        <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight">Test: {unit.name} - {round.name}</h1>
      </div>
      
      <TestForm 
        unitId={unit.id as string} 
        roundId={round.id as string} 
        words={round.words} 
        onTestComplete={handleTestComplete} 
      />
    </div>
  );
}
