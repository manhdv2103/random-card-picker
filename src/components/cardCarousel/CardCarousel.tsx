import { useCallback, useEffect, useRef, useState } from "react";
import Card, { CardRef, ConfigCardProps, extractCardId } from "../card/Card";
import "./CardCarousel.css";

type CardCarouselProps = {
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

type Cursor = { x: number; y: number; pressed: boolean };

type Snapping = {
  state: "pre_snapping" | "snapping" | "done_snapping";
  goal: number;
  snappedCard?: CardRef | null;
};

type Reveal = {
  state: "pre_revealing" | "revealing" | "done_revealing";
  revealId: number | undefined;
  cardRevealAnimations: Animation[];
};

type Click = {
  downCursor: Cursor | null;
  clicked: boolean;
  clickedCardId?: number;
};

function CardCarousel({
  interactionContainerRef,
  numberOfCards,
  autoRotate = true,
  autoRotateTime,
  manualRotate = true,
  manualRotateDistance,
  cardDistance,
  cardSnapping,
  cardSnappingTime,
  maxFramerate,
  cardProps,
  debug,
}: CardCarouselProps) {
  const [carousel, setCarousel] = useState<HTMLDivElement | null>();
  const cardsRef = useRef<(CardRef | null)[]>([]);

  const frameIdRef = useRef<number | null>();
  const lastTimeRef = useRef<number>(0);
  const lastCarouselDegreeRef = useRef<number>(0);

  const cursorRef = useRef<Cursor>({ x: 0, y: 0, pressed: false });
  const lastCursorRef = useRef<Cursor | null>(null);
  const clickRef = useRef<Click>({ downCursor: null, clicked: false });

  const snappingRef = useRef<Snapping>({ state: "pre_snapping", goal: 0 });
  const revealRef = useRef<Reveal>({
    state: "pre_revealing",
    revealId: undefined,
    cardRevealAnimations: [],
  });

  const handleCarousel = useCallback(
    (el: HTMLDivElement) => setCarousel(el),
    []
  );

  const handleCard = useCallback((el: CardRef | null, i: number) => {
    cardsRef.current[i] = el;
  }, []);

  useEffect(() => {
    cardsRef.current = cardsRef.current.slice(0, numberOfCards);
  }, [numberOfCards]);

  useEffect(() => {
    if (!interactionContainerRef) return;

    const handleTouch = (e: MouseEvent | TouchEvent) => {
      const touchPoint = "changedTouches" in e ? e.changedTouches[0] : e;
      cursorRef.current = {
        x: touchPoint.clientX,
        y: touchPoint.clientY,
        pressed: true,
      };

      clickRef.current.downCursor = cursorRef.current;

      if (e.target instanceof Element) {
        clickRef.current.clickedCardId = extractCardId(e.target);
      }
    };
    const handleTouchMove = (e: MouseEvent | TouchEvent) => {
      const touchPoint = "changedTouches" in e ? e.changedTouches[0] : e;
      cursorRef.current = {
        ...cursorRef.current,
        x: touchPoint.clientX,
        y: touchPoint.clientY,
      };
    };
    const handleUntouch = () => {
      cursorRef.current = { ...cursorRef.current, pressed: false };
      lastCursorRef.current = null;
    };

    interactionContainerRef.addEventListener("mousedown", handleTouch);
    interactionContainerRef.addEventListener("touchstart", handleTouch);
    interactionContainerRef.addEventListener("mousemove", handleTouchMove);
    interactionContainerRef.addEventListener("touchmove", handleTouchMove);
    interactionContainerRef.addEventListener("mouseup", handleUntouch);
    interactionContainerRef.addEventListener("touchend", handleUntouch);

    return () => {
      interactionContainerRef.removeEventListener("mousedown", handleTouch);
      interactionContainerRef.removeEventListener("touchstart", handleTouch);
      interactionContainerRef.removeEventListener("mousemove", handleTouchMove);
      interactionContainerRef.removeEventListener("touchmove", handleTouchMove);
      interactionContainerRef.removeEventListener("mouseup", handleUntouch);
      interactionContainerRef.removeEventListener("touchend", handleUntouch);
    };
  }, [interactionContainerRef]);

  // Main logic

  useEffect(() => {
    if (!carousel || !cardsRef.current.length) return;

    const carouselDegreePerMs = 360 / (autoRotateTime * 1000);
    const cardSingleAngle = 360 / numberOfCards;
    const carouselSnappingDegreePerMs = 360 / (cardSnappingTime * 1000);

    const tick: FrameRequestCallback = now => {
      frameIdRef.current = requestAnimationFrame(tick);

      const delta = now - lastTimeRef.current;

      if (maxFramerate && delta < 1000 / maxFramerate) return;

      lastTimeRef.current = now;

      let carouselDegree = lastCarouselDegreeRef.current;
      if (!cursorRef.current.pressed) {
        if (clickRef.current.clicked) {
          const cardRevealAnimations = revealRef.current.cardRevealAnimations;
          if (revealRef.current.revealId === undefined) {
            if (
              snappingRef.current.snappedCard &&
              clickRef.current.clickedCardId !== undefined
            ) {
              const snappedCard = snappingRef.current.snappedCard;
              const centerCardId = snappedCard.getId();
              const clickedCardId = clickRef.current.clickedCardId;

              // FIXME: handle card reveal when snapping is disabled
              // FIXME: reveal card in wrong direction if the mouse is out of the window when dragging the carousel
              // Only allow to reveal 3 cards nearest to the screen
              if (
                revealRef.current.state === "pre_revealing" &&
                (clickedCardId === centerCardId ||
                  clickedCardId === mod(centerCardId - 1, numberOfCards) ||
                  clickedCardId === mod(centerCardId + 1, numberOfCards))
              ) {
                const selectedCard = cardsRef.current.find(
                  card => card?.getId() === clickedCardId
                );

                revealRef.current.revealId = clickedCardId;
                revealRef.current.state = "revealing";

                // Find the nearest path for the selected card to travel to the front
                const centerCardIdAlternate =
                  Math.sign(centerCardId - clickedCardId) *
                  (centerCardId - numberOfCards);
                const cardAngle =
                  cardSingleAngle *
                  (Math.abs(clickedCardId - centerCardId) <=
                  Math.abs(clickedCardId - centerCardIdAlternate)
                    ? centerCardId
                    : centerCardIdAlternate);

                const cardContainerAnimation =
                  selectedCard?.cardContainer?.animate(
                    [
                      {
                        transform: `rotateY(${cardAngle}deg) translateZ(280px) translateY(-55px) rotateY(180deg)`,
                      },
                    ],
                    {
                      duration: 500,
                      fill: "forwards",
                      easing: "ease-in-out",
                    }
                  );
                const cardAnimation = selectedCard?.card?.animate(
                  [
                    {
                      transform: "translateY(0px)",
                    },
                  ],
                  {
                    duration: 500,
                    fill: "forwards",
                    easing: "ease-in-out",
                  }
                );
                const cardShadowAnimation = selectedCard?.cardShadow?.animate(
                  [
                    {
                      transform: `translateY(55px) ${
                        getComputedStyle(selectedCard.cardShadow).transform
                      }`,
                    },
                  ],
                  {
                    duration: 500,
                    fill: "forwards",
                    easing: "ease-in-out",
                  }
                );

                cardRevealAnimations.splice(0, cardRevealAnimations.length);
                if (cardContainerAnimation)
                  cardRevealAnimations.push(cardContainerAnimation);
                if (cardAnimation) cardRevealAnimations.push(cardAnimation);
                if (cardShadowAnimation)
                  cardRevealAnimations.push(cardShadowAnimation);

                cardRevealAnimations.forEach(animation => {
                  animation.onfinish = () =>
                    (revealRef.current.state = "done_revealing");
                });
              }
            }
          } else if (revealRef.current.state === "done_revealing") {
            cardRevealAnimations.forEach(animation => {
              animation.reverse();
              animation.onfinish = () =>
                (revealRef.current.state = "pre_revealing");
            });
            revealRef.current.revealId = undefined;
          }
          clickRef.current.clicked = false;
        } else if (autoRotate) {
          carouselDegree = mod(
            lastCarouselDegreeRef.current + carouselDegreePerMs * delta,
            360
          );
        } else if (cardSnapping) {
          const snappingState = snappingRef.current.state;
          if (snappingState !== "done_snapping") {
            let snappingGoal = snappingRef.current.goal;
            if (snappingState === "pre_snapping") {
              snappingGoal =
                Math.round(carouselDegree / cardSingleAngle) * cardSingleAngle;
              snappingRef.current = {
                state: "snapping",
                goal: snappingGoal,
              };
            }

            const goalDistance = snappingGoal - carouselDegree;
            const carouselSnappingDegree = carouselSnappingDegreePerMs * delta;

            if (Math.abs(goalDistance) >= carouselSnappingDegree) {
              carouselDegree = mod(
                lastCarouselDegreeRef.current +
                  Math.sign(goalDistance) * carouselSnappingDegree,
                360
              );
            } else {
              carouselDegree = mod(
                lastCarouselDegreeRef.current + goalDistance,
                360
              );

              snappingRef.current = {
                ...snappingRef.current,
                state: "done_snapping",
                snappedCard:
                  cardsRef.current[
                    (numberOfCards -
                      snappingRef.current.goal / (360 / numberOfCards)) %
                      numberOfCards
                  ],
              };
            }
          }
        }
      } else if (manualRotate) {
        const downCursor = clickRef.current.downCursor;

        if (
          downCursor &&
          Math.abs(downCursor.x - cursorRef.current.x) < 2 &&
          Math.abs(downCursor.y - cursorRef.current.y) < 2
        ) {
          clickRef.current.clicked = true;
        } else {
          clickRef.current.clicked = false;

          if (revealRef.current.revealId === undefined) {
            const cursorDelta = lastCursorRef.current
              ? cursorRef.current.x - lastCursorRef.current.x
              : 0;
            lastCursorRef.current = cursorRef.current;

            carouselDegree = mod(
              lastCarouselDegreeRef.current +
                (cursorDelta * 360) / manualRotateDistance,
              360
            );

            // prepare for card snapping
            if (cardSnapping) snappingRef.current.state = "pre_snapping";
          }
        }
      }

      lastCarouselDegreeRef.current = carouselDegree;
      carousel.style.transform = `rotateY(${carouselDegree}deg)`;

      // Render cards
      cardsRef.current.forEach((cardRef, i) => {
        if (revealRef.current.revealId === i) return;
        if (!cardRef?.cardContainer || !cardRef?.card || !cardRef?.cardShadow)
          return;

        const { cardContainer } = cardRef;

        const cardDegree = cardSingleAngle * i;
        cardContainer.style.transform = `rotateY(${cardDegree}deg) translateZ(${cardDistance}px) rotateY(-${
          cardDegree + carouselDegree
        }deg)`;
      });
    };
    frameIdRef.current = requestAnimationFrame(tick);

    return () => {
      frameIdRef.current && cancelAnimationFrame(frameIdRef.current);
    };
  }, [
    carousel,
    cardDistance,
    interactionContainerRef,
    numberOfCards,
    manualRotateDistance,
    maxFramerate,
    manualRotate,
    autoRotate,
    autoRotateTime,
    cardSnappingTime,
    cardSnapping,
  ]);

  return (
    <div ref={handleCarousel} className="card-carousel">
      {Array(numberOfCards)
        .fill(null) // placeholder
        .map((_, i) => (
          <Card
            key={i}
            id={i}
            ref={el => handleCard(el, i)}
            content={i + ""}
            {...cardProps}
          />
        ))}
      {debug && <div className="carousel-debug-plane" />}
    </div>
  );
}

export default CardCarousel;

const mod = (n: number, m: number) => ((n % m) + m) % m;
