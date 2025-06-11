"use client";

import React from 'react';
import type { Word } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

interface WordDisplayCardProps {
  word: Word;
}

const WordDisplayCard: React.FC<WordDisplayCardProps> = ({ word }) => {
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Sorry, your browser does not support text to speech!');
    }
  };

  return (
    <Card className="w-full shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-3xl font-headline text-primary">{word.english}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => speak(word.english)} aria-label={`Listen to ${word.english}`}>
            <Volume2 className="h-6 w-6 text-accent-foreground hover:text-primary transition-colors" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-lg text-foreground">
          <span className="font-semibold">Russian:</span> {word.russian}
        </p>
        <p className="text-lg text-muted-foreground font-code">
          <span className="font-semibold font-body text-foreground">Transcription:</span> {word.transcription}
        </p>
      </CardContent>
    </Card>
  );
};

export default WordDisplayCard;
