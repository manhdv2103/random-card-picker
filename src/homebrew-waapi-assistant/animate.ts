export type AnimationControls = {
  addEventListener<K extends keyof AnimationEventMap>(
    type: K,
    listener: (evs: AnimationEventMap[K][]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
};

const DEFAULT_CONFIG: KeyframeAnimationOptions = {
  fill: "forwards",
  easing: "ease-in-out",
};

export const animate = (
  elem: HTMLElement | HTMLElement[],
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  config: number | KeyframeAnimationOptions
): AnimationControls => {
  const elems = Array.isArray(elem) ? elem : [elem];
  const animations: Animation[] = [];

  // Pre-calcutate all keyframes => reduce computation time when setup animations => animations will be more synchronized
  const formattedKeyframes = elems.map((elem, i) =>
    formatKeyframes(elem, keyframes, i)
  );

  elems.forEach((elem, i) => {
    const animation = elem.animate(formattedKeyframes[i], {
      ...DEFAULT_CONFIG,
      ...(typeof config === "number" ? { duration: config } : config),
    });

    animation.addEventListener("finish", () => {
      animation.commitStyles();
      animation.cancel();
    });

    animations.push(animation);
  });

  return createAnimationControls(animations);
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

/**
 * Format the keyframes using metadata
 * Currently only support transform-type keyframe (opacity next maybe)
 *
 * @param elem the HTML element that uses the keyframes
 * @param keyframes the keyframes theirselves
 * @param elemIndex the index of the HTML element in the element array
 * @returns the formatted keyframes
 */
const formatKeyframes = <K extends Keyframe[] | PropertyIndexedKeyframes>(
  elem: HTMLElement,
  keyframes: K,
  elemIndex: number
): K => {
  let formattedKeyframes;

  if (Array.isArray(keyframes)) {
    formattedKeyframes = keyframes.map((keyframe, i) => {
      const transform = keyframe.transform;

      if (typeof transform === "string") {
        keyframe.transform = formatTransform(
          transform,
          elem,
          elemIndex,
          i,
          replaceIdx => {
            const replaceTransform = keyframes[replaceIdx].transform;
            return replaceTransform ? replaceTransform + "" : "";
          }
        );
      }

      return keyframe;
    });
  } else {
    const transform = keyframes.transform;
    let formattedTransform;

    if (Array.isArray(transform) && transform.length) {
      const tempArr: (string | number | null)[] = [];
      transform.forEach((tranItem, i) => {
        tempArr.push(
          typeof tranItem === "string"
            ? formatTransform(tranItem, elem, elemIndex, i, replaceIdx => {
                const replaceTransform = tempArr[replaceIdx];
                return replaceTransform ? replaceTransform + "" : "";
              })
            : tranItem
        );
      });
      formattedTransform = tempArr;
    } else if (typeof transform === "string") {
      formattedTransform = formatTransform(
        transform,
        elem,
        elemIndex,
        0,
        _ => ""
      );
    } else {
      formattedTransform = transform;
    }

    formattedKeyframes = {
      ...keyframes,
      transform: formattedTransform,
    };
  }

  return formattedKeyframes as K;
};

/**
 * Format a transform keyframe using a bunch of metadata via tags
 * Currently supported tags are:
 *  - `%s`: the start/current transform style of the element.
 *  - `%i`: the index of the element in the element array.
 *  - `%k_`: the formatted tranform style of the keyframe _th in the current keyframe array.
 * If _ is greater or equals to the current index of the transform style then the tag will be ignored.
 *
 * TODO: Support `%()` - the pre calculate tag without using the calc() CSS function
 *
 * @param transform the transform keyframe
 * @param elem the HTML element that owns the transform
 * @param elemIndex the index of the HTML element in the element array
 * @param index the index of the transform in the transform array
 * @param getReplaceTransform function to get the replace transform for the `%k_` tags
 * @returns the formatted transform
 */
const formatTransform = (
  transform: string,
  elem: HTMLElement,
  elemIndex: number,
  index: number,
  getReplaceTransform: (replaceIdx: number) => string
) => {
  return transform
    .replaceAll("%s", getComputedStyle(elem).transform)
    .replaceAll("%i", elemIndex + "")
    .replaceAll(/%k(\d+)/g, (_, replaceIdx) => {
      replaceIdx = Number(replaceIdx);
      if (replaceIdx < index) {
        return getReplaceTransform(replaceIdx);
      }

      return "";
    });
};
