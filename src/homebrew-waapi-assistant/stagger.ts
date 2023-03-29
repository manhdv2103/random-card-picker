/**
 * https://motion.dev/dom/stagger#options
 */
export type StaggerConfig = {
  start?: number;
  from?: "first" | "last";
};

/**
 * https://motion.dev/dom/stagger
 */
export type StaggerFunction = (index: number, length: number) => number;

/**
 * I ~stole~ was inspired by this library
 * https://motion.dev/dom/stagger
 */
export const stagger = (
  duration: number,
  config?: StaggerConfig
): StaggerFunction => {
  const start = config?.start || 0;
  const from = config?.from || "first";

  return (index, length) =>
    start + (from === "first" ? index : length - index - 1) * duration;
};
