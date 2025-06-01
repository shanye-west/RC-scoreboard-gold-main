import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ShanyewestTheme } from '@shanyewest/best-ball-scorecard.shanyewest-theme';
import { Flex } from '@shanyewest/best-ball-scorecard.layouts.flex';
import { Text } from '@shanyewest/best-ball-scorecard.typography.text';
import { PlayerInput } from './player-input.js';
import type { Player } from './player-type.js';

const compositionContainerStyle: React.CSSProperties = {
  padding: 'var(--spacing-large)',
  backgroundColor: 'var(--colors-surface-background)',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 'var(--spacing-xlarge)',
};

const compositionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--typography-font-family)',
  color: 'var(--colors-text-default)',
  fontSize: 'var(--typography-sizes-heading-h3)',
  textAlign: 'center',
  borderBottom: '1px solid var(--borders-default-color)',
  paddingBottom: 'var(--spacing-medium)',
  width: '100%',
  maxWidth: '700px',
  margin: '0 auto var(--spacing-large) auto',
};

const outputDataStyle: React.CSSProperties = {
  marginTop: 'var(--spacing-medium)',
  padding: 'var(--spacing-medium)',
  backgroundColor: 'var(--colors-surface-secondary)',
  borderRadius: 'var(--borders-radius-medium)',
  border: '1px solid var(--borders-default-color)',
  width: '100%',
  maxWidth: '700px',
  boxSizing: 'border-box',
  fontFamily: 'var(--typography-font-family)',
  fontSize: 'var(--typography-sizes-body-small)',
  color: 'var(--colors-text-secondary)',
  maxHeight: '200px',
  overflowY: 'auto',
};

export const DefaultPlayerInput = () => (
  <MemoryRouter>
    <ShanyewestTheme>
      <div style={compositionContainerStyle}>
        <h3 style={compositionTitleStyle}>Default Player Input (Min 2 Players)</h3>
        <PlayerInput />
      </div>
    </ShanyewestTheme>
  </MemoryRouter>
);

export const PlayerInputWithInitialData = () => {
  const initialPlayers: Player[] = [
    { id: 'p1', name: 'Alice Wonderland', handicap: 10 },
    { id: 'p2', name: 'Bob The Builder', handicap: 18 },
    { id: 'p3', name: 'Charlie Brown', handicap: 22 },
  ];

  const [currentPlayers, setCurrentPlayers] = useState<Player[]>(initialPlayers);

  const handlePlayersChange = (updatedPlayers: Player[]) => {
    console.log('Players updated:', updatedPlayers);
    setCurrentPlayers(updatedPlayers);
  };

  return (
    <MemoryRouter>
      <ShanyewestTheme>
        <div style={compositionContainerStyle}>
          <h3 style={compositionTitleStyle}>Player Input with Initial Data (3 Players)</h3>
          <PlayerInput
            initialPlayers={initialPlayers}
            onPlayersChange={handlePlayersChange}
            maxPlayers={4}
            minPlayers={1}
          />
          <div style={outputDataStyle}>
            <Text as="span" style={{ fontWeight: 'var(--typography-font-weight-bold)', color: 'var(--colors-text-primary)'}}>Current Players Data (Live Update):</Text>
            <pre>{JSON.stringify(currentPlayers, null, 2)}</pre>
          </div>
        </div>
      </ShanyewestTheme>
    </MemoryRouter>
  );
};

export const FullPlayerInput = () => {
  const initialFullPlayers: Player[] = [
    { id: 'plyr1', name: 'Golfer One', handicap: 5 },
    { id: 'plyr2', name: 'Player Two', handicap: 12 },
    { id: 'plyr3', name: 'Participant Three', handicap: 20 },
    { id: 'plyr4', name: 'User Four', handicap: 8 },
  ];
  const [playersData, setPlayersData] = useState<Player[]>(initialFullPlayers);

  return (
    <MemoryRouter>
      <ShanyewestTheme>
        <div style={compositionContainerStyle}>
          <h3 style={compositionTitleStyle}>Full Player Input (Max 4 Players)</h3>
          <PlayerInput
            initialPlayers={initialFullPlayers}
            onPlayersChange={(updatedPlayers) => {
              console.log('Full players data:', updatedPlayers);
              setPlayersData(updatedPlayers);
            }}
            maxPlayers={4}
            minPlayers={4}
          />
           <div style={outputDataStyle}>
            <Text as="span" style={{ fontWeight: 'var(--typography-font-weight-bold)', color: 'var(--colors-text-primary)'}}>Current Players Data (Live Update):</Text>
            <pre>{JSON.stringify(playersData, null, 2)}</pre>
          </div>
        </div>
      </ShanyewestTheme>
    </MemoryRouter>
  );
};