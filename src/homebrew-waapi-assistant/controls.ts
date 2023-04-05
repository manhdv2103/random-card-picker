export type AnimationControls = {
  addEventListener<K extends keyof AnimationEventMap>(
    type: K,
    listener: (evs: AnimationEventMap[K][]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  play: Animation["play"];
  pause: Animation["pause"];
  finish: Animation["finish"];
  cancel: Animation["cancel"];
  reverse: Animation["reverse"];
  commitStyles: Animation["commitStyles"];
  stop: () => void;
  finished: Promise<Animation[]>;
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
    listener,
    options
  ) => {
    const promises: Promise<AnimationEventMap[typeof type]>[] = [];

    for (const animation of animations) {
      const promise: Promise<AnimationEventMap[typeof type]> = new Promise(
        resolve => {
          animation.addEventListener(type, resolve, options);
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

  const commitStyles = () => {
    animations.forEach(animation => animation.commitStyles());
  };

  const stop = () => {
    animations.forEach(animation => {
      animation.commitStyles();
      animation.cancel();
    });
  };

  const finished = Promise.all(animations.map(animation => animation.finished))
    // Suppress the stupid AbortError
    // https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel#exceptions
    .catch(() => animations);

  return {
    addEventListener,
    play,
    pause,
    finish,
    cancel,
    reverse,
    commitStyles,
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
    listener,
    options
  ) => {
    const promises: Promise<AnimationEventMap[typeof type][]>[] = [];

    for (const control of controlObjs) {
      const promise: Promise<AnimationEventMap[typeof type][]> = new Promise(
        resolve => {
          control.addEventListener(type, resolve, options);
        }
      );

      promises.push(promise);
    }

    Promise.all(promises).then(res => listener(res.flat()));
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

  const commitStyles = () => {
    controlObjs.forEach(controlObj => controlObj.commitStyles());
  };

  const stop = () => {
    controlObjs.forEach(controlObj => controlObj.stop());
  };

  const finished = Promise.all(
    controlObjs.map(animation => animation.finished)
  ).then(ev => ev.flat());

  return {
    addEventListener,
    play,
    pause,
    finish,
    cancel,
    reverse,
    commitStyles,
    stop,
    finished,
  };
};
