import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Cursor = {
  x: number;
  y: number;

  /**
   * The cursor is currently being pressed (down) or not (up), or
   * the finger is currently touching the screen or not
   */
  pressed: boolean;
};

type Snapping = {
  state: "pre_snapping" | "snapping" | "done_snapping";
  goal: number;
  snappedCard?: CardRef | null;
};

type Revealing = {
  state: "pre_revealing" | "revealing" | "done_revealing" | "unrevealing";
  revealId: number | undefined;
  cardRevealAnimations: Animation[];
};

type Click = {
  downCursor: Cursor | null;

  /**
   * One of the cards is currently being clicked on or not, i.e.,
   * the cursor down and up positions are on a same card
   */
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
  // Element refs
  const [carousel, setCarousel] = useState<HTMLDivElement | null>();
  const cardsRef = useRef<(CardRef | null)[]>([]);

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

  // State refs
  const frameIdRef = useRef<number | null>();
  const lastTimeRef = useRef<number>(0);
  const lastCarouselDegreeRef = useRef<number>(0);

  const cursorRef = useRef<Cursor>({ x: 0, y: 0, pressed: false });
  const lastCursorRef = useRef<Cursor | null>(null);
  const clickRef = useRef<Click>({ downCursor: null, clicked: false });

  const snappingRef = useRef<Snapping>({ state: "pre_snapping", goal: 0 });
  const revealingRef = useRef<Revealing>({
    state: "pre_revealing",
    revealId: undefined,
    cardRevealAnimations: [],
  });

  // Derived states
  const { carouselDegreePerMs, cardSingleAngle, carouselSnappingDegreePerMs } =
    useMemo(() => {
      const carouselDegreePerMs = 360 / (autoRotateTime * 1000);
      const cardSingleAngle = 360 / numberOfCards;
      const carouselSnappingDegreePerMs = 360 / (cardSnappingTime * 1000);

      return {
        carouselDegreePerMs,
        cardSingleAngle,
        carouselSnappingDegreePerMs,
      };
    }, [autoRotateTime, cardSnappingTime, numberOfCards]);

  // Interaction handling
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

  const handleSnap = useCallback(
    (delta: number, carouselDegree: number): number => {
      const snapping = snappingRef.current;

      switch (snapping.state) {
        case "pre_snapping":
          snapping.goal =
            Math.round(carouselDegree / cardSingleAngle) * cardSingleAngle;
          snapping.state = "snapping";
          break;
        case "snapping":
          const goalDistance = snapping.goal - carouselDegree;
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

            snapping.snappedCard =
              cardsRef.current[
                (numberOfCards -
                  snappingRef.current.goal / (360 / numberOfCards)) %
                  numberOfCards
              ];
            snapping.state = "done_snapping";
          }
          break;
        case "done_snapping": // do nothing
      }

      return carouselDegree;
    },
    [cardSingleAngle, carouselSnappingDegreePerMs, numberOfCards]
  );

  // Card reveal handling
  const handleReveal = useCallback(() => {
    const revealing = revealingRef.current;

    // FIXME: handle card reveal when autoRotate is enable
    // Maybe pause the carousel when revealing and continue rotating when not

    switch (revealing.state) {
      case "pre_revealing":
        const clickedCardId = clickRef.current.clickedCardId;
        // FIXME: handle card reveal when snapping is disabled
        const centerCardId = snappingRef.current.snappedCard?.getId();

        if (clickedCardId === undefined || centerCardId === undefined) return;

        // FIXME: reveal card in wrong direction if the mouse is out of the window when dragging the carousel
        // Only allow to reveal 3 cards nearest to the screen
        if (
          !(
            clickedCardId === centerCardId ||
            clickedCardId === mod(centerCardId - 1, numberOfCards) ||
            clickedCardId === mod(centerCardId + 1, numberOfCards)
          )
        )
          return;

        const selectedCard = cardsRef.current.find(
          card => card?.getId() === clickedCardId
        );

        if (
          !(
            selectedCard?.card &&
            selectedCard.cardContainer &&
            selectedCard.cardShadow
          )
        )
          return;

        revealing.revealId = clickedCardId;
        revealing.state = "revealing";

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

        const revealAnimationOption: KeyframeAnimationOptions = {
          duration: 500,
          fill: "forwards",
          easing: "ease-in-out",
        };

        const revealAnimations: Animation[] = [
          selectedCard.cardContainer.animate(
            [
              {
                transform: `rotateY(${cardAngle}deg) translateZ(280px) translateY(-55px) rotateY(180deg)`,
              },
            ],
            revealAnimationOption
          ),
          selectedCard.card.animate(
            [
              {
                transform: "translateY(0px)",
              },
            ],
            revealAnimationOption
          ),
          selectedCard.cardShadow.animate(
            [
              {
                transform: `translateY(55px) ${
                  getComputedStyle(selectedCard.cardShadow).transform
                }`,
              },
            ],
            revealAnimationOption
          ),
        ];

        revealing.cardRevealAnimations = revealAnimations;
        revealing.cardRevealAnimations.forEach(animation => {
          animation.onfinish = () => (revealing.state = "done_revealing");
        });
        break;
      case "revealing": // do nothing
        break;
      case "done_revealing":
        revealing.revealId = undefined;
        revealing.state = "unrevealing";

        revealing.cardRevealAnimations.forEach(animation => {
          animation.reverse();
          animation.onfinish = () => (revealing.state = "pre_revealing");
        });
        break;
      case "unrevealing": // do nothing
    }
  }, [cardSingleAngle, numberOfCards]);

  // Main loop
  useEffect(() => {
    if (!carousel || !cardsRef.current.length) return;

    const tick: FrameRequestCallback = now => {
      frameIdRef.current = requestAnimationFrame(tick);
      const delta = now - lastTimeRef.current;

      if (maxFramerate && delta < 1000 / maxFramerate) return;

      lastTimeRef.current = now;

      let carouselDegree = lastCarouselDegreeRef.current;
      if (!cursorRef.current.pressed) {
        if (clickRef.current.clicked) {
          handleReveal();
          clickRef.current.clicked = false;
        } else if (autoRotate) {
          carouselDegree = mod(
            lastCarouselDegreeRef.current + carouselDegreePerMs * delta,
            360
          );
        } else if (cardSnapping) {
          carouselDegree = handleSnap(delta, carouselDegree);
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

          if (revealingRef.current.state === "pre_revealing") {
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

      // Render carousel
      lastCarouselDegreeRef.current = carouselDegree;
      carousel.style.transform = `rotateY(${carouselDegree}deg)`;

      // Render cards
      cardsRef.current.forEach((cardRef, i) => {
        if (revealingRef.current.revealId === i) return;
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
    handleReveal,
    carouselDegreePerMs,
    carouselSnappingDegreePerMs,
    cardSingleAngle,
    handleSnap,
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
