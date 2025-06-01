import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScoreTable } from './score-table.js';
import styles from './score-table.module.scss';
import type { ScoreTableHoleType, ScoreTablePlayerType, ScoreTableTeamType } from './index.js';

const mockHoles: ScoreTableHoleType[] = [
  { holeNumber: 1, par: 4, strokeIndex: 7 },
  { holeNumber: 2, par: 3, strokeIndex: 15 },
];

const mockPlayers: ScoreTablePlayerType[] = [
  { id: 'p1', name: 'Alice', teamId: 't1', courseHandicap: 10, holeScores: [{ gross: 5 }, { gross: 3 }] },
  { id: 'p2', name: 'Bob', teamId: 't1', courseHandicap: 18, holeScores: [{ gross: 6 }, { gross: 4 }] },
  { id: 'p3', name: 'Charlie', teamId: 't2', courseHandicap: 5, holeScores: [{ gross: 4 }, { gross: 3 }] }, // Lowest handicap
  { id: 'p4', name: 'Diana', teamId: 't2', courseHandicap: 22, holeScores: [{ gross: 7 }, { gross: 5 }] },
];

const mockTeams: ScoreTableTeamType[] = [
  { id: 't1', name: 'Team Eagles', playerIds: ['p1', 'p2'] },
  { id: 't2', name: 'Team Birdies', playerIds: ['p3', 'p4'] },
];

describe('ScoreTable', () => {
  it('renders the table title and core table structure', () => {
    const { container } = render(
      <MemoryRouter>
        <ScoreTable
          title="Match Play Scorecard"
          holes={mockHoles}
          players={mockPlayers}
          teams={mockTeams}
        />
      </MemoryRouter>
    );

    const titleElement = container.querySelector(`.${styles.titleHeading}`);
    expect(titleElement).toHaveTextContent('Match Play Scorecard');

    const tableElement = container.querySelector('table');
    expect(tableElement).toBeInTheDocument();
  });

  it('correctly calculates and displays player net scores including stroke indicators', () => {
    const { getByText, container } = render(
      <MemoryRouter>
        <ScoreTable
          holes={mockHoles}
          players={mockPlayers}
          teams={mockTeams}
        />
      </MemoryRouter>
    );
  
    // Find the row for Hole 1 by looking for the cell with '1' (hole number)
    // This is more robust than relying on DOM structure index if columns change.
    // We need to find the correct cells for Alice and Bob.
    // Alice (Net): HCP 10, SI 7. Gross 5. Strokes player receives = 10 - 5 = 5. Receives stroke on SI 1-5. SI 7 means no stroke. Net 5.
    // Bob (Net): HCP 18, SI 7. Gross 6. Strokes player receives = 18 - 5 = 13. Receives stroke on SI 1-13. SI 7 means stroke. Net 6-1=5.
  
    // A more robust way to find cells is by column headers if possible, or by data-testid attributes.
    // For now, relying on text content within specific parts of the row:
    const rows = container.querySelectorAll('tbody tr');
    const hole1Row = Array.from(rows).find(row => (row as HTMLTableRowElement).cells[0].textContent === '1');
  
    expect(hole1Row).toBeInTheDocument();
  
    if (hole1Row) {
      // Alice's net score cell - assuming order: Hole, Par, SI, Alice Gross, Alice Net ...
      const aliceNetCell = (hole1Row as HTMLTableRowElement).cells[4]; // 5th cell
      expect(aliceNetCell).toHaveTextContent('5'); // Just '5', no asterisk
      expect(aliceNetCell.querySelector(`.${styles.strokeAppliedIndicator}`)).toBeNull();
  
      // Bob's net score cell - assuming order: ..., Bob Gross, Bob Net ...
      const bobNetCell = (hole1Row as HTMLTableRowElement).cells[6]; // 7th cell
      // The text content of the cell will be '5*' because Text component renders children.
      expect(bobNetCell.textContent).toBe('5*');
      expect(bobNetCell.querySelector(`.${styles.strokeAppliedIndicator}`)).toBeInTheDocument();
    }
  });

  it('correctly calculates and displays team best ball scores', () => {
    const { container } = render(
      <MemoryRouter>
        <ScoreTable
          holes={mockHoles}
          players={mockPlayers}
          teams={mockTeams}
        />
      </MemoryRouter>
    );

    const rows = container.querySelectorAll('tbody tr');
    const hole1Row = Array.from(rows).find(row => (row as HTMLTableRowElement).cells[0].textContent === '1');
    
    expect(hole1Row).toBeInTheDocument();

    if (hole1Row) {
      // Team Eagles (Alice & Bob) on Hole 1:
      // Alice: Gross 5, Net 5
      // Bob: Gross 6, Net 5
      // Team Eagles Best Gross: min(5, 6) = 5
      // Team Eagles Best Net: min(5, 5) = 5

      // Column indices: Hole(0), Par(1), SI(2)
      // P1 Gross(3), P1 Net(4)
      // P2 Gross(5), P2 Net(6)
      // P3 Gross(7), P3 Net(8)
      // P4 Gross(9), P4 Net(10)
      // Team Eagles Best Gross (11), Team Eagles Best Net (12)
      const teamEaglesBestGrossCell = (hole1Row as HTMLTableRowElement).cells[11];
      expect(teamEaglesBestGrossCell).toHaveTextContent('5');

      const teamEaglesBestNetCell = (hole1Row as HTMLTableRowElement).cells[12];
      expect(teamEaglesBestNetCell).toHaveTextContent('5');
    }
  });
});