import { HoleInfo } from './hole-info-type.js';

/**
 * Represents a player's scoring result for a single hole.
 * @property {string} playerId - The ID of the player.
 * @property {number} [grossScore] - The player's gross score on the hole. Undefined if not entered.
 * @property {boolean} receivesStrokeOnHole - True if the player receives a handicap stroke on this hole.
 * @property {number} [netScore] - The player's net score on the hole (gross score minus any applied stroke). Undefined if gross score not entered.
 */
export type PlayerHoleResult = {
  playerId: string;
  grossScore?: number;
  receivesStrokeOnHole: boolean;
  netScore?: number;
};

/**
 * Represents a team's collective scoring result for a single hole.
 * @property {'A' | 'B'} teamId - The ID of the team.
 * @property {PlayerHoleResult[]} playerResults - An array of individual player results for this hole.
 * @property {number} [bestBallNetScore] - The team's best ball net score for this hole (lower of the two players' net scores). Undefined if not all scores entered for the team.
 */
export type TeamHoleResult = {
  teamId: 'A' | 'B';
  playerResults: PlayerHoleResult[];
  bestBallNetScore?: number;
};

/**
 * Comprehensive scoring details for a single hole.
 * @property {number} holeNumber - The hole number.
 * @property {HoleInfo} holeInfo - The handicap rating and other static info for this hole.
 * @property {TeamHoleResult} teamAResult - Scoring results for Team A on this hole.
 * @property {TeamHoleResult} teamBResult - Scoring results for Team B on this hole.
 * @property {'A' | 'B' | 'Tie'} [winningTeam] - Indicates which team won the hole, or if it was a tie. Undefined if scores are incomplete for either team.
 */
export type HoleResultDetails = {
  holeNumber: number;
  holeInfo: HoleInfo;
  teamAResult: TeamHoleResult;
  teamBResult: TeamHoleResult;
  winningTeam?: 'A' | 'B' | 'Tie';
};