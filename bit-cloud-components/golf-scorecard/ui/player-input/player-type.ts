export type Player = {
  /**
   * A unique identifier for the player.
   */
  id: string;
  /**
   * The name of the player.
   */
  name: string;
  /**
   * The course handicap of the player. Can be NaN if not yet set or input is cleared.
   */
  handicap: number;
};