import React from 'react';
import classNames from 'classnames';
import { Card } from '@shanyewest/best-ball-scorecard.content.card';
import { Flex } from '@shanyewest/best-ball-scorecard.layouts.flex';
import { Heading } from '@shanyewest/best-ball-scorecard.typography.heading';
import { Text } from '@shanyewest/best-ball-scorecard.typography.text';
import { LabelValue } from '@shanyewest/best-ball-scorecard.data-display.label-value';
import type { ScoreSummaryTeamInfoType } from './score-summary-team-info-type.js';
import styles from './score-summary.module.scss';

/**
 * Props for the ScoreSummary component.
 */
export type ScoreSummaryProps = {
  /**
   * Information for the first team (Team A).
   */
  teamA: ScoreSummaryTeamInfoType;
  /**
   * Information for the second team (Team B).
   */
  teamB: ScoreSummaryTeamInfoType;
  /**
   * A descriptive string of the overall match conclusion.
   * This should clearly state the outcome, e.g., "Team A wins 3 & 2", "Match Halved".
   * @example "The Eagles win 3 & 2"
   */
  matchConclusion: string;
  /**
   * Optional title for the score summary card.
   * @default "Match Results"
   */
  title?: string;
  /**
   * Optional custom CSS class name for the root card element.
   */
  className?: string;
  /**
   * Optional inline styles for the root card element.
   */
  style?: React.CSSProperties;
};

/**
 * ScoreSummary component presents the final results and a concise summary of a 2-man team best ball match.
 * It prominently displays the total net scores for each team, clearly indicates the winning team,
 * and provides the overall match conclusion.
 */
export function ScoreSummary({
  teamA = {
    name: 'Team Alpha',
    players: ['Player One', 'Player Two'],
    score: 'N/A',
    isWinner: false,
  },
  teamB = {
    name: 'Team Bravo',
    players: ['Player Three', 'Player Four'],
    score: 'N/A',
    isWinner: false,
  },
  matchConclusion = 'Match Concluded',
  title = 'Match Results',
  className,
  style,
}: ScoreSummaryProps): React.JSX.Element {
  return (
    <Card
      title={title}
      variant="primary"
      className={classNames(styles.scoreSummaryCard, className)}
      style={style}
    >
      <Flex direction="column" gap="var(--spacing-large)" className={styles.contentWrapper}>
        <Heading level={2} visualLevel={2} className={styles.matchConclusion}>
          {matchConclusion}
        </Heading>

        <Flex
          direction="row"
          justifyContent="space-around"
          alignItems="stretch" // Stretch items to have same height if in a row
          gap="var(--spacing-medium)"
          wrap="wrap"
          className={styles.teamsContainer}
        >
          {/* Team A Summary */}
          <Flex
            direction="column"
            gap="var(--spacing-small)"
            className={classNames(styles.teamSection, { [styles.winner]: teamA.isWinner })}
          >
            <Heading level={4} visualLevel={4} className={styles.teamName}>
              {teamA.name}
            </Heading>
            <Text className={styles.teamPlayers}>{teamA.players.join(' & ')}</Text>
            <LabelValue
              label="Result:"
              value={teamA.score}
              layout="horizontal"
              className={styles.teamScoreLabelValue}
              labelProps={{ className: styles.scoreLabel }}
              valueProps={{ className: styles.scoreValue }}
            />
          </Flex>

          {/* Team B Summary */}
          <Flex
            direction="column"
            gap="var(--spacing-small)"
            className={classNames(styles.teamSection, { [styles.winner]: teamB.isWinner })}
          >
            <Heading level={4} visualLevel={4} className={styles.teamName}>
              {teamB.name}
            </Heading>
            <Text className={styles.teamPlayers}>{teamB.players.join(' & ')}</Text>
            <LabelValue
              label="Result:"
              value={teamB.score}
              layout="horizontal"
              className={styles.teamScoreLabelValue}
              labelProps={{ className: styles.scoreLabel }}
              valueProps={{ className: styles.scoreValue }}
            />
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}