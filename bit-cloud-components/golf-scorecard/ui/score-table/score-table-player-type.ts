/**
 * Defines the structure for player data used in the ScoreTable.
 */
export interface ScoreTablePlayerType {
  /**
   * A unique identifier for the player.
   */
  id: string;
  /**
   * The display name of the player.
   */
  name: string;
  /**
   * The ID of the team this player belongs to.
   */
  teamId: string;
  /**
   * The player's course handicap.
   */
  courseHandicap: number;
  /**
   * An array of gross scores for each hole. The index of the array corresponds
   * to the hole index (e.g., `holeScores[0]` is for the first hole in the `holes` prop).
   * A `null` value indicates no score was recorded for that hole.
   */
  holeScores: Array<{ gross: number | null }>;
}