import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ShanyewestTheme } from '@shanyewest/best-ball-scorecard.shanyewest-theme';
import { GolfScorecard } from "./golf-scorecard.js";

export const GolfScorecardApp = () => {
  return (
    <MemoryRouter>
      <ShanyewestTheme>
        <GolfScorecard />
      </ShanyewestTheme>
    </MemoryRouter>
  );
};