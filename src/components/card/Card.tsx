import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "./Card.css";

export type CardRef = {
  card: HTMLDivElement | null;
  cardContainer: HTMLDivElement | null;
  cardShadow: HTMLDivElement | null;
  getId: () => number;
};

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
};

export interface CardProps extends ConfigCardProps {
  id: number;
  content?: string;
}

const Card = forwardRef<CardRef, CardProps>(
  (
    { id, content, cardFloating = true, cardFloatingDelta, cardFloatingTime },
    ref
  ) => {
    const cardContainerRef = useRef<HTMLDivElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const cardShadowRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      card: cardRef.current,
      cardContainer: cardContainerRef.current,
      cardShadow: cardShadowRef.current,
      getId: () => id,
    }));

    useEffect(() => {
      let cardFloatingAnimation: Animation | undefined = undefined;

      if (cardFloating) {
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
            iterationStart: id % 2,
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
    }, [cardFloating, cardFloatingDelta, cardFloatingTime, id]);

    return (
      <div ref={cardContainerRef} className="card-container" data-id={id}>
        <div ref={cardRef} className="card">
          <div className="card-face card-face_back">back {content}</div>
          <div className="card-face card-face_front">front {content}</div>
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
