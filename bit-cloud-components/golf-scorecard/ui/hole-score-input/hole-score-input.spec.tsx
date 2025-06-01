import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { HoleScoreInput } from './hole-score-input.js';
import type { PlayerInfo } from './player-info-type.js';
import styles from './hole-score-input.module.scss'; // Import styles for class names

const mockPlayers: PlayerInfo[] = [
  { id: 'p1', name: 'Player One' },
  { id: 'p2', name: 'Player Two' },
];

const mockScores = {
  p1: 4,
  p2: NaN,
};

describe('HoleScoreInput', () => {
  it('renders the correct hole number, player names, and input fields', () => {
    const { getByText } = render(
      <MemoryRouter>
        <HoleScoreInput
          holeNumber={7}
          players={mockPlayers}
          scores={mockScores}
          onScoreChange={vi.fn()}
          onPreviousHole={vi.fn()}
          onNextHole={vi.fn()}
        />
      </MemoryRouter>
    );

    // Assert hole number is displayed
    expect(getByText('Hole 7')).toBeInTheDocument();

    // Assert Player One's name is displayed
    expect(getByText('Player One')).toBeInTheDocument();

    // Assert Player One's input field is present
    // Find the row associated with "Player One"
    const playerOneRow = getByText('Player One').closest(`.${styles.playerScoreRow}`);
    expect(playerOneRow).toBeInTheDocument(); // Ensure the row itself is found
    // Find the input within that row
    const playerOneInput = playerOneRow?.querySelector('input[type="number"]');
    expect(playerOneInput).toBeInTheDocument();
  });

  it('calls onPreviousHole when "Previous" button is clicked and onNextHole when "Next" button is clicked', () => {
    const onPreviousHoleMock = vi.fn();
    const onNextHoleMock = vi.fn();

    const { getByText } = render(
      <MemoryRouter>
        <HoleScoreInput
          holeNumber={10}
          players={mockPlayers}
          scores={mockScores}
          onScoreChange={vi.fn()}
          onPreviousHole={onPreviousHoleMock}
          onNextHole={onNextHoleMock}
        />
      </MemoryRouter>
    );

    const previousButton = getByText('Previous');
    const nextButton = getByText('Next');

    fireEvent.click(previousButton);
    expect(onPreviousHoleMock).toHaveBeenCalledTimes(1);

    fireEvent.click(nextButton);
    expect(onNextHoleMock).toHaveBeenCalledTimes(1);
  });

  it('calls onScoreChange with correct player ID and value when score input changes', () => {
    const onScoreChangeMock = vi.fn();

    const { container } = render(
      <MemoryRouter>
        <HoleScoreInput
          holeNumber={1}
          players={mockPlayers}
          scores={mockScores}
          onScoreChange={onScoreChangeMock}
          onPreviousHole={vi.fn()}
          onNextHole={vi.fn()}
        />
      </MemoryRouter>
    );

    const playerTwoInput = container.querySelector(`.${styles.playerScoreRow}:nth-child(2) .${styles.scoreInputControl} input`) as HTMLInputElement;

    fireEvent.change(playerTwoInput, { target: { value: '5' } });
    expect(onScoreChangeMock).toHaveBeenCalledWith('p2', 5); // NumberInput should parse to number
  });

  it('disables Previous button on hole 1 and Next button on hole 18', () => {
    const { getByText, rerender } = render(
      <MemoryRouter>
        <HoleScoreInput
          holeNumber={1}
          players={mockPlayers}
          scores={mockScores}
          onScoreChange={vi.fn()}
          onPreviousHole={vi.fn()}
          onNextHole={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(getByText('Previous')).toBeDisabled();
    expect(getByText('Next')).not.toBeDisabled();

    rerender(
      <MemoryRouter>
        <HoleScoreInput
          holeNumber={18}
          players={mockPlayers}
          scores={mockScores}
          onScoreChange={vi.fn()}
          onPreviousHole={vi.fn()}
          onNextHole={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(getByText('Previous')).not.toBeDisabled();
    expect(getByText('Next')).toBeDisabled();
  });


  it('correctly displays initial scores, including NaN as empty', () => {
    const { container } = render(
      <MemoryRouter>
        <HoleScoreInput
          holeNumber={1}
          players={mockPlayers}
          scores={{ p1: 3, p2: NaN }}
          onScoreChange={vi.fn()}
          onPreviousHole={vi.fn()}
          onNextHole={vi.fn()}
        />
      </MemoryRouter>
    );
    const playerOneInput = container.querySelector(`.${styles.playerScoreRow}:nth-child(1) .${styles.scoreInputControl} input`) as HTMLInputElement;
    const playerTwoInput = container.querySelector(`.${styles.playerScoreRow}:nth-child(2) .${styles.scoreInputControl} input`) as HTMLInputElement;

    expect(playerOneInput.value).toBe('3');
    expect(playerTwoInput.value).toBe(''); // NaN should render as empty string in NumberInput
  });
});