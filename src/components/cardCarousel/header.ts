import { AnimationControls } from "../../homebrew-waapi-assistant/controls";
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
   * If manualRotate is true, the carousel will be scrolled kinetically
   * @default true
   */
  kineticRotate?: boolean;

  /**
   * The higher the number, the heavier you feel when rotating the carousel and vice versa
   */
  kineticRotateWeight: number;

  /**
   * The higher the number, the slower the kinetic rotating stops and vice versa
   */
  kineticDecelerationRate: number;

  /**
   * Distance in pixels required to drag the carousel (by mouse, hand, etc.) for it to finish 1 round of rotation in manual rotation mode
   */
  manualRotateDistance: number;

  /**
   * Play the first (shuffling and/or dealing) animation at the start of the 'game'
   * @default true
   */
  firstAnimation?: boolean;

  /**
   * Play the shuffling animation at the start of the 'game'
   * @default true
   */
  shufflingAnimation?: boolean;

  /**
   * Run shuffling and dealing animation after dismissing a revealed card
   * @default true
   */
  redealingAnimation?: boolean;

  /**
   * Number of shuffles
   */
  numberOfShuffling: number;

  /**
   * Max distance in pixels to move the cards outward when shuffling
   */
  shufflingMaxDistance: number;

  /**
   * Height in pixels from the ground of the deck when shuffling
   */
  shufflingHeight: number;

  /**
   * Duration in seconds for a single shuffle
   */
  shufflingDuration: number;

  /**
   * Distance in pixels of the dealing deck from the center of the carousel
   */
  dealingDeckDistanceFromCenter: number;

  /**
   * Direction of the dealing card to travel from the user's perspective
   */
  dealingDirection: "toward" | "away";

  /**
   * Duration in seconds for a single card from the deck to the finish position
   */
  dealingDuration: number;

  /**
   * Delay in seconds between each dealed card
   */
  dealingDelay: number;

  /**
   * Height in pixels for the card to fly up when dealing
   */
  dealingFlyHeight: number;

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
   * Duraction in seconds fot the card to be revealed/unrevealed
   */
  cardRevealingDuration: number;

  /**
   * Distance in pixels from the nearest card (faces toward the screen) to the back of the carousel
   * so that only the cards whose position is in between can be revealed
   */
  cardRevealLimitDistance: number;

  /**
   * Skew angle in degree to make the cards look more aesthetic,
   * but don't skew them too much or the secrets will be revealed
   */
  cardSkew: number;

  /**
   * Max FPS to render (not very accurate). The default is unlimited
   */
  maxFramerate?: number;

  /**
   * Array of card contents (image urls) to be randomly chosen for each card
   */
  cardContents: string[];

  /**
   * If this function is available, it will be called to get the content for the revealed card
   * instead of randomly choosing from `cardContents`
   */
  getRevealedCardContent?: () => Promise<string>;

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

export type FirstAnimation = {
  state: "running" | "done_running";
};

export type Snapping = {
  state: "pre_snapping" | "snapping" | "done_snapping";
  goal: number;
  snappedCard?: CardRef | null;
};

export type Revealing = {
  state: "pre_revealing" | "revealing" | "done_revealing" | "unrevealing";
  revealId?: number;
  revealCard?: CardRef;
  cardRevealAnimation?: AnimationControls;
};

export type KineticTracking = {
  state: "no_kinetic_scrolling" | "kinetic_scrolling";
  velocity: number;
  amplitude: number;
  lastTime: number;
  lastPos: number;
  tracker?: NodeJS.Timer;
  goal: number;
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
export const CLICK_PIXEL_THRESHOLD = 5; // px

/**
 * Rate of cursor position tracking to calculate kinetic scrolling velocity
 */
export const KINETIC_TRACKING_RATE = 50; // ms

/**
 * Kinetic scrolling will stop completely if the carousel rotates slower than this
 */
export const KINETIC_STOP_DEGREE = 0.1; // deg

/**
 * Lower bound of the velocity for the carousel to start kinetic scrolling
 */
export const KINETIC_VELOCITY_LOWER_BOUND = 10; // deg/s

/**
 * Lower bound of the velocity for the carousel to start kinetic scrolling when snapping is enabled
 * Much higher than `KINETIC_VELOCITY_LOWER_BOUND` to spare some lower velocity scroll handling for snapping
 */
export const KINETIC_SNAPPING_VELOCITY_LOWER_BOUND = 300; // deg/s

/**
 * Degree in deg to skew the card just before it's finished being dealed
 */
export const DEALING_FINISH_SKEW_DEGREE = 60; //deg

/**
 * Transition time from other animation to shuffling animation for each card
 */
export const TO_SHUFFLING_DURATION = 300; // ms

/**
 * Delay between transition to shuffling animations
 */
export const TO_SHUFFLING_DELAY = 100; // ms

/**
 * Transition time from other animation to dealing animation
 */
export const TO_DEALING_DURATION = 600; // ms
