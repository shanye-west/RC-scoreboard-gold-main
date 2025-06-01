/**
 * Represents a player in the scorecard.
 * @property {string} id - A unique identifier for the player.
 * @property {string} name - The name of the player.
 * @property {number} courseHandicap - The player's course handicap before adjustments.
 * @property {'A' | 'B'} teamId - The team the player belongs to.
 */
export type Player = {
  id: string;
  name: string;
  courseHandicap: number;
  teamId: 'A' | 'B';
};