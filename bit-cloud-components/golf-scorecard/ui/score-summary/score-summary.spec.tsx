import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { ScoreSummary } from './score-summary.js';
import styles from './score-summary.module.scss';

describe('ScoreSummary', () => {
  const mockTeamA = {
    name: 'Team Alpha',
    players: ['Player One', 'Player Two'],
    score: '3 & 2',
    isWinner: true,
  };

  const mockTeamB = {
    name: 'Team Bravo',
    players: ['Player Three', 'Player Four'],
    score: 'Lost',
    isWinner: false,
  };

  const mockMatchConclusion = 'Team Alpha Wins the Match!';
  const mockTitle = 'Match Summary';

  it('should render the component with correct title and conclusion', () => {
    const { container } = render(
      <MemoryRouter>
        <ScoreSummary
          teamA={mockTeamA}
          teamB={mockTeamB}
          matchConclusion={mockMatchConclusion}
          title={mockTitle}
        />
      </MemoryRouter>
    );

    // The `title` prop of ScoreSummary is passed to the Card component,
    // which renders it using a Heading component (typically h3 with Card's own .title class).
    const cardTitleElement = container.querySelector(`.${styles.scoreSummaryCard} h3`);
    
    // The `matchConclusion` is rendered as an h2 with the .matchConclusion class.
    const matchConclusionElement = container.querySelector(`.${styles.matchConclusion}`);

    expect(cardTitleElement).toHaveTextContent(mockTitle);
    expect(matchConclusionElement).toHaveTextContent(mockMatchConclusion);
  });

  it('should display team names and scores correctly', () => {
    const { container } = render(
      <MemoryRouter>
        <ScoreSummary
          teamA={mockTeamA}
          teamB={mockTeamB}
          matchConclusion={mockMatchConclusion}
          title={mockTitle}
        />
      </MemoryRouter>
    );

    const teamASection = container.querySelectorAll(`.${styles.teamSection}`)[0];
    const teamBSection = container.querySelectorAll(`.${styles.teamSection}`)[1];

    expect(teamASection.querySelector(`.${styles.teamName}`)).toHaveTextContent(mockTeamA.name);
    expect(teamASection.querySelector(`.${styles.teamPlayers}`)).toHaveTextContent(mockTeamA.players.join(' & '));
    expect(teamASection.querySelector(`.${styles.scoreValue}`)).toHaveTextContent(mockTeamA.score);

    expect(teamBSection.querySelector(`.${styles.teamName}`)).toHaveTextContent(mockTeamB.name);
    expect(teamBSection.querySelector(`.${styles.teamPlayers}`)).toHaveTextContent(mockTeamB.players.join(' & '));
    expect(teamBSection.querySelector(`.${styles.scoreValue}`)).toHaveTextContent(mockTeamB.score);
  });

  it('should apply the winner class to the winning team', () => {
    const { container } = render(
      <MemoryRouter>
        <ScoreSummary
          teamA={mockTeamA}
          teamB={mockTeamB}
          matchConclusion={mockMatchConclusion}
          title={mockTitle}
        />
      </MemoryRouter>
    );

    const teamASection = container.querySelectorAll(`.${styles.teamSection}`)[0];
    const teamBSection = container.querySelectorAll(`.${styles.teamSection}`)[1];

    expect(teamASection).toHaveClass(styles.winner);
    expect(teamBSection).not.toHaveClass(styles.winner);
  });
});