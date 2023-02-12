import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
   * Number of seconds to finish 1 round of rotation in auto rotation mode
   */
  autoRotateSecond: number;

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
   * Difference in distance in pixels between the cards' highest and lowest positions
   */
  cardFloatingDelta: number;

  /**
   * Max FPS to render (not very accurate). The default is unlimited
   */
  maxFramerate?: number;
};

function CardCarousel({
  interactionContainerRef,
  numberOfCards,
  autoRotate = true,
  autoRotateSecond,
  manualRotate = true,
  manualRotateDistance,
  cardDistance,
  cardFloatingDelta,
  maxFramerate,
}: CardCarouselProps) {
  const [carousel, setCarousel] = useState<HTMLDivElement | null>();
  const cardsRef = useRef<(CardRef | null)[]>([]);
  const frameIdRef = useRef<number | null>();
  const lastTimeRef = useRef<number>(0);
  const lastCarouselDegreeRef = useRef<number>(0);
  const isTouchRef = useRef<boolean>(false);
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastCursorRef = useRef<{ x: number; y: number } | null>(null);

  const carouselDegreePerMs = useMemo(
    () => 360 / (autoRotateSecond * 1000),
    [autoRotateSecond]
  );

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

    const handleMouseDown = (e: MouseEvent) => {
      isTouchRef.current = true;
      cursorRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouch = (e: TouchEvent) => {
      isTouchRef.current = true;
      cursorRef.current = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };
    };
    const handleMouseMove = (e: MouseEvent) =>
      (cursorRef.current = { x: e.clientX, y: e.clientY });
    const handleTouchMove = (e: TouchEvent) =>
      (cursorRef.current = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      });

    const handleUntouch = () => {
      isTouchRef.current = false;
      lastCursorRef.current = null;
    };

    interactionContainerRef.addEventListener("mousedown", handleMouseDown);
    interactionContainerRef.addEventListener("touchstart", handleTouch);
    interactionContainerRef.addEventListener("mousemove", handleMouseMove);
    interactionContainerRef.addEventListener("touchmove", handleTouchMove);
    interactionContainerRef.addEventListener("mouseup", handleUntouch);
    interactionContainerRef.addEventListener("touchend", handleUntouch);

    return () => {
      interactionContainerRef.removeEventListener("mousedown", handleMouseDown);
      interactionContainerRef.removeEventListener("touchstart", handleTouch);
      interactionContainerRef.removeEventListener("mousemove", handleMouseMove);
      interactionContainerRef.removeEventListener("touchmove", handleTouchMove);
      interactionContainerRef.removeEventListener("mouseup", handleUntouch);
      interactionContainerRef.removeEventListener("touchend", handleUntouch);
    };
  }, [interactionContainerRef]);

  useEffect(() => {
    if (!carousel || !cardsRef.current.length) return;

    const cardSingleAngle = 360 / numberOfCards;

    const tick: FrameRequestCallback = now => {
      frameIdRef.current = requestAnimationFrame(tick);

      const delta = now - lastTimeRef.current;

      if (maxFramerate && delta < 1000 / maxFramerate) return;

      lastTimeRef.current = now;

      let carouselDegree = lastCarouselDegreeRef.current;
      if (!isTouchRef.current) {
        if (autoRotate) {
          carouselDegree = mod(
            lastCarouselDegreeRef.current + carouselDegreePerMs * delta,
            360
          );
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
        const cardFloatingHeight = Math.sin(
          ((carouselDegree + (i % 2 === 0 ? 180 : 0)) % 360) * (Math.PI / 360)
        );
        card.style.transform = `translateY(${
          -(cardFloatingHeight - 0.5) * cardFloatingDelta
        }px)`;

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
    carouselDegreePerMs,
    cardDistance,
    interactionContainerRef,
    numberOfCards,
    manualRotateDistance,
    cardFloatingDelta,
    maxFramerate,
    manualRotate,
    autoRotate,
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
