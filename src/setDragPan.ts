import type { IgnoredElement } from "./IgnoredElement.ts";
import { shouldIgnore } from "./shouldIgnore.ts";

export type SetDragPanOptions = {
  onStart?: () => void;
  onMove?: (dx: number, dy: number) => void;
  onEnd?: () => void;
  wheel?: boolean;
  ignore?: IgnoredElement;
};

export function setDragPan(
  element: HTMLElement | SVGElement,
  { onStart, onMove, onEnd, wheel, ignore }: SetDragPanOptions = {},
) {
  let x0: number | null = null;
  let y0: number | null = null;

  let nextMove: ReturnType<typeof requestAnimationFrame> | null = null;
  let wheelEndTimeout: ReturnType<typeof setTimeout> | null = null;

  let started = false;
  let wheelActive = false;
  let activePointers = 0;

  let dxTotal = 0;
  let dyTotal = 0;

  function moveBy(dx: number, dy: number) {
    // Accumulating shifts until the actual move from the rAF callback occurs
    dxTotal += dx;
    dyTotal += dy;

    if (!wheelActive && !element.dataset.dragged)
      element.dataset.dragged = "true";

    if (dxTotal !== 0 || dyTotal !== 0) {
      if (nextMove) cancelAnimationFrame(nextMove);

      nextMove = requestAnimationFrame(() => {
        onMove?.(dxTotal, dyTotal);

        dxTotal = 0;
        dyTotal = 0;

        nextMove = null;
      });
    }
  }

  function start() {
    if (wheelEndTimeout !== null) {
      clearTimeout(wheelEndTimeout);
      wheelActive = false;
      wheelEndTimeout = null;
    }

    started = true;
    onStart?.();

    dxTotal = 0;
    dyTotal = 0;
  }

  function end() {
    started = false;

    delete element.dataset.dragged;

    x0 = null;
    y0 = null;

    onEnd?.();
  }

  element.dataset.draggable = "true";

  function isRelevantEvent(event: PointerEvent) {
    return !shouldIgnore(event.target, ignore) && activePointers === 1;
  }

  function handlePointerDown(event: Event) {
    if (!(event instanceof PointerEvent)) return;

    activePointers++;

    if (isRelevantEvent(event)) {
      event.preventDefault();

      x0 = event.pageX;
      y0 = event.pageY;

      start();
    }
  }

  function handlePointerMove(event: Event) {
    if (!(event instanceof PointerEvent)) return;

    if (isRelevantEvent(event)) {
      event.preventDefault();

      if (x0 !== null && y0 !== null)
        moveBy(x0 - event.pageX, y0 - event.pageY);

      x0 = event.pageX;
      y0 = event.pageY;
    }
  }

  function handlePointerUp(event: Event) {
    if (!(event instanceof PointerEvent)) return;

    if (isRelevantEvent(event)) {
      event.preventDefault();
      end();
    }

    activePointers = 0;
  }

  function handleWheel(event: Event) {
    if (!(event instanceof WheelEvent) || shouldIgnore(event.target, ignore))
      return;

    event.preventDefault();

    if (!started) {
      start();
      wheelActive = true;
    }

    if (event.shiftKey) moveBy(event.deltaY, event.deltaX);
    else moveBy(event.deltaX, event.deltaY);

    if (wheelEndTimeout !== null) clearTimeout(wheelEndTimeout);

    wheelEndTimeout = setTimeout(() => {
      end();
      wheelActive = false;
      wheelEndTimeout = null;
    }, 200);
  }

  element.style.touchAction = "none";

  element.addEventListener("pointerdown", handlePointerDown);
  element.addEventListener("pointermove", handlePointerMove);
  element.addEventListener("pointerup", handlePointerUp);
  element.addEventListener("pointercancel", handlePointerUp);

  if (wheel) element.addEventListener("wheel", handleWheel);

  return () => {
    element.removeEventListener("pointerdown", handlePointerDown);
    element.removeEventListener("pointermove", handlePointerMove);
    element.removeEventListener("pointerup", handlePointerUp);
    element.removeEventListener("pointercancel", handlePointerUp);

    if (wheel) element.removeEventListener("wheel", handleWheel);
  };
}
