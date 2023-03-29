import { forwardRef, useImperativeHandle, useRef } from "react";
import { animate } from "../../homebrew-waapi-assistant/animate";
import { AnimationControls } from "../../homebrew-waapi-assistant/controls";
import { CardProps, CardRef, SafeCardRef } from "./header";
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
    const floatingAnimationRef = useRef<AnimationControls | undefined>();
    const shakingAnimationRef = useRef<AnimationControls | undefined>();
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
      startFloatingAnimation: () => {
        if (cardRef.current) {
          const halfCardFloatingDelta = cardFloatingDelta / 2;

          floatingAnimationRef.current = animate(
            cardRef.current,
            {
              transform: [
                `translateY(${-halfCardFloatingDelta}px)`,
                `translateY(${halfCardFloatingDelta}px)`,
              ],
            },
            {
              duration: cardFloatingTime * 500,
              iterations: Infinity,
              direction: "alternate",
              iterationStart: (id % 2) + 0.5, // 0.5 cuz it's when the card is at its init state
            }
          );

          // TODO: update card shadow scaling to fit with the card's current height
          // cardShadow.style.transform = `scale(${
          //   1 + cardFloatingHeight * (1 - cardFloatingDelta / 10)
          // })`;,
        }
      },
      stopFloatingAnimation: () => {
        floatingAnimationRef.current?.stop();
      },
      startShakingAnimation: () => {
        if (cardRef.current)
          shakingAnimationRef.current = animate(
            cardRef.current,
            {
              transform: ["%s rotate(10deg)", "%s rotate(-10deg)"],
            },
            {
              iterations: Infinity,
              direction: "alternate",
              duration: cardShakingTime * 500,
            }
          );
      },
      stopShakingAnimation: () => {
        shakingAnimationRef.current?.stop();
      },
    }));

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

export const ensureCardRef = (
  cardRef: CardRef | null | undefined
): cardRef is SafeCardRef => !!cardRef?.elems;
