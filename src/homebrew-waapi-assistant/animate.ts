type AnimationControls = {
  addEventListener<K extends keyof AnimationEventMap>(
    type: K,
    listener: (evs: AnimationEventMap[K][]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
};

const defaultConfig: KeyframeAnimationOptions = {
  fill: "forwards",
  easing: "ease-in-out",
};

const createAnimationControls = (
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
        (resolve, _) => {
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

export const animate = (
  elem: HTMLElement | HTMLElement[],
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  config: number | KeyframeAnimationOptions
): AnimationControls => {
  const elems = Array.isArray(elem) ? elem : [elem];
  const animations: Animation[] = [];

  for (const elem of elems) {
    const animation = elem.animate(keyframes, {
      ...defaultConfig,
      ...(typeof config === "number" ? { duration: config } : config),
    });

    animation.addEventListener("finish", () => {
      animation.commitStyles();
      animation.cancel();
    });

    animations.push(animation);
  }

  return createAnimationControls(animations);
};