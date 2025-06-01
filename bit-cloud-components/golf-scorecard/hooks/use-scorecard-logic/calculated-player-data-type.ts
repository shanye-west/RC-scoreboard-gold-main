import { Player } from './player-type.js';

/**
 * Represents a player along with their calculated strokes received for the match.
 * Strokes are determined relative to the lowest handicap player.
 * Inherits all properties from Player.
 * @property {number} strokesReceived - The number of strokes this player receives during the round.
 */
export type CalculatedPlayerData = Player & {
  strokesReceived: number;
};