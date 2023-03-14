import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import background from "./assets/background.png";
import fiveDollar from "./assets/card-fiveDollar.png";
import nothing from "./assets/card-nothing.png";
import CardCarousel from "./components/cardCarousel";

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

  const cardContents = useMemo(() => [fiveDollar, nothing], []);

  return (
    <>
      <img id="background" alt="game's background" src={background} />
      <header></header>
      <div id="main" ref={handleMain}>
        <div id="scene">
          <CardCarousel
            interactionContainerRef={main}
            numberOfCards={10}
            autoRotate={false}
            autoRotateTime={12}
            manualRotateDistance={1000}
            kineticRotateWeight={10}
            kineticDecelerationRate={325}
            dealingDuration={1}
            dealingDelay={0.25}
            dealingDeckDistanceFromCenter={220}
            dealingDirection="away"
            dealingFlyHeight={100}
            cardDistance={cardDistance}
            cardSnapping
            cardSnappingTime={5}
            cardRevealingDuration={0.5}
            cardProps={{
              cardFloatingDelta: 12,
              cardFloatingTime: 3,
            }}
            cardContents={cardContents}
          />
        </div>
      </div>
      <div id="controller"></div>
    </>
  );
}

export default App;
