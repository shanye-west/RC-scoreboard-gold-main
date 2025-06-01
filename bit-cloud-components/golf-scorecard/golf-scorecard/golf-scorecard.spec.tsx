import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, type Mock } from 'vitest';

// Import the hook that needs to be mocked
import { useScorecardLogic } from '@shanyewest/golf-scorecard.hooks.use-scorecard-logic';

// Import the mocked components to get references to the mock functions
import { PlayerInput } from '@shanyewest/golf-scorecard.ui.player-input';
import { HoleScoreInput } from '@shanyewest/golf-scorecard.ui.hole-score-input';
import { ScoreTable } from '@shanyewest/golf-scorecard.ui.score-table';
import { ScoreSummary } from '@shanyewest/golf-scorecard.ui.score-summary';

// Import the component to be tested
import { GolfScorecard } from './golf-scorecard.js';
// Import the SCSS module for class names
import styles from './golf-scorecard.module.scss';

// Apply mocks using vi.mock - these need to be hoisted to the top
vi.mock('@shanyewest/golf-scorecard.ui.player-input', () => ({
  PlayerInput: vi.fn((props) => (
    <div data-testid="mock-player-input" className="mock-player-input">
      Mock Player Input
      {props.onPlayersChange && typeof props.onPlayersChange === 'function' && (
        <button onClick={() => props.onPlayersChange([])}>Simulate Player Change</button>
      )}
    </div>
  ))
}));

vi.mock('@shanyewest/golf-scorecard.ui.hole-score-input', () => ({
  HoleScoreInput: vi.fn((props) => (
    <div data-testid="mock-hole-score-input" className="mock-hole-score-input">
      Mock Hole Score Input - Hole: {props.holeNumber}
    </div>
  ))
}));

vi.mock('@shanyewest/golf-scorecard.ui.score-table', () => ({
  ScoreTable: vi.fn(() => <div data-testid="mock-score-table" className="mock-score-table">Mock Score Table</div>)
}));

vi.mock('@shanyewest/golf-scorecard.ui.score-summary', () => ({
  ScoreSummary: vi.fn(() => <div data-testid="mock-score-summary" className="mock-score-summary">Mock Score Summary</div>)
}));

vi.mock('@shanyewest/best-ball-scorecard.actions.theme-toggler', () => ({
  ThemeToggler: vi.fn(() => <div data-testid="mock-theme-toggler" className="mock-theme-toggler">Mock Theme Toggler</div>)
}));

// Mock the useScorecardLogic hook
vi.mock('@shanyewest/golf-scorecard.hooks.use-scorecard-logic', () => ({
  useScorecardLogic: vi.fn(),
}));


// Helper to create mock player data for the hook's return value
const createMockCalculatedPlayer = (id: string, name: string, handicap: number, teamId: 'A' | 'B') => ({
  id, name, courseHandicap: handicap, teamId, strokesReceived: 0
});

describe('GolfScorecard', () => {
  beforeEach(() => {
    // Clear all mocks before each test to ensure isolation
    vi.clearAllMocks();

    // Set the default mock return value for useScorecardLogic
    // This represents the initial state where no players are set.
    (useScorecardLogic as unknown as Mock).mockReturnValue({
      configuredPlayers: [],
      detailedHoleResults: [],
      matchStatus: { status: 'Match not started', teamAWins: 0, teamBWins: 0, ties: 0, holesPlayed: 0, teamAScore: 0, teamBScore: 0 },
      setPlayers: vi.fn(),
      updateScore: vi.fn(),
    });
  });

  it('should render the player setup section and instructions initially', () => {
    const { container, getByText } = render(
      <MemoryRouter>
        <GolfScorecard />
      </MemoryRouter>
    );

    // Assert that PlayerInput is rendered
    expect(PlayerInput).toHaveBeenCalled();
    const playerInputElement = container.querySelector('[data-testid="mock-player-input"]');
    expect(playerInputElement).toBeInTheDocument();

    // Assert that the setup instructions are visible
    const setupInstructions = container.querySelector(`.${styles.setupInstructions}`);
    expect(setupInstructions).toBeInTheDocument();
    // Using getByText for more robust text checking, assuming the text is within a paragraph or similar element.
    expect(getByText('Please enter names and course handicaps for all 4 players to begin scoring.')).toBeInTheDocument();


    // Assert that other game components (HoleScoreInput, ScoreTable, ScoreSummary) are NOT rendered
    expect(HoleScoreInput).not.toHaveBeenCalled();
    expect(ScoreTable).not.toHaveBeenCalled();
    expect(ScoreSummary).not.toHaveBeenCalled();
  });

  it('should render scoring and summary components when game is setup', () => {
    // Simulate the state where 4 players have been "set" via the hook
    (useScorecardLogic as unknown as Mock).mockReturnValue({
      configuredPlayers: [
        createMockCalculatedPlayer('p1', 'Player A1', 10, 'A'),
        createMockCalculatedPlayer('p2', 'Player A2', 12, 'A'),
        createMockCalculatedPlayer('p3', 'Player B1', 8, 'B'),
        createMockCalculatedPlayer('p4', 'Player B2', 15, 'B'),
      ],
      detailedHoleResults: [],
      matchStatus: { status: 'Match in progress...', teamAWins: 0, teamBWins: 0, ties: 0, holesPlayed: 0, teamAScore: 0, teamBScore: 0 },
      setPlayers: vi.fn(),
      updateScore: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <GolfScorecard />
      </MemoryRouter>
    );

    // Assert that the setup instructions are no longer visible
    const setupInstructions = container.querySelector(`.${styles.setupInstructions}`);
    expect(setupInstructions).not.toBeInTheDocument();

    // Assert that PlayerInput is still rendered (it's always there regardless of setup state)
    expect(PlayerInput).toHaveBeenCalled();
    expect(container.querySelector('[data-testid="mock-player-input"]')).toBeInTheDocument();

    // Assert that HoleScoreInput, ScoreSummary, and ScoreTable are NOW rendered
    expect(HoleScoreInput).toHaveBeenCalled();
    expect(container.querySelector('[data-testid="mock-hole-score-input"]')).toBeInTheDocument();
    expect(ScoreSummary).toHaveBeenCalled();
    expect(container.querySelector('[data-testid="mock-score-summary"]')).toBeInTheDocument();
    expect(ScoreTable).toHaveBeenCalled();
    expect(container.querySelector('[data-testid="mock-score-table"]')).toBeInTheDocument();
  });

  it('should pass correct `maxPlayers` and `minPlayers` props to PlayerInput', () => {
    render(
      <MemoryRouter>
        <GolfScorecard />
      </MemoryRouter>
    );

    // Verify that PlayerInput was called with the expected maxPlayers and minPlayers props
    // We use expect.objectContaining to check only the relevant props.
    expect(PlayerInput).toHaveBeenCalledWith(
      expect.objectContaining({
        maxPlayers: 4,
        minPlayers: 4,
        onPlayersChange: expect.any(Function), // Ensure the callback is passed
        initialPlayers: expect.any(Array), // The component also passes initialPlayers
      }),
      undefined // React components don't necessarily have a second argument
    );
  });
});