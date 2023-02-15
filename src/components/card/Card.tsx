import { forwardRef, useImperativeHandle, useRef } from "react";
import "./Card.css";

export type CardRef = {
  card: HTMLDivElement | null;
  cardContainer: HTMLDivElement | null;
  cardShadow: HTMLDivElement | null;
  getId: () => number;
};

export type CardProps = {
  id: number;
  content?: string;
};

const Card = forwardRef<CardRef, CardProps>(({ id, content }, ref) => {
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const cardShadowRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    card: cardRef.current,
    cardContainer: cardContainerRef.current,
    cardShadow: cardShadowRef.current,
    getId: () => id,
  }));

  return (
    <div ref={cardContainerRef} className="card-container">
      <div ref={cardRef} className="card">
        <div className="card-face card-face_front">front {content}</div>
        <div className="card-face card-face_back">back {content}</div>
      </div>
      <div ref={cardShadowRef} className="card-shadow" />
    </div>
  );
});

export default Card;
