export type AnimationControls = {
  addEventListener<K extends keyof AnimationEventMap>(
    type: K,
    listener: (evs: AnimationEventMap[K][]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
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

  return {
    addEventListener,
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

  return {
    addEventListener,
  };
};
