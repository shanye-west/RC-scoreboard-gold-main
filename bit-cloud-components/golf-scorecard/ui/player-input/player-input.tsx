import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Heading } from '@shanyewest/best-ball-scorecard.typography.heading';
import { NumberInput } from '@shanyewest/best-ball-scorecard.inputs.number-input';
import { Button } from '@shanyewest/best-ball-scorecard.actions.button';
import { Flex } from '@shanyewest/best-ball-scorecard.layouts.flex';
import { Card } from '@shanyewest/best-ball-scorecard.content.card';
import type { Player } from './player-type.js';
import styles from './player-input.module.scss';

const generateId = (): string => {
  return `player_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
};

export type PlayerInputProps = {
  /**
   * Optional array of initial players to populate the input fields.
   * Defaults to two empty players if not provided.
   */
  initialPlayers?: Player[];
  /**
   * Callback function triggered when the list of players changes.
   * Receives the updated array of players.
   */
  onPlayersChange?: (players: Player[]) => void;
  /**
   * The maximum number of players that can be added.
   * @default 4
   */
  maxPlayers?: number;
  /**
   * The minimum number of players required. Remove button will be hidden if count is at minPlayers.
   * @default 2
   */
  minPlayers?: number;
  /**
   * Optional CSS class name to apply to the root container of the component.
   */
  className?: string;
  /**
   * Optional inline styles to apply to the root container of the component.
   */
  style?: React.CSSProperties;
};

export function PlayerInput({
  initialPlayers,
  onPlayersChange,
  maxPlayers = 4,
  minPlayers = 2,
  className,
  style,
}: PlayerInputProps) {
  const [players, setPlayers] = useState<Player[]>(() => {
    if (initialPlayers && initialPlayers.length > 0) {
      return initialPlayers;
    }
    // Default to minPlayers empty player objects
    return Array.from({ length: minPlayers }, () => ({
      id: generateId(),
      name: '',
      handicap: NaN,
    }));
  });

  useEffect(() => {
    if (onPlayersChange) {
      onPlayersChange(players);
    }
  }, [players, onPlayersChange]);

  const handleAddPlayer = useCallback(() => {
    if (players.length < maxPlayers) {
      setPlayers((prevPlayers) => [
        ...prevPlayers,
        { id: generateId(), name: '', handicap: NaN },
      ]);
    }
  }, [players.length, maxPlayers]);

  const handleRemovePlayer = useCallback((idToRemove: string) => {
    if (players.length > minPlayers) {
      setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== idToRemove));
    }
  }, [players.length, minPlayers]);

  const handlePlayerNameChange = useCallback((idToUpdate: string, newName: string) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === idToUpdate ? { ...player, name: newName } : player
      )
    );
  }, []);

  const handlePlayerHandicapChange = useCallback((idToUpdate: string, newHandicap: number) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === idToUpdate ? { ...player, handicap: newHandicap } : player
      )
    );
  }, []);

  return (
    <Flex
      direction="column"
      gap="var(--spacing-large)"
      className={classNames(styles.playerInputContainer, className)}
      style={style}
    >
      <Heading level={2} visualLevel={3} className={styles.mainTitle}>
        Enter Player Details
      </Heading>
      <Flex direction="column" gap="var(--spacing-medium)" className={styles.playersList}>
        {players.map((player, index) => {
          const teamNumber = index < Math.ceil(maxPlayers / 2) ? 1 : 2;
          const playerLabel = `Player ${index + 1} (Team ${teamNumber})`;
          const nameInputId = `name-${player.id}`;
          const handicapInputId = `handicap-${player.id}`;

          return (
            <Card key={player.id} className={styles.playerCard} variant="secondary">
              <Flex
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                gap="var(--spacing-medium)"
                wrap="wrap"
                className={styles.playerRow}
              >
                <Flex direction="column" gap="var(--spacing-xsmall)" className={styles.inputGroup}>
                  <label htmlFor={nameInputId} className={styles.inputLabel}>
                    {playerLabel}
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                    placeholder="Enter Name"
                    className={styles.nameInput}
                  />
                </Flex>
                <Flex direction="column" gap="var(--spacing-xsmall)" className={styles.inputGroup}>
                  <label htmlFor={handicapInputId} className={styles.inputLabel}>
                    Course Handicap
                  </label>
                  <NumberInput
                    id={handicapInputId}
                    value={player.handicap}
                    onChange={(val) => handlePlayerHandicapChange(player.id, val)}
                    placeholder="HCP"
                    min={0}
                    max={54} // Common max handicap
                    step={1}
                    className={styles.handicapInput}
                    hideButtons
                    name={handicapInputId} // Name can be useful for forms, matches id
                  />
                </Flex>
                {players.length > minPlayers && (
                  <Button
                    onClick={() => handleRemovePlayer(player.id)}
                    appearance="tertiary"
                    className={styles.removeButton}
                    aria-label={`Remove ${playerLabel}`}
                  >
                    Remove
                  </Button>
                )}
              </Flex>
            </Card>
          );
        })}
      </Flex>
      {players.length < maxPlayers && (
        <Button onClick={handleAddPlayer} appearance="primary" className={styles.addButton}>
          Add Player
        </Button>
      )}
    </Flex>
  );
}