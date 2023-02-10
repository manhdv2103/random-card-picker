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
            numberOfCards={15}
            autoRotateSecond={12}
            manualRotateDistance={3000}
            cardDistance={200}
            cardFloatingDelta={12}
          />
        </div>
      </div>
      <div id="controller"></div>
    </>
  );
}

export default App;
