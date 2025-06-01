import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ShanyewestTheme } from '@shanyewest/best-ball-scorecard.shanyewest-theme';
import { HoleScoreInput } from './hole-score-input.js';
import type { PlayerInfo } from './player-info-type.js';

const mockPlayersTwo: PlayerInfo[] = [
  { id: 'p1', name: 'Shanye West' },
  { id: 'p2', name: 'Taylor Made' },
];

const mockPlayersFour: PlayerInfo[] = [
  { id: 'pA1', name: 'Jordan Spieth' },
  { id: 'pA2', name: 'Justin Thomas' },
  { id: 'pB1', name: 'Rory McIlroy' },
  { id: 'pB2', name: 'Scottie Scheffler' },
];

const CompositionWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    padding: 'var(--spacing-large)',
    fontFamily: 'var(--typography-font-family)',
    color: 'var(--colors-text-primary)',
    backgroundColor: 'var(--colors-surface-background)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--spacing-medium)',
    minHeight: 'calc(100vh - 40px)', // Account for potential Bit header
    boxSizing: 'border-box',
  }}>
    <h2 style={{
        fontSize: 'var(--typography-sizes-heading-h3)',
        color: 'var(--colors-text-default)',
        margin: '0 0 var(--spacing-medium) 0',
        textAlign: 'center'
    }}>{title}</h2>
    {children}
  </div>
);

export const BasicHoleScoreInput = () => {
  const [currentHole, setCurrentHole] = useState(9); // Mid-round
  const [scores, setScores] = useState<{ [playerId: string]: number }>({
    'p1': 4, // Example initial score for Shanye
    'p2': NaN, // Taylor's score not yet entered
  });

  const handleScoreChange = (playerId: string, score: number) => {
    setScores((prevScores) => ({
      ...prevScores,
      [playerId]: score,
    }));
  };

  const handlePreviousHole = () => {
    setCurrentHole((prev) => Math.max(1, prev - 1));
  };

  const handleNextHole = () => {
    setCurrentHole((prev) => Math.min(18, prev + 1));
  };

  return (
    <MemoryRouter>
      <ShanyewestTheme>
        <CompositionWrapper title={`Mid-Round Scores - Hole ${currentHole}`}>
          <HoleScoreInput
            holeNumber={currentHole}
            players={mockPlayersTwo}
            scores={scores}
            onScoreChange={handleScoreChange}
            onPreviousHole={handlePreviousHole}
            onNextHole={handleNextHole}
          />
           <div style={{ marginTop: 'var(--spacing-small)', fontSize: 'var(--typography-sizes-body-small)', color: 'var(--colors-text-secondary)', background: 'var(--colors-surface-secondary)', padding: 'var(--spacing-small)', borderRadius: 'var(--borders-radius-small)'}}>
            Player Scores: {mockPlayersTwo.map(p => `${p.name}: ${Number.isNaN(scores[p.id]) ? '-' : scores[p.id]}`).join(', ')}
          </div>
        </CompositionWrapper>
      </ShanyewestTheme>
    </MemoryRouter>
  );
};

export const FirstHoleForFourPlayers = () => {
  const [currentHole, setCurrentHole] = useState(1);
  const [scores, setScores] = useState<{ [playerId: string]: number }>(() =>
    Object.fromEntries(mockPlayersFour.map(player => [player.id, NaN]))
  );

  const handleScoreChange = (playerId: string, score: number) => {
    setScores((prevScores) => ({
      ...prevScores,
      [playerId]: score,
    }));
  };

  const handlePreviousHole = () => {
    setCurrentHole((prev) => Math.max(1, prev - 1));
  };

  const handleNextHole = () => {
    setCurrentHole((prev) => Math.min(18, prev + 1));
  };

  return (
    <MemoryRouter>
      <ShanyewestTheme>
        <CompositionWrapper title={`Starting the Round - Hole ${currentHole} (4 Players)`}>
          <HoleScoreInput
            holeNumber={currentHole}
            players={mockPlayersFour}
            scores={scores}
            onScoreChange={handleScoreChange}
            onPreviousHole={handlePreviousHole}
            onNextHole={handleNextHole}
          />
          <div style={{ marginTop: 'var(--spacing-small)', fontSize: 'var(--typography-sizes-body-small)', color: 'var(--colors-text-secondary)', background: 'var(--colors-surface-secondary)', padding: 'var(--spacing-small)', borderRadius: 'var(--borders-radius-small)', maxWidth: '400px', textAlign: 'center'}}>
            Player Scores: {mockPlayersFour.map(p => `${p.name}: ${Number.isNaN(scores[p.id]) ? '-' : scores[p.id]}`).join(' | ')}
          </div>
        </CompositionWrapper>
      </ShanyewestTheme>
    </MemoryRouter>
  );
};

export const LastHoleScoreInputWithScores = () => {
  const [currentHole, setCurrentHole] = useState(18);
  const [scores, setScores] = useState<{ [playerId: string]: number }>({
    'p1': 3, // Shanye finished strong
    'p2': 4, // Taylor too
  });

  const handleScoreChange = (playerId: string, score: number) => {
    setScores((prevScores) => ({
      ...prevScores,
      [playerId]: score,
    }));
  };

  const handlePreviousHole = () => {
    setCurrentHole((prev) => Math.max(1, prev - 1));
  };

  const handleNextHole = () => {
    // Already on hole 18, next button will be disabled
    setCurrentHole((prev) => Math.min(18, prev + 1));
  };

  return (
    <MemoryRouter>
      <ShanyewestTheme>
        <CompositionWrapper title={`Finishing Up - Hole ${currentHole} (Final Scores)`}>
          <HoleScoreInput
            holeNumber={currentHole}
            players={mockPlayersTwo}
            scores={scores}
            onScoreChange={handleScoreChange}
            onPreviousHole={handlePreviousHole}
            onNextHole={handleNextHole}
            maxScore={10} // Example of overriding min/max score
            minScore={1}
          />
          <div style={{ marginTop: 'var(--spacing-small)', fontSize: 'var(--typography-sizes-body-small)', color: 'var(--colors-text-secondary)', background: 'var(--colors-surface-secondary)', padding: 'var(--spacing-small)', borderRadius: 'var(--borders-radius-small)'}}>
            Player Scores: {mockPlayersTwo.map(p => `${p.name}: ${Number.isNaN(scores[p.id]) ? '-' : scores[p.id]}`).join(', ')}
          </div>
        </CompositionWrapper>
      </ShanyewestTheme>
    </MemoryRouter>
  );
};