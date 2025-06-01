/**
 * Overall status of the match.
 * @property {string} status - A human-readable string describing the match status (e.g., "Team A 2 Up", "All Square", "Team B wins 3 & 2").
 * @property {number} teamAWins - Total number of holes won by Team A.
 * @property {number} teamBWins - Total number of holes won by Team B.
 * @property {number} ties - Total number of tied holes.
 * @property {number} holesPlayed - Number of holes for which scores are complete enough to determine a winner/tie for the hole.
 * @property {number} teamAScore - Total best ball net score for Team A accumulated across all played holes.
 * @property {number} teamBScore - Total best ball net score for Team B accumulated across all played holes.
 */
export type MatchStatus = {
  status: string;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  holesPlayed: number;
  teamAScore: number;
  teamBScore: number;
};