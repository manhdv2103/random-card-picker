import { useCallback, useEffect, useRef, useState } from "react";
import Card, { CardRef } from "../card/Card";
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
   * Make the card floating up and down
   * @default true
   */
  cardFloating?: boolean;

  /**
   * Difference in distance in pixels between the cards' highest and lowest positions
   */
  cardFloatingDelta: number;

  /**
   * Time in seconds for the card to finish a floating routine
   */
  cardFloatingTime: number;

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
};

type Cursor = { x: number; y: number; pressed: boolean };

type Snapping = {
  state: "pre_snapping" | "snapping" | "done_snapping";
  goal: number;
};

function CardCarousel({
  interactionContainerRef,
  numberOfCards,
  autoRotate = true,
  autoRotateTime,
  manualRotate = true,
  manualRotateDistance,
  cardDistance,
  cardFloating = true,
  cardFloatingDelta,
  cardFloatingTime,
  cardSnapping,
  cardSnappingTime,
  maxFramerate,
}: CardCarouselProps) {
  const [carousel, setCarousel] = useState<HTMLDivElement | null>();
  const cardsRef = useRef<(CardRef | null)[]>([]);

  const frameIdRef = useRef<number | null>();
  const lastTimeRef = useRef<number>(0);
  const lastCarouselDegreeRef = useRef<number>(0);

  const cursorRef = useRef<Cursor>({ x: 0, y: 0, pressed: false });
  const lastCursorRef = useRef<Cursor | null>(null);

  const snappingRef = useRef<Snapping>({ state: "pre_snapping", goal: 0 });

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

  useEffect(() => {
    if (!carousel || !cardsRef.current.length) return;

    const carouselDegreePerMs = 360 / (autoRotateTime * 1000);
    const cardSingleAngle = 360 / numberOfCards;
    const cardFloatingTimeMs = cardFloatingTime * 1000;
    const cardFloatingPeriod = (2 * Math.PI) / cardFloatingTimeMs;
    const halfCardFloatingDelta = cardFloatingDelta / 2;
    const carouselSnappingDegreePerMs = 360 / (cardSnappingTime * 1000);

    const tick: FrameRequestCallback = now => {
      frameIdRef.current = requestAnimationFrame(tick);

      const delta = now - lastTimeRef.current;

      if (maxFramerate && delta < 1000 / maxFramerate) return;

      lastTimeRef.current = now;

      let carouselDegree = lastCarouselDegreeRef.current;
      if (!cursorRef.current.pressed) {
        if (autoRotate) {
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

              snappingRef.current.state = "done_snapping";
            }
          }
        }
      } else if (manualRotate) {
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

      lastCarouselDegreeRef.current = carouselDegree;
      carousel.style.transform = `rotateY(${carouselDegree}deg)`;

      cardsRef.current.forEach((cardRef, i) => {
        if (!cardRef?.cardContainer || !cardRef?.card || !cardRef?.cardShadow)
          return;
        const { cardContainer, card } = cardRef;

        const cardDegree = cardSingleAngle * i;
        cardContainer.style.transform = `rotateY(${cardDegree}deg) translateZ(${cardDistance}px) rotateY(-${
          cardDegree + carouselDegree
        }deg)`;

        let cardFloatingHeight = 0;
        if (cardFloating) {
          const cardFloatingPhaseShift = Math.PI * (i % 2);
          cardFloatingHeight =
            Math.sin(
              (now % cardFloatingTimeMs) * cardFloatingPeriod +
                cardFloatingPhaseShift
            ) * halfCardFloatingDelta;
        }

        card.style.transform = `translateY(${cardFloatingHeight}px)`;

        // TODO: update card shadow scaling to fit with the card's current height
        // cardShadow.style.transform = `scale(${
        //   1 + cardFloatingHeight * (1 - cardFloatingDelta / 10)
        // })`;
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
    cardFloatingDelta,
    maxFramerate,
    manualRotate,
    autoRotate,
    cardFloatingTime,
    autoRotateTime,
    cardFloating,
    cardSnappingTime,
    cardSnapping,
  ]);

  return (
    <div ref={handleCarousel} className="card-carousel">
      {Array(numberOfCards)
        .fill(null) // placeholder
        .map((_, i) => (
          <Card key={i} ref={el => handleCard(el, i)} content={i + ""} />
        ))}
    </div>
  );
}

export default CardCarousel;

const mod = (n: number, m: number) => ((n % m) + m) % m;
