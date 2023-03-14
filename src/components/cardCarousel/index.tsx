import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Card, { extractCardId } from "../card";
import { CardRef } from "../card/header";
import backImg from "./../../assets/card-back.png";
import {
  CardCarouselProps,
  Click,
  CLICK_PIXEL_THRESHOLD,
  Cursor,
  Dealing,
  DEALING_FINISH_SKEW_DEGREE,
  KineticTracking,
  KINETIC_SNAPPING_VELOCITY_LOWER_BOUND,
  KINETIC_STOP_DEGREE,
  KINETIC_TRACKING_RATE,
  KINETIC_VELOCITY_LOWER_BOUND,
  Revealing,
  Snapping,
} from "./header";
import "./styles.css";

const windowStyle = window.getComputedStyle(document.body);

// CSS variables
const SHADOW_SPACE_FROM_CARD = windowStyle.getPropertyValue(
  "--shadow-space-from-card"
);
const SHADOW_WIDTH = windowStyle.getPropertyValue("--shadow-width");
const SHADOW_OPACITY = windowStyle.getPropertyValue("--shadow-opacity");

function CardCarousel({
  interactionContainerRef,
  numberOfCards,
  autoRotate = true,
  autoRotateTime,
  kineticRotate = true,
  kineticRotateWeight,
  kineticDecelerationRate,
  manualRotate = true,
  manualRotateDistance,
  dealingDeckDistanceFromCenter,
  dealingDirection,
  dealingDuration,
  dealingDelay,
  dealingFlyHeight,
  cardDistance,
  cardSnapping,
  cardSnappingTime,
  cardRevealingDuration,
  maxFramerate,
  cardProps,
  cardContents,
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

  const dealingRef = useRef<Dealing>({ state: "dealing" });
  const snappingRef = useRef<Snapping>({ state: "pre_snapping", goal: 0 });
  const revealingRef = useRef<Revealing>({
    state: "pre_revealing",
    revealId: undefined,
    cardRevealAnimations: [],
  });
  const kineticTrackingRef = useRef<KineticTracking>({
    state: "no_kinetic_scrolling",
    velocity: 0,
    amplitude: 0,
    lastTime: 0,
    lastPos: 0,
    goal: 0,
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

  const dealingAnimationOption: KeyframeAnimationOptions = useMemo(
    () => ({
      duration: dealingDuration * 1000,
      fill: "forwards",
      easing: "ease",
    }),
    [dealingDuration]
  );

  const cardRevealingAnimationOption: KeyframeAnimationOptions = useMemo(
    () => ({
      duration: cardRevealingDuration * 1000,
      fill: "forwards",
      easing: "ease-in-out",
    }),
    [cardRevealingDuration]
  );

  const cardFrontImgs = useMemo(
    () =>
      Array.from(
        { length: numberOfCards },
        () => cardContents[Math.floor(Math.random() * cardContents.length)]
      ),
    [cardContents, numberOfCards]
  );

  // Kinetic tracking
  const kineticTrack = useCallback(() => {
    const kineticTracking = kineticTrackingRef.current;
    const now = performance.now();

    const deltaTime = now - kineticTracking.lastTime;
    kineticTracking.lastTime = now;

    const deltaPos = cursorRef.current.x - kineticTracking.lastPos;
    kineticTracking.lastPos = cursorRef.current.x;

    const newVel = deltaPos / ((1 + deltaTime) / 1000);

    // simple moving average filter
    kineticTracking.velocity = 0.8 * newVel + 0.2 * kineticTracking.velocity;
  }, []);

  const kineticStartTracking = useCallback(() => {
    clearInterval(kineticTrackingRef.current.tracker);
    kineticTrackingRef.current = {
      state: "no_kinetic_scrolling",
      velocity: 0,
      amplitude: 0,
      goal: 0,
      lastTime: performance.now(),
      lastPos: cursorRef.current.x,
      tracker: setInterval(kineticTrack, KINETIC_TRACKING_RATE),
    };
  }, [kineticTrack]);

  const kineticEndTracking = useCallback(() => {
    const kineticTracking = kineticTrackingRef.current;
    clearInterval(kineticTracking.tracker);

    const velocityLowerBound = cardSnapping
      ? KINETIC_SNAPPING_VELOCITY_LOWER_BOUND
      : KINETIC_VELOCITY_LOWER_BOUND;
    if (Math.abs(kineticTracking.velocity) > velocityLowerBound) {
      kineticTracking.amplitude =
        (1 / kineticRotateWeight) * kineticTracking.velocity;
      kineticTracking.goal =
        lastCarouselDegreeRef.current + kineticTracking.amplitude;

      // Round the target to the nearest card position
      if (cardSnapping) {
        kineticTracking.goal =
          Math.ceil(kineticTracking.goal / cardSingleAngle) * cardSingleAngle;
      }

      kineticTracking.state = "kinetic_scrolling";
      kineticTracking.lastTime = performance.now();
    }
  }, [cardSingleAngle, cardSnapping, kineticRotateWeight]);

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

      kineticRotate && kineticStartTracking();
    };

    const handleTouchMove = throttle(
      (e: MouseEvent | TouchEvent) => {
        const touchPoint = "changedTouches" in e ? e.changedTouches[0] : e;
        cursorRef.current = {
          ...cursorRef.current,
          x: touchPoint.clientX,
          y: touchPoint.clientY,
        };
      },
      maxFramerate === undefined ? 0 : 1000 / maxFramerate
    );

    const handleUntouch = () => {
      cursorRef.current = { ...cursorRef.current, pressed: false };
      lastCursorRef.current = null;

      kineticRotate && kineticEndTracking();
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
  }, [
    interactionContainerRef,
    kineticEndTracking,
    kineticRotate,
    kineticStartTracking,
    maxFramerate,
  ]);

  // Floating animation
  const runCardsFloatingAnimation = useCallback(() => {
    cardsRef.current.forEach(cardRef => {
      cardRef?.startFloatingAnimation();
    });
  }, []);

  // Dealing animation
  const runDealingAnimation = useCallback(
    (finishCallback: () => void) => {
      switch (dealingRef.current.state) {
        case "dealing":
          const animations: Animation[] = [];
          cardsRef.current.forEach((cardRef, i) => {
            if (
              !cardRef?.cardContainer ||
              !cardRef?.card ||
              !cardRef?.cardShadow
            )
              return;

            const { cardContainer, cardShadow } = cardRef;

            const delay = (numberOfCards - i - 1) * dealingDelay * 1000;
            const direction = dealingDirection === "toward" ? 1 : -1;
            const cardDegree = cardSingleAngle * i;
            const startState = `translateZ(${dealingDeckDistanceFromCenter}px) translateY(calc(${SHADOW_SPACE_FROM_CARD} + 50%)) rotateX(90deg) translateZ(calc(${SHADOW_WIDTH} + ${
              i + 1
            }px))`;

            const animationOption: KeyframeAnimationOptions = {
              ...dealingAnimationOption,
              delay,
            };

            cardContainer.style.transform = startState;
            const animation = cardContainer.animate(
              [
                {
                  transform: startState,
                },
                {
                  transform: `${startState} translateY(${
                    direction * cardDistance
                  }px)`,
                },
                {
                  transform: `${startState} translateY(${
                    direction * cardDistance
                  }px) translateZ(${dealingFlyHeight}px) rotateX(-${DEALING_FINISH_SKEW_DEGREE}deg)`,
                },
                {
                  transform: `rotateY(${cardDegree}deg) translateZ(${cardDistance}px) rotateY(-${cardDegree}deg)`,
                },
              ],
              animationOption
            );

            cardShadow.style.opacity = "0";
            cardShadow.animate(
              [
                { opacity: 0 },
                { opacity: 0 },
                { opacity: 0 },
                { opacity: SHADOW_OPACITY },
              ],
              animationOption
            );

            animations.push(animation);

            // the animation deals from the last card to the first one
            if (i === 0) {
              animation.addEventListener("finish", () => {
                dealingRef.current.state = "done_dealing";
                finishCallback();

                // let others do the rest
                animations.forEach(a => a.cancel());
              });
            }
          });
          break;
        case "done_dealing":
          finishCallback();
      }
    },
    [
      cardDistance,
      cardSingleAngle,
      dealingAnimationOption,
      dealingDeckDistanceFromCenter,
      dealingDelay,
      dealingDirection,
      dealingFlyHeight,
      numberOfCards,
    ]
  );

  // Rotate handlings
  const handleAutoRotate = useCallback(
    (delta: number, carouselDegree: number): number =>
      mod(carouselDegree + carouselDegreePerMs * delta, 360),
    [carouselDegreePerMs]
  );

  const handleManualRotate = useCallback(
    (carouselDegree: number): number => {
      if (revealingRef.current.state === "pre_revealing") {
        const cursorDelta = lastCursorRef.current
          ? cursorRef.current.x - lastCursorRef.current.x
          : 0;
        lastCursorRef.current = cursorRef.current;

        // prepare for card snapping
        if (cardSnapping) snappingRef.current.state = "pre_snapping";

        return mod(
          carouselDegree + (cursorDelta * 360) / manualRotateDistance,
          360
        );
      }

      return carouselDegree;
    },
    [cardSnapping, manualRotateDistance]
  );

  // TODO: smoothly merge velocities of the kinetic scrolling and auto scrolling if autoScroll is enabled
  const handleKineticRotate = useCallback(
    (now: number, carouselDegree: number): number => {
      const goalDistance =
        -kineticTrackingRef.current.amplitude *
        Math.exp(
          -(now - kineticTrackingRef.current.lastTime) / kineticDecelerationRate
        );

      if (Math.abs(goalDistance) > KINETIC_STOP_DEGREE) {
        carouselDegree = mod(
          kineticTrackingRef.current.goal + goalDistance,
          360
        );
      } else {
        carouselDegree = mod(kineticTrackingRef.current.goal, 360);
        kineticTrackingRef.current.state = "no_kinetic_scrolling";
      }

      return carouselDegree;
    },
    [kineticDecelerationRate]
  );

  // Card snap handling
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
              carouselDegree + Math.sign(goalDistance) * carouselSnappingDegree,
              360
            );
          } else {
            carouselDegree = mod(carouselDegree + goalDistance, 360);

            snapping.snappedCard =
              cardsRef.current[
                (numberOfCards - snapping.goal / (360 / numberOfCards)) %
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
        const snappingState = snappingRef.current.state;
        const centerCardId = snappingRef.current.snappedCard?.getId();

        if (
          snappingState !== "done_snapping" ||
          clickedCardId === undefined ||
          centerCardId === undefined
        )
          return;

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

        const revealAnimations: Animation[] = [
          selectedCard.cardContainer.animate(
            [
              {
                transform: `rotateY(${cardAngle}deg) translateZ(280px) translateY(-55px) rotateY(180deg)`,
              },
            ],
            cardRevealingAnimationOption
          ),
          selectedCard.card.animate(
            [
              {
                transform: "translateY(0px)",
              },
            ],
            cardRevealingAnimationOption
          ),
          selectedCard.cardShadow.animate(
            [
              {
                transform: `translateY(55px) ${
                  getComputedStyle(selectedCard.cardShadow).transform
                }`,
              },
            ],
            cardRevealingAnimationOption
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
  }, [cardRevealingAnimationOption, cardSingleAngle, numberOfCards]);

  // Main loop
  useEffect(() => {
    if (!carousel || !cardsRef.current.length) return;

    runDealingAnimation(() => {
      runCardsFloatingAnimation();

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
          }

          if (revealingRef.current.state === "pre_revealing") {
            if (kineticTrackingRef.current.state === "kinetic_scrolling") {
              carouselDegree = handleKineticRotate(now, carouselDegree);
            } else if (autoRotate) {
              carouselDegree = handleAutoRotate(delta, carouselDegree);
            } else if (cardSnapping) {
              carouselDegree = handleSnap(delta, carouselDegree);
            }
          }
        } else {
          const downCursor = clickRef.current.downCursor;

          if (
            downCursor &&
            Math.abs(downCursor.x - cursorRef.current.x) <
              CLICK_PIXEL_THRESHOLD &&
            Math.abs(downCursor.y - cursorRef.current.y) < CLICK_PIXEL_THRESHOLD
          ) {
            clickRef.current.clicked = true;
          } else {
            clickRef.current.clicked = false;

            if (manualRotate) {
              carouselDegree = handleManualRotate(carouselDegree);
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
    });

    return () => {
      frameIdRef.current && cancelAnimationFrame(frameIdRef.current);
    };
  }, [
    autoRotate,
    cardDistance,
    cardSingleAngle,
    cardSnapping,
    carousel,
    handleAutoRotate,
    handleKineticRotate,
    handleManualRotate,
    handleReveal,
    handleSnap,
    manualRotate,
    maxFramerate,
    runCardsFloatingAnimation,
    runDealingAnimation,
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
            frontImage={cardFrontImgs[i]}
            backImage={backImg}
            debug={debug}
            {...cardProps}
          />
        ))}
      {debug && <div className="carousel-debug-plane" />}
    </div>
  );
}

export default CardCarousel;

const mod = (n: number, m: number) => ((n % m) + m) % m;

function throttle(callback: Function, interval: number) {
  let enableCall = true;

  return function (...args: any[]) {
    if (!enableCall) return;

    enableCall = false;
    callback.apply(this, args);
    setTimeout(() => (enableCall = true), interval);
  };
}
