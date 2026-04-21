import type { IgnoredElement } from "./IgnoredElement.ts";

export function shouldIgnore(x: unknown, ignored: IgnoredElement | undefined) {
  if (ignored === undefined || !(x instanceof HTMLElement)) return false;

  return (
    (typeof ignored === "function" && ignored(x)) ||
    (typeof ignored === "string" && x.closest(ignored) !== null)
  );
}
