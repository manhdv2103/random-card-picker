import { forwardRef, useImperativeHandle, useRef } from "react";
import "./Card.css";

export type CardRef = {
  card: HTMLDivElement | null;
  cardContainer: HTMLDivElement | null;
  cardShadow: HTMLDivElement | null;
};

export type CardProps = {
  content?: string;
};

const Card = forwardRef<CardRef, CardProps>(({ content }, ref) => {
  const handleCardContainer = useRef<HTMLDivElement | null>(null);
  const handleCard = useRef<HTMLDivElement | null>(null);
  const handleCardShadow = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    card: handleCard.current,
    cardContainer: handleCardContainer.current,
    cardShadow: handleCardShadow.current,
  }));

  return (
    <div ref={handleCardContainer} className="card-container">
      <div ref={handleCard} className="card">
        <div className="card-face card-face_front">front {content}</div>
        <div className="card-face card-face_back">back {content}</div>
      </div>
      <div ref={handleCardShadow} className="card-shadow" />
    </div>
  );
});

export default Card;
