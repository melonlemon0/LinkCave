"use client";

import { Capacitor } from "@capacitor/core";
import { useLayoutEffect } from "react";

const CLASS = "native-ios-shell";

/** Capacitor iOS WebView: follow system light/dark on `html` + `body` (see globals.css). */
export function NativeIosDocumentClass() {
  useLayoutEffect(() => {
    if (Capacitor.getPlatform() !== "ios") return;
    document.documentElement.classList.add(CLASS);
    return () => {
      document.documentElement.classList.remove(CLASS);
    };
  }, []);
  return null;
}
