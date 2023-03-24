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
            numberOfShuffling={12}
            shufflingMaxDistance={70}
            shufflingHeight={100}
            shufflingDuration={0.18}
            dealingDuration={0.7}
            dealingDelay={0.2}
            dealingDeckDistanceFromCenter={220}
            dealingDirection="away"
            dealingFlyHeight={100}
            cardDistance={cardDistance}
            cardSnapping
            cardSnappingTime={5}
            cardRevealingDuration={0.5}
            cardRevealLimitDistance={70}
            cardProps={{
              cardFloatingDelta: 12,
              cardFloatingTime: 3,
              cardShakingTime: 0.15,
            }}
            cardContents={cardContents}
            getRevealedCardContent={() =>
              new Promise((resolse, reject) => {
                // mocking a real API call
                fetch("https://api.random.org/json-rpc/4/invoke", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "generateIntegers",
                    params: {
                      apiKey: "c7ae2556-fa9a-4b3a-b250-2eb644cb01d8",
                      n: 1,
                      min: 0,
                      max: 1,
                    },
                    id: 1,
                  }),
                })
                  .then(json => json.json())
                  .then(data => {
                    resolse(cardContents[data.result.random.data[0]]);
                  })
                  .catch(reject);
              })
            }
          />
        </div>
      </div>
      <div id="controller"></div>
    </>
  );
}

export default App;
