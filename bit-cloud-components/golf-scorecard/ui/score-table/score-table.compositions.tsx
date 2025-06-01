import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ShanyewestTheme } from '@shanyewest/best-ball-scorecard.shanyewest-theme';
import { ScoreTable } from './score-table.js';
import type { ScoreTableHoleType, ScoreTablePlayerType, ScoreTableTeamType } from './index.js';

const commonCompositionWrapperStyle: React.CSSProperties = {
  padding: 'var(--spacing-large)',
  backgroundColor: 'var(--colors-surface-background)',
  minHeight: '100vh',
};

// --- Composition 1: Basic 2v2 ScoreTable ---
const holesBasic: ScoreTableHoleType[] = [
  { holeNumber: 1, par: 4, strokeIndex: 7 },
  { holeNumber: 2, par: 3, strokeIndex: 15 },
  { holeNumber: 3, par: 5, strokeIndex: 3 },
  { holeNumber: 4, par: 4, strokeIndex: 9 },
];

const playersBasic: ScoreTablePlayerType[] = [
  { id: 'p1', name: 'Alice', teamId: 't1', courseHandicap: 10, holeScores: [{ gross: 5 }, { gross: 3 }, { gross: 6 }, { gross: 4 }] },
  { id: 'p2', name: 'Bob', teamId: 't1', courseHandicap: 18, holeScores: [{ gross: 6 }, { gross: 4 }, { gross: 5 }, { gross: 5 }] },
  { id: 'p3', name: 'Charlie', teamId: 't2', courseHandicap: 5, holeScores: [{ gross: 4 }, { gross: 3 }, { gross: 5 }, { gross: 4 }] }, // Lowest handicap
  { id: 'p4', name: 'Diana', teamId: 't2', courseHandicap: 22, holeScores: [{ gross: 7 }, { gross: 5 }, { gross: 7 }, { gross: 6 }] },
];

const teamsBasic: ScoreTableTeamType[] = [
  { id: 't1', name: 'Team Eagles', playerIds: ['p1', 'p2'] },
  { id: 't2', name: 'Team Birdies', playerIds: ['p3', 'p4'] },
];

export const BasicTwoVSTwoScoreTable = () => (
  <MemoryRouter>
    <ShanyewestTheme>
      <div style={commonCompositionWrapperStyle}>
        <ScoreTable
          title="Club Championship - Match 1"
          holes={holesBasic}
          players={playersBasic}
          teams={teamsBasic}
        />
      </div>
    </ShanyewestTheme>
  </MemoryRouter>
);

// --- Composition 2: In-Progress 9-Hole ScoreTable ---
const holesNineHole: ScoreTableHoleType[] = Array.from({ length: 9 }, (_, i) => ({
  holeNumber: i + 1,
  par: (i % 3) + 3, // Cycles par 3, 4, 5
  strokeIndex: [1, 13, 7, 17, 3, 11, 5, 15, 9][i], // Random-ish stroke indices
}));

const playersNineHole: ScoreTablePlayerType[] = [
  {
    id: 'pA', name: 'Player A', teamId: 'teamAlpha', courseHandicap: 8, // Lowest
    holeScores: [
      { gross: 4 }, { gross: 5 }, { gross: 3 }, { gross: 4 }, { gross: null },
      { gross: null }, { gross: null }, { gross: null }, { gross: null }
    ],
  },
  {
    id: 'pB', name: 'Player B', teamId: 'teamAlpha', courseHandicap: 16,
    holeScores: [
      { gross: 5 }, { gross: 6 }, { gross: 4 }, { gross: 5 }, { gross: 4 },
      { gross: null }, { gross: null }, { gross: null }, { gross: null }
    ],
  },
  {
    id: 'pC', name: 'Player C', teamId: 'teamBravo', courseHandicap: 12,
    holeScores: [
      { gross: 4 }, { gross: 4 }, { gross: 4 }, { gross: 5 }, { gross: 6 },
      { gross: null }, { gross: null }, { gross: null }, { gross: null }
    ],
  },
  {
    id: 'pD', name: 'Player D', teamId: 'teamBravo', courseHandicap: 24,
    holeScores: [
      { gross: 6 }, { gross: 7 }, { gross: 5 }, { gross: 6 }, { gross: 5 },
      { gross: 5 }, { gross: null }, { gross: null }, { gross: null }
    ],
  },
];

const teamsNineHole: ScoreTableTeamType[] = [
  { id: 'teamAlpha', name: 'Alpha Squad', playerIds: ['pA', 'pB'] },
  { id: 'teamBravo', name: 'Bravo Unit', playerIds: ['pC', 'pD'] },
];

export const InProgressNineHoleScoreTable = () => (
  <MemoryRouter>
    <ShanyewestTheme>
      <div style={commonCompositionWrapperStyle}>
        <ScoreTable
          title="Weekend Tourney - 9 Holes (In Progress)"
          holes={holesNineHole}
          players={playersNineHole}
          teams={teamsNineHole}
        />
      </div>
    </ShanyewestTheme>
  </MemoryRouter>
);

// --- Composition 3: ScoreTable with No Par Values and Custom Title ---
const holesNoPar: ScoreTableHoleType[] = [
  { holeNumber: 1, strokeIndex: 5 },
  { holeNumber: 2, strokeIndex: 13 },
  { holeNumber: 3, strokeIndex: 1 },
];

const playersNoPar: ScoreTablePlayerType[] = [
  { id: 'plr1', name: 'Sam', teamId: 'tmX', courseHandicap: 0, holeScores: [{ gross: 4 }, { gross: 5 }, { gross: 3 }] },
  { id: 'plr2', name: 'Nina', teamId: 'tmX', courseHandicap: 7, holeScores: [{ gross: 5 }, { gross: 6 }, { gross: 4 }] },
  { id: 'plr3', name: 'Omar', teamId: 'tmY', courseHandicap: 3, holeScores: [{ gross: 3 }, { gross: 5 }, { gross: 4 }] },
  { id: 'plr4', name: 'Pat', teamId: 'tmY', courseHandicap: 10, holeScores: [{ gross: 6 }, { gross: 5 }, { gross: 5 }] },
];

const teamsNoPar: ScoreTableTeamType[] = [
  { id: 'tmX', name: 'Team X', playerIds: ['plr1', 'plr2'] },
  { id: 'tmY', name: 'Team Y', playerIds: ['plr3', 'plr4'] },
];

export const ScoreTableNoParCustomTitle = () => (
  <MemoryRouter>
    <ShanyewestTheme>
      <div style={commonCompositionWrapperStyle}>
        <ScoreTable
          title="Friendly Skins Game (No Par Info)"
          holes={holesNoPar}
          players={playersNoPar}
          teams={teamsNoPar}
        />
      </div>
    </ShanyewestTheme>
  </MemoryRouter>
);