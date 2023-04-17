import { AnimationControls, createSequenceAnimationControls } from "./controls";

export const sequence = (
  timeline: (() => AnimationControls | null)[]
): AnimationControls => {
  const state: {
    current: AnimationControls | null;
    stop: boolean;
    skip: boolean;
  } = {
    current: null,
    stop: false,
    skip: false,
  };

  const [onSequenceStop, controls] = createSequenceAnimationControls(
    () => state.current,
    skipToLast => {
      if (skipToLast) {
        state.current = timeline[timeline.length - 1]();
        state.skip = true;
      } else {
        state.stop = true;
      }

      return state.current;
    }
  );

  const runAnimation = async () => {
    for (const animation of timeline) {
      if (state.stop || state.skip) {
        break;
      }

      state.current = animation();
      if (state.current) await playAndWait(state.current);
    }

    if (state.current) onSequenceStop(state.current, !state.stop);
  };
  runAnimation();

  return controls;
};

const playAndWait = (controls: AnimationControls): Promise<boolean> => {
  let played = false;
  return new Promise(resolve => {
    controls.addEventListener("finish", () => {
      if (!played) {
        played = true;
        resolve(true);
      }
    });

    controls.addEventListener("cancel", () => {
      if (!played) {
        played = true;
        resolve(false);
      }
    });
  });
};
