import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

// jsdom n'implémente ni PointerEvent ni les méthodes de capture associées —
// requis par Radix Select (et d'autres primitives Radix) pour ouvrir/fermer
// leur popover via userEvent.click(). Polyfills standards pour jsdom
// (voir https://github.com/jsdom/jsdom/issues/2527, toujours non implémenté).
if (typeof window !== "undefined" && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent implements PointerEvent {
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;
    altitudeAngle: number;
    azimuthAngle: number;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
      this.isPrimary = params.isPrimary ?? true;
      this.altitudeAngle = params.altitudeAngle ?? 0;
      this.azimuthAngle = params.azimuthAngle ?? 0;
    }

    getCoalescedEvents(): PointerEvent[] {
      return [];
    }

    getPredictedEvents(): PointerEvent[] {
      return [];
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

// jsdom n'implémente pas non plus ResizeObserver — utilisé par Radix Select
// pour mesurer le popover avant de l'ouvrir.
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

afterEach(() => {
  cleanup();
});
