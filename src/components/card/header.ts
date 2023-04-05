export type CardRef = {
  elems: {
    card: HTMLDivElement;
    cardContainer: HTMLDivElement;
    cardShadow: HTMLDivElement;
  } | null;

  getId: () => number;

  /**
   * Start floating animation using this function
   * TODO: Have to do this because of dealing animation. Find a better way
   */
  startFloatingAnimation: () => void;

  /**
   * Stop floating animation using this function
   */
  stopFloatingAnimation: () => void;

  /**
   * Start shaking animation using this function
   */
  startShakingAnimation: () => void;

  /**
   * Stop shaking animation using this function
   */
  stopShakingAnimation: () => void;
};

/**
 * `CardRef` but the elems are not null
 */
export type SafeCardRef = CardRef & { elems: NonNullable<CardRef["elems"]> };

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
   * Time in seconds for the card to finish a floating routine (left -> right -> left)
   * The smaller the number, the more intensive the shaking is
   */
  cardShakingTime: number;

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
