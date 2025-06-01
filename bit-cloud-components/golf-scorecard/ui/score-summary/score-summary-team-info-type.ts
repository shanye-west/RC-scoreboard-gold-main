export type ScoreSummaryTeamInfoType = {
  /**
   * The name of the team.
   * @example "The Eagles"
   */
  name: string;
  /**
   * An array of player names in the team.
   * @example ["John Doe", "Jane Smith"]
   */
  players: string[];
  /**
   * The final score or match status for this team.
   * This represents the "total net score" for the team in the context of the match outcome.
   * @example "3 & 2"
   * @example "Winner"
   * @example "4 Down"
   */
  score: string;
  /**
   * Indicates if this team is the winner of the match.
   */
  isWinner: boolean;
};