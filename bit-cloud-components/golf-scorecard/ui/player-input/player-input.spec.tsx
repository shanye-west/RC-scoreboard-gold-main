import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PlayerInput } from './player-input.js';
import styles from './player-input.module.scss';
import type { Player } from './player-type.js';

describe('PlayerInput', () => {
  it('should render with the default minimum number of players (2)', () => {
    const { container } = render(
      <MemoryRouter>
        <PlayerInput />
      </MemoryRouter>
    );
    expect(container.querySelectorAll(`.${styles.nameInput}`).length).toBe(2);
  });

  it('should correctly add a player when the "Add Player" button is clicked', () => {
    const { container } = render(
      <MemoryRouter>
        <PlayerInput minPlayers={2} maxPlayers={4} />
      </MemoryRouter>
    );
    const initialPlayerCount = container.querySelectorAll(`.${styles.nameInput}`).length;
    const addButton = container.querySelector(`.${styles.addButton}`) as HTMLButtonElement;
    fireEvent.click(addButton);
    const updatedPlayerCount = container.querySelectorAll(`.${styles.nameInput}`).length;
    expect(updatedPlayerCount).toBe(initialPlayerCount + 1);
  });

  it('should correctly remove a player when a "Remove" button is clicked', () => {
    const initialPlayers: Player[] = [
      { id: 'p1', name: 'Player A', handicap: 10 },
      { id: 'p2', name: 'Player B', handicap: 12 },
      { id: 'p3', name: 'Player C', handicap: 15 }, // Start with 3 players to enable removal
    ];
    const { container } = render(
      <MemoryRouter>
        <PlayerInput initialPlayers={initialPlayers} minPlayers={2} maxPlayers={4} />
      </MemoryRouter>
    );
    const initialPlayerCount = container.querySelectorAll(`.${styles.nameInput}`).length;
    const removeButton = container.querySelector(`.${styles.removeButton}`) as HTMLButtonElement;
    fireEvent.click(removeButton);
    const updatedPlayerCount = container.querySelectorAll(`.${styles.nameInput}`).length;
    expect(updatedPlayerCount).toBe(initialPlayerCount - 1);
  });
});