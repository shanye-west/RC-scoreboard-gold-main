import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TwoManTeamBestBallScorecard from '../components/TwoManTeamBestBallScorecard';

// Mock the custom hook
vi.mock('../hooks/useBestBallScorecardLogic', () => ({
  useBestBallScorecardLogic: () => ({
    playerScores: [],
    teamScores: { aviator: [], producer: [] },
    aviatorPlayers: [
      { id: 1, name: 'John Doe', team: 'aviator', courseHandicap: 10 },
      { id: 2, name: 'Jane Smith', team: 'aviator', courseHandicap: 8 }
    ],
    producerPlayers: [
      { id: 3, name: 'Bob Wilson', team: 'producer', courseHandicap: 12 },
      { id: 4, name: 'Alice Brown', team: 'producer', courseHandicap: 6 }
    ],
    updatePlayerScore: vi.fn(),
    getPlayerTotal: vi.fn(() => 0),
    getTeamBestBallScore: vi.fn(() => undefined),
    getTeamTotal: vi.fn(() => 0),
    getMatchStatus: vi.fn(() => ({
      holesPlayed: 0,
      leadingTeam: null,
      holesUp: 0,
      matchPlayResult: 'AS'
    })),
    isBestScoreForTeam: vi.fn(() => false),
    getHandicapStrokes: vi.fn(() => 0),
    calculateNetScore: vi.fn((gross) => gross)
  })
}));

const mockProps = {
  roundId: 1,
  courseId: 1,
  holes: [
    { id: 1, hole_number: 1, par: 4, handicap: 10 },
    { id: 2, hole_number: 2, par: 3, handicap: 18 },
    { id: 3, hole_number: 3, par: 5, handicap: 2 }
  ],
  players: [
    { id: 1, name: 'John Doe', team: 'aviator' as const, courseHandicap: 10 },
    { id: 2, name: 'Jane Smith', team: 'aviator' as const, courseHandicap: 8 },
    { id: 3, name: 'Bob Wilson', team: 'producer' as const, courseHandicap: 12 },
    { id: 4, name: 'Alice Brown', team: 'producer' as const, courseHandicap: 6 }
  ],
  locked: false,
  onUpdateScores: vi.fn()
};

describe('TwoManTeamBestBallScorecard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the scorecard table', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Player')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should render hole headers correctly', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      // Check hole numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      
      // Check handicap indicators
      expect(screen.getByText('HCP 10')).toBeInTheDocument();
      expect(screen.getByText('HCP 18')).toBeInTheDocument();
      expect(screen.getByText('HCP 2')).toBeInTheDocument();
    });

    it('should render all player names', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    });

    it('should render team best ball rows', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      expect(screen.getByText('AVIATOR BEST BALL')).toBeInTheDocument();
      expect(screen.getByText('PRODUCER BEST BALL')).toBeInTheDocument();
    });

    it('should render match status section', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      expect(screen.getByText('Match Status')).toBeInTheDocument();
      expect(screen.getByText('All Square')).toBeInTheDocument();
    });
  });

  describe('interactivity', () => {
    it('should render score inputs when not locked', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      const scoreInputs = screen.getAllByRole('spinbutton');
      expect(scoreInputs.length).toBeGreaterThan(0);
      
      // Check that inputs are not disabled
      scoreInputs.forEach(input => {
        expect(input).not.toBeDisabled();
      });
    });

    it('should disable score inputs when locked', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} locked={true} />);
      
      const scoreInputs = screen.getAllByRole('spinbutton');
      scoreInputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it('should call updatePlayerScore when score input changes', async () => {
      const mockUpdatePlayerScore = vi.fn();
      
      // Override the mock for this test
      vi.mocked(require('../hooks/useBestBallScorecardLogic').useBestBallScorecardLogic).mockReturnValue({
        ...require('../hooks/useBestBallScorecardLogic').useBestBallScorecardLogic(),
        updatePlayerScore: mockUpdatePlayerScore
      });

      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      const scoreInputs = screen.getAllByRole('spinbutton');
      const firstInput = scoreInputs[0];
      
      fireEvent.change(firstInput, { target: { value: '4' } });
      
      await waitFor(() => {
        expect(mockUpdatePlayerScore).toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
      
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should have accessible score inputs', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      const scoreInputs = screen.getAllByRole('spinbutton');
      scoreInputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'number');
        expect(input).toHaveAttribute('min', '1');
        expect(input).toHaveAttribute('max', '15');
      });
    });
  });

  describe('responsive design', () => {
    it('should have horizontal scroll container', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      const wrapper = screen.getByRole('table').closest('.scorecard-table-wrapper');
      expect(wrapper).toHaveClass('scorecard-table-wrapper');
    });

    it('should apply proper CSS classes for styling', () => {
      render(<TwoManTeamBestBallScorecard {...mockProps} />);
      
      const container = screen.getByRole('table').closest('.scorecard-container');
      expect(container).toHaveClass('scorecard-container');
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('scorecard-table');
    });
  });
});
