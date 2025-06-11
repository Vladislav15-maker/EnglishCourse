"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { units } from '@/lib/data';
import WordDisplayCard from '@/components/student/WordDisplayCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit3 } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function LearnRoundPage() {
  const params = useParams();
  const router = useRouter();
  const { unitId, roundId } = params;

  const unit = units.find(u => u.id === unitId);
  const round = unit?.rounds.find(r => r.id === roundId);

  if (!unit || !round) {
    return <LoadingSpinner text="Loading content..." />;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>
      
      <div className="text-center">
        <h1 className="text-4xl font-extrabold font-headline text-primary tracking-tight">{unit.name} - {round.name}</h1>
        <p className="text-lg text-muted-foreground mt-1">Study these words carefully.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {round.words.map(word => (
          <WordDisplayCard key={word.id} word={word} />
        ))}
      </div>

      <div className="text-center mt-8">
        <Button 
          size="lg" 
          onClick={() => router.push(`/student/unit/${unitId}/round/${roundId}/test`)}
          className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Edit3 className="mr-2 h-5 w-5" /> Start Test
        </Button>
      </div>
    </div>
  );
}
