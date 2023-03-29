import { AnimationControls, createAnimationControls } from "./controls";
import { StaggerFunction } from "./stagger";

export type AdvancedAnimationOptions = Omit<
  KeyframeAnimationOptions,
  "delay" | "endDelay"
> & {
  delay?: number | StaggerFunction;
  endDelay?: number | StaggerFunction;

  /**
   * If persist the animation, the style will be committed and the animation will be deleted
   */
  persist?: boolean;
};

export type Keyframes =
  | Keyframe[]
  | PropertyIndexedKeyframes
  | ((index: number) => Keyframe[] | PropertyIndexedKeyframes);

const DEFAULT_CONFIG: AdvancedAnimationOptions = {
  fill: "forwards",
  easing: "ease-in-out",
  persist: true,
};

/**
 * animate a single HTML element or an array of HTML elements
 * with a very sane default configs
 * and a bunch of assisting features (hence the name homebrew-waapi-*assistant*)
 *
 * @param elem the element(s) to animate
 * @param keyframes the keyframe array
 * @param config the animation config object, or duration if number is passed
 * @returns the animation controls
 */
export const animate = (
  elem: HTMLElement | HTMLElement[],
  keyframes: Keyframes,
  config?: number | AdvancedAnimationOptions
): AnimationControls => {
  const elems = Array.isArray(elem) ? elem : [elem];
  const animations: Animation[] = [];
  const configObj: AdvancedAnimationOptions = {
    ...DEFAULT_CONFIG,
    ...normalizeAnimateConfig(config),
  };

  // Pre-calcutate all keyframes => reduce computation time when setup animations => animations will be more synchronized
  const formattedKeyframes = elems.map((elem, i) =>
    formatKeyframes(
      elem,
      typeof keyframes === "function" ? keyframes(i) : keyframes,
      i
    )
  );

  // Set first keyframe styles as elements' starting styles
  elems.forEach((elem, i) => {
    const keyframes = formattedKeyframes[i];
    const firstKeyframe = extractKeyframe(keyframes, 0);
    const secondKeyframe = extractKeyframe(keyframes, 1);

    // If only one keyframe is presented, then don't set styles
    if (Object.keys(secondKeyframe).length) {
      for (const [key, value] of Object.entries(firstKeyframe)) {
        if (key in elem.style) {
          elem.style[key as any] = value + "";
        }
      }
    }
  });

  elems.forEach((elem, i) => {
    const animation = elem.animate(formattedKeyframes[i], {
      ...configObj,
      delay: normalizeDelayValue(configObj.delay, i, elems.length),
      endDelay: normalizeDelayValue(configObj.endDelay, i, elems.length),
    });

    animation.addEventListener("finish", () => {
      if (configObj.persist) {
        animation.commitStyles();
        animation.cancel();
      }
    });

    animations.push(animation);
  });

  return createAnimationControls(animations);
};

/**
 * Normalize your animate config parameter to a config object
 * @param config the config parameter to normalize
 * @returns the config object
 */
export const normalizeAnimateConfig = (
  config: number | AdvancedAnimationOptions | undefined
): AdvancedAnimationOptions | undefined =>
  typeof config === "number" ? { duration: config } : config;

/**
 * Extract a single keyframe from keyframes by index
 */
const extractKeyframe = (
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  index: number
): Keyframe => {
  if (Array.isArray(keyframes)) {
    return keyframes[index];
  }

  const keyframe: Keyframe = {};
  for (const [k, v] of Object.entries(keyframes)) {
    const value = Array.isArray(v) ? v[index] : [v][index];
    if (value !== null && value !== undefined) keyframe[k] = value;
  }

  return keyframe;
};

/**
 * Quick function to normalize the delay value that supports StaggerFunction
 */
const normalizeDelayValue = (
  delay: number | StaggerFunction | undefined,
  index: number,
  length: number
): number | undefined =>
  typeof delay === "function" ? delay(index, length) : delay;

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
      ...(formattedTransform && { transform: formattedTransform }),
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
 *  - `%k_^`: the formatted tranform style of the keyframe _th place
 * from the current transform style up to the start of the keyframe array.
 * If _ is 0 or greater than the current index of the transform style then the tag will be ignored.
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
    .replaceAll(/%k(\d+)(\^?)/g, (_, value, relative) => {
      let replaceIdx = Number(value);
      if (relative === "^") {
        replaceIdx = index - replaceIdx;
      }

      if (replaceIdx >= 0 && replaceIdx < index) {
        return getReplaceTransform(replaceIdx);
      }

      return "";
    });
};
