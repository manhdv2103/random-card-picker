import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CardProps, CardRef } from "./header";
import "./styles.css";

const Card = forwardRef<CardRef, CardProps>(
  (
    {
      id,
      cardFloating = true,
      cardFloatingDelta,
      cardFloatingTime,
      cardShakingTime,
      frontImage,
      backImage,
      size,
      debug,
    },
    ref
  ) => {
    const [isfloatingAnimationStarted, setIsfloatingAnimationStarted] =
      useState(false);
    const shakingAnimationRef = useRef<Animation | undefined>();
    const cardContainerRef = useRef<HTMLDivElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const cardShadowRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      elems:
        cardRef.current && cardContainerRef.current && cardShadowRef.current
          ? {
              card: cardRef.current,
              cardContainer: cardContainerRef.current,
              cardShadow: cardShadowRef.current,
            }
          : null,
      card: cardRef.current,
      cardContainer: cardContainerRef.current,
      cardShadow: cardShadowRef.current,
      getId: () => id,
      startFloatingAnimation: () => setIsfloatingAnimationStarted(true),
      startShakingAnimation: () => {
        shakingAnimationRef.current = cardRef.current?.animate(
          {
            transform: ["rotate(10deg)", "rotate(-10deg)"],
          },
          {
            iterations: Infinity,
            direction: "alternate",
            easing: "ease-in-out",
            duration: cardShakingTime * 500,
          }
        );
      },
      stopShakingAnimation: () => {
        shakingAnimationRef.current?.cancel();
      },
    }));

    useEffect(() => {
      let cardFloatingAnimation: Animation | undefined = undefined;

      if (cardFloating && isfloatingAnimationStarted) {
        const halfCardFloatingDelta = cardFloatingDelta / 2;

        cardFloatingAnimation = cardRef.current?.animate(
          [
            {
              transform: `translateY(${-halfCardFloatingDelta}px)`,
            },
            {
              transform: `translateY(${halfCardFloatingDelta}px)`,
            },
          ],
          {
            duration: cardFloatingTime * 500,
            iterations: Infinity,
            direction: "alternate",
            iterationStart: (id % 2) + 0.5, // 0.5 cuz it's when the card is at its init state
            easing: "ease-in-out",
          }
        );

        // TODO: update card shadow scaling to fit with the card's current height
        // cardShadow.style.transform = `scale(${
        //   1 + cardFloatingHeight * (1 - cardFloatingDelta / 10)
        // })`;
      }

      return () => {
        cardFloatingAnimation?.cancel();
      };
    }, [
      cardFloating,
      cardFloatingDelta,
      cardFloatingTime,
      id,
      isfloatingAnimationStarted,
    ]);

    return (
      <div ref={cardContainerRef} className="card-container" data-id={id}>
        <div ref={cardRef} className="card" style={size}>
          <div
            className={`card-face card-face_back ${
              !backImage ? "card-face-empty" : ""
            }`}
          >
            {backImage && (
              <img
                draggable={false}
                src={backImage}
                alt={`card ${id}'s back`}
              />
            )}
          </div>
          <div
            className={`card-face card-face_front ${
              !frontImage ? "card-face-empty" : ""
            }`}
          >
            {frontImage && (
              <img
                draggable={false}
                src={frontImage}
                alt={`card ${id}'s front`}
              />
            )}
          </div>
          {debug && <span className="card-debug-id">{id}</span>}
        </div>
        <div ref={cardShadowRef} className="card-shadow" />
      </div>
    );
  }
);

export default Card;

export const extractCardId = (el: Element): number | undefined => {
  const card = el.closest("[data-id]");
  return card instanceof HTMLElement ? Number(card.dataset["id"]) : undefined;
};
