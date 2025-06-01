import React from 'react';
import { ShanyewestTheme } from '@shanyewest/best-ball-scorecard.shanyewest-theme';
import { ScoreSummary } from './score-summary.js';
import type { ScoreSummaryTeamInfoType } from './score-summary-team-info-type.js';

const commonWrapperStyle: React.CSSProperties = {
  padding: 'var(--spacing-large)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-xlarge)',
  alignItems: 'center',
  background: 'var(--colors-surface-background)',
};

/**
 * Demonstrates the ScoreSummary when Team Alpha wins the match decisively.
 */
export const TeamAlphaWinsSummary = () => {
  const teamAlpha: ScoreSummaryTeamInfoType = {
    name: 'The Eagles',
    players: ['Jordan Spieth', 'Justin Thomas'],
    score: '4 & 3',
    isWinner: true,
  };

  const teamBravo: ScoreSummaryTeamInfoType = {
    name: 'The Prowlers',
    players: ['Rory McIlroy', 'Scottie Scheffler'],
    score: 'Lost',
    isWinner: false,
  };

  return (
    <ShanyewestTheme>
      <div style={commonWrapperStyle}>
        <ScoreSummary
          teamA={teamAlpha}
          teamB={teamBravo}
          matchConclusion="The Eagles Soar to Victory: 4 & 3"
          title="Tournament Finals: Match Summary"
        />
      </div>
    </ShanyewestTheme>
  );
};

/**
 * Demonstrates the ScoreSummary when the match is halved (ends in a draw).
 */
export const MatchHalvedSummary = () => {
  const teamAces: ScoreSummaryTeamInfoType = {
    name: 'Team Aces',
    players: ['Tiger Woods', 'Phil Mickelson'],
    score: 'AS', // All Square
    isWinner: false, // Neither team is a "winner" in a halved match for highlighting purposes
  };

  const teamBirdies: ScoreSummaryTeamInfoType = {
    name: 'Team Birdies',
    players: ['Dustin Johnson', 'Brooks Koepka'],
    score: 'AS', // All Square
    isWinner: false,
  };

  return (
    <ShanyewestTheme>
      <div style={commonWrapperStyle}>
        <ScoreSummary
          teamA={teamAces}
          teamB={teamBirdies}
          matchConclusion="An Epic Battle Ends All Square!"
          title="Grudge Match: Final Result"
        />
      </div>
    </ShanyewestTheme>
  );
};

/**
 * Demonstrates the ScoreSummary with Team Bravo winning a close match,
 * showcasing longer player names and custom styling via the `style` prop.
 */
export const TeamBravoWinsCloseMatchWithCustomStyle = () => {
  const teamIronclad: ScoreSummaryTeamInfoType = {
    name: 'The Ironclad',
    players: ['Patrick Cantlay', 'Xander Schauffele'],
    score: 'Lost',
    isWinner: false,
  };

  const teamFinishers: ScoreSummaryTeamInfoType = {
    name: 'The Finishers',
    players: ['Jon Rahm', 'Collin Morikawa'],
    score: '1 UP',
    isWinner: true,
  };

  return (
    <ShanyewestTheme>
      <div style={commonWrapperStyle}>
        <ScoreSummary
          teamA={teamIronclad}
          teamB={teamFinishers}
          matchConclusion="The Finishers Clinch it on the 18th: 1 UP"
          title="Championship Semi-Final"
          style={{
            boxShadow: 'var(--effects-shadows-x-large)',
            border: `2px solid var(--colors-primary-default)`,
          }}
        />
      </div>
    </ShanyewestTheme>
  );
};