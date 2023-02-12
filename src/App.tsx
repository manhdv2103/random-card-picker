import { useCallback, useState } from "react";
import "./App.css";
import CardCarousel from "./components/cardCarousel/CardCarousel";

function App() {
  const [main, setMain] = useState<HTMLDivElement | null>(null);
  const handleMain = useCallback((el: HTMLDivElement) => setMain(el), []);

  return (
    <>
      <header></header>
      <div id="main" ref={handleMain}>
        <div id="scene">
          <CardCarousel
            interactionContainerRef={main}
            numberOfCards={10}
            autoRotateTime={12}
            manualRotateDistance={1000}
            cardDistance={150}
            cardFloatingDelta={12}
            cardFloatingTime={3}
          />
        </div>
      </div>
      <div id="controller"></div>
    </>
  );
}

export default App;
