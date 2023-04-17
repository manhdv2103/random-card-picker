export type AnimationControls = {
  addEventListener<K extends keyof AnimationEventMap>(
    type: K,
    listener: () => any
  ): void;
  play: Animation["play"];
  pause: Animation["pause"];
  finish: Animation["finish"];
  cancel: Animation["cancel"];
  reverse: Animation["reverse"];
  stop: () => void;
  finished: Promise<void>;
};

/**
 * Create animation controls to controls an array of animations
 * @param animations the animation array
 * @returns the animation controls
 */
export const createAnimationControls = (
  animations: Animation[]
): AnimationControls => {
  const addEventListener: AnimationControls["addEventListener"] = (
    type,
    listener
  ) => {
    const promises: Promise<AnimationEventMap[typeof type]>[] = [];

    for (const animation of animations) {
      const promise: Promise<AnimationEventMap[typeof type]> = new Promise(
        resolve => {
          animation.addEventListener(type, resolve);
        }
      );

      promises.push(promise);
    }

    Promise.all(promises).then(listener);
  };

  const play = () => {
    animations.forEach(animation => animation.play());
  };

  const pause = () => {
    animations.forEach(animation => animation.pause());
  };

  const finish = () => {
    animations.forEach(animation => animation.finish());
  };

  const cancel = () => {
    animations.forEach(animation => animation.cancel());
  };

  const reverse = () => {
    animations.forEach(animation => animation.reverse());
  };

  const stop = () => {
    animations.forEach(animation => {
      animation.commitStyles();
      animation.cancel();
    });
  };

  const finished = Promise.all(animations.map(animation => animation.finished))
    .then(_ => {})
    // Suppress the stupid AbortError
    // https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel#exceptions
    .catch(() => {});

  return {
    addEventListener,
    play,
    pause,
    finish,
    cancel,
    reverse,
    stop,
    finished,
  };
};

/**
 * Merge many animation control objects into a single animation controls object
 * @param controlObjs the controls array
 * @returns the merged animation controls
 */
export const mergeAnimationControls = (
  controlObjs: AnimationControls[]
): AnimationControls => {
  const addEventListener: AnimationControls["addEventListener"] = (
    type,
    listener
  ) => {
    const promises: Promise<void>[] = [];

    for (const control of controlObjs) {
      const promise: Promise<void> = new Promise(resolve => {
        control.addEventListener(type, resolve);
      });

      promises.push(promise);
    }

    Promise.all(promises).then(listener);
  };

  const play = () => {
    controlObjs.forEach(controlObj => controlObj.play());
  };

  const pause = () => {
    controlObjs.forEach(controlObj => controlObj.pause());
  };

  const finish = () => {
    controlObjs.forEach(controlObj => controlObj.finish());
  };

  const cancel = () => {
    controlObjs.forEach(controlObj => controlObj.cancel());
  };

  const reverse = () => {
    controlObjs.forEach(controlObj => controlObj.reverse());
  };

  const stop = () => {
    controlObjs.forEach(controlObj => controlObj.stop());
  };

  const finished = Promise.all(
    controlObjs.map(animation => animation.finished)
  ).then(_ => {});

  return {
    addEventListener,
    play,
    pause,
    finish,
    cancel,
    reverse,
    stop,
    finished,
  };
};

/**
 * Create animation controls to controls a sequence of animations
 *
 * @param getCurrentControls callback to get the current running animation's controls
 * @param stopControls callback to stop the animation sequence and get the last controls.
 * set `skipToLast` to `true` to skip to the end of the animation sequence
 * @returns an array contains:
 *
 * 1. A function to called when the animation sequence is stop
 * 2. The sequence animation controls
 */
export const createSequenceAnimationControls = (
  getCurrentControls: () => AnimationControls | null,
  stopControls: (skipToLast: boolean) => AnimationControls | null
): [
  (lastControls: AnimationControls, finished: boolean) => void,
  AnimationControls
] => {
  const listeners: Record<
    keyof AnimationEventMap,
    Parameters<AnimationControls["addEventListener"]>[1][]
  > = {
    cancel: [],
    finish: [],
    remove: [],
  };

  const addEventListener: AnimationControls["addEventListener"] = (
    type,
    listener
  ) => {
    listeners[type].push(listener);
  };

  const play = () => {
    getCurrentControls()?.play();
  };

  const pause = () => {
    getCurrentControls()?.pause();
  };

  const finish = () => {
    stopControls(true)?.finish();
  };

  const cancel = () => {
    stopControls(false)?.cancel();
  };

  const reverse = () => {
    throw new Error("sequence reversing is currently not supported");
  };

  const stop = () => {
    stopControls(false)?.stop();
  };

  const finished = new Promise<void>(resolve => {
    listeners.finish.push(resolve);
  });

  const onSequenceStop = (
    lastControls: AnimationControls,
    finished: boolean
  ) => {
    if (finished) {
      listeners.finish.forEach(listener => listener());
    } else {
      listeners.cancel.forEach(listener => listener());
    }

    lastControls.addEventListener("remove", () => {
      listeners.remove.forEach(listener => listener());
    });
  };

  return [
    onSequenceStop,
    {
      addEventListener,
      play,
      pause,
      finish,
      cancel,
      reverse,
      stop,
      finished,
    },
  ];
};
