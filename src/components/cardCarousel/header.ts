import { CardRef, ConfigCardProps } from "../card/header";

export type CardCarouselProps = {
  /**
   * Element to handle interactions (touch, move, etc.)
   */
  interactionContainerRef: HTMLElement | null;

  /**
   * Number of cards to display
   */
  numberOfCards: number;

  /**
   * Auto rotate the carousel when there's no interaction
   * @default true
   */
  autoRotate?: boolean;

  /**
   * Time in seconds to finish 1 round of rotation in auto rotation mode
   */
  autoRotateTime: number;

  /**
   * Allow using mouse or finger to move the carousel
   * @default true
   */
  manualRotate?: boolean;

  /**
   * Distance in pixels required to drag the carousel (by mouse, hand, etc.) for it to finish 1 round of rotation in manual rotation mode
   */
  manualRotateDistance: number;

  /**
   * Distance in pixels of the cards from the center of the carousel
   */
  cardDistance: number;

  /**
   * Allow the nearest card to snap (face straight toward the screen)
   * @default false
   */
  cardSnapping?: boolean;

  /**
   * Time in seconds to finish 1 hypothetical round of rotation used when the card is snapping
   */
  cardSnappingTime: number;

  /**
   * Max FPS to render (not very accurate). The default is unlimited
   */
  maxFramerate?: number;

  /**
   * Other configuration options in the Card component
   */
  cardProps: ConfigCardProps;

  /**
   * Enable or disable debug mode
   * @default false
   */
  debug?: boolean;
};

export type Cursor = {
  x: number;
  y: number;

  /**
   * The cursor is currently being pressed (down) or not (up), or
   * the finger is currently touching the screen or not
   */
  pressed: boolean;
};

export type Snapping = {
  state: "pre_snapping" | "snapping" | "done_snapping";
  goal: number;
  snappedCard?: CardRef | null;
};

export type Revealing = {
  state: "pre_revealing" | "revealing" | "done_revealing" | "unrevealing";
  revealId: number | undefined;
  cardRevealAnimations: Animation[];
};

export type Click = {
  downCursor: Cursor | null;

  /**
   * One of the cards is currently being clicked on or not, i.e.,
   * the cursor down and up positions are on a same card
   */
  clicked: boolean;
  clickedCardId?: number;
};

/**
 * Difference in pixels between the cursor's up and down positions to be reconigned as a click
 */
export const CLICK_PIXEL_THRESHOLD = 2;
