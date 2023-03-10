export type CardRef = {
  card: HTMLDivElement | null;
  cardContainer: HTMLDivElement | null;
  cardShadow: HTMLDivElement | null;
  getId: () => number;

  /**
   * Start floating animation using this function
   * TODO: Have to do this because of dealing animation. Find a better way
   */
  startFloatingAnimation: () => void;
};

export type ConfigCardProps = {
  /**
   * Make the card floating up and down
   * @default true
   */
  cardFloating?: boolean;

  /**
   * Difference in distance in pixels between the cards' highest and lowest positions
   */
  cardFloatingDelta: number;

  /**
   * Time in seconds for the card to finish a floating routine (low -> high -> low)
   */
  cardFloatingTime: number;

  /**
   * Size of the card
   */
  size?: { width: number; height: number };
};

export interface CardProps extends ConfigCardProps {
  /**
   * Id of the card
   */
  id: number;

  /**
   * Back image for the card
   */
  backImage?: string;

  /**
   * Front image for the card
   */
  frontImage?: string;

  /**
   * Enable or disable debug mode
   * @default false
   */
  debug?: boolean;
}
