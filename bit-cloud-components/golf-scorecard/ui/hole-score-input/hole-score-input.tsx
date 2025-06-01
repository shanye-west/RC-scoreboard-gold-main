import React from 'react';
import classNames from 'classnames';
import { Card } from '@shanyewest/best-ball-scorecard.content.card';
import { Flex } from '@shanyewest/best-ball-scorecard.layouts.flex';
import { Heading } from '@shanyewest/best-ball-scorecard.typography.heading';
import { Text } from '@shanyewest/best-ball-scorecard.typography.text';
import { NumberInput } from '@shanyewest/best-ball-scorecard.inputs.number-input';
import { Button } from '@shanyewest/best-ball-scorecard.actions.button';
import type { PlayerInfo } from './player-info-type.js';
import styles from './hole-score-input.module.scss';

export type HoleScoreInputProps = {
  /**
   * The current hole number being scored (typically 1-18).
   */
  holeNumber: number;
  /**
   * An array of player information objects. Each player will have a score input field.
   */
  players: PlayerInfo[];
  /**
   * An object mapping player IDs to their gross scores for the current hole.
   * Use `NaN` to represent an unentered or cleared score in the NumberInput.
   */
  scores: { [playerId: string]: number }; // NaN indicates empty/invalid
  /**
   * Callback function triggered when a player's score changes.
   * @param playerId - The ID of the player whose score changed.
   * @param score - The new score value (can be NaN if input is cleared/invalid).
   */
  onScoreChange: (playerId: string, score: number) => void;
  /**
   * Callback function triggered when the 'Previous' button is clicked.
   */
  onPreviousHole: () => void;
  /**
   * Callback function triggered when the 'Next' button is clicked.
   */
  onNextHole: () => void;
  /**
   * Optional CSS class name to apply to the root Card component.
   */
  className?: string;
  /**
   * Optional inline styles to apply to the root Card component.
   */
  style?: React.CSSProperties;
  /**
   * Minimum score allowed in the number input.
   * @default 1
   */
  minScore?: number;
  /**
   * Maximum score allowed in the number input.
   * @default 15
   */
  maxScore?: number;
};

/**
 * HoleScoreInput is a UI component for entering individual player scores for a specific golf hole.
 * It displays the current hole number, provides number input fields for each player's gross score,
 * and includes navigation buttons to move to the previous or next hole.
 * The component is designed for ease of use, especially on mobile devices, utilizing Card and Flex
 * for a structured and responsive layout.
 */
export function HoleScoreInput({
  holeNumber,
  players,
  scores,
  onScoreChange,
  onPreviousHole,
  onNextHole,
  className,
  style,
  minScore = 1,
  maxScore = 15,
}: HoleScoreInputProps): React.JSX.Element {
  return (
    <Card
      className={classNames(styles.holeScoreInput, className)}
      style={style}
      title={`Hole ${holeNumber}`}
    >
      <Flex direction="column" gap="var(--spacing-medium)" className={styles.contentWrapper}>
        <Flex
          direction="column"
          gap="var(--spacing-small)"
          className={styles.scoresContainer}
        >
          {players.map((player) => (
            <Flex
              key={player.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              className={styles.playerScoreRow}
            >
              <Text as="span" className={styles.playerName}>
                {player.name}
              </Text>
              <NumberInput
                id={`score-${holeNumber}-${player.id}`}
                value={scores[player.id] ?? NaN}
                onChange={(newScore) => onScoreChange(player.id, newScore)}
                placeholder="Score"
                min={minScore}
                max={maxScore}
                aria-label={`Score for ${player.name} on hole ${holeNumber}`}
                className={styles.scoreInputControl}
                hideButtons // Typically scores are typed, buttons can be clunky for this.
              />
            </Flex>
          ))}
        </Flex>

        <Flex
          direction="row"
          justifyContent="space-between"
          className={styles.navigationButtons}
        >
          <Button
            onClick={onPreviousHole}
            disabled={holeNumber <= 1}
            appearance="secondary"
          >
            Previous
          </Button>
          <Button
            onClick={onNextHole}
            disabled={holeNumber >= 18}
            appearance="primary"
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}