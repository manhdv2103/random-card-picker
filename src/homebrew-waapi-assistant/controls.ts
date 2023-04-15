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
    .catch(_ => {});

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
