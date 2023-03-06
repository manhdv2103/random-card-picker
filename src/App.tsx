import { useCallback, useEffect, useState } from "react";
import "./App.css";
import CardCarousel from "./components/cardCarousel/CardCarousel";

const MAX_CARD_DISTANCE = 200;

function App() {
  const [main, setMain] = useState<HTMLDivElement | null>(null);
  const handleMain = useCallback((el: HTMLDivElement) => setMain(el), []);
  const [cardDistance, setCardDistance] = useState(
    Math.min(MAX_CARD_DISTANCE, window.innerWidth / 3)
  );

  useEffect(() => {
    const handleResize = () => {
      setCardDistance(Math.min(MAX_CARD_DISTANCE, window.innerWidth / 3));
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  });

  return (
    <>
      <header></header>
      <div id="main" ref={handleMain}>
        <div id="scene">
          <CardCarousel
            interactionContainerRef={main}
            numberOfCards={10}
            autoRotate={false}
            autoRotateTime={12}
            manualRotateDistance={1000}
            cardDistance={cardDistance}
            cardSnapping
            cardSnappingTime={5}
            cardProps={{
              cardFloatingDelta: 12,
              cardFloatingTime: 3,
            }}
          />
        </div>
      </div>
      <div id="controller"></div>
    </>
  );
}

export default App;
