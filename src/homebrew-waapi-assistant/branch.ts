import {
  AdvancedAnimationOptions,
  animate,
  Keyframes,
  normalizeAnimateConfig,
} from "./animate";
import { AnimationControls, mergeAnimationControls } from "./controls";

/**
 * Split something (`T`) into multiple elements (branches) and run all the animations in parallel
 *
 * @param elem the item(s) to be branched into multiple elements to animate
 * @param getBranches extract the branches from an item.
 *  Please make sure to keep the results consistent, or bugs and crashes will come and kick ur a**
 * @param sequence the keyframes and configs for each element.
 * @param defaultConfig the default config that will be passed to every element's animations
 * @returns
 */
export const branch = <T extends any>(
  item: T | T[],
  getBranches: (item: T) => HTMLElement[],
  sequence: [
    keyframes: Keyframes,
    config?: number | AdvancedAnimationOptions
  ][],
  defaultConfig?: number | AdvancedAnimationOptions
): AnimationControls => {
  const controls: AnimationControls[] = [];
  const items = Array.isArray(item) ? item : [item];

  const elemsSeq = items.reduce((res, item, i) => {
    const branches = getBranches(item);

    branches.forEach((branch, j) => {
      if (!res[j]) res[j] = [];
      res[j].push(branch);
    });

    return res;
  }, [] as HTMLElement[][]);

  const minLength = Math.min(elemsSeq.length, sequence.length);
  for (let i = 0; i < minLength; i++) {
    const elems = elemsSeq[i];
    const [keyframes, config] = sequence[i];

    const control = animate(elems, keyframes, {
      ...normalizeAnimateConfig(defaultConfig),
      ...normalizeAnimateConfig(config),
    });

    controls.push(control);
  }

  return mergeAnimationControls(controls);
};
