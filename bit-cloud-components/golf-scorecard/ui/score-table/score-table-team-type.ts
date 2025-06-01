/**
 * Defines the structure for team data used in the ScoreTable.
 */
export interface ScoreTableTeamType {
  /**
   * A unique identifier for the team.
   */
  id: string;
  /**
   * The display name of the team.
   */
  name: string;
  /**
   * An array of player IDs who are members of this team.
   */
  playerIds: string[];
}