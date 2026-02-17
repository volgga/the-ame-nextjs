"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HomeBelowFoldSkeleton } from "./HomeBelowFoldSkeleton";

const ROOT_MARGIN = "800px 0px";
const TRIGGER_ONCE = true;

type ProgressiveBelowFoldProps = {
  children: ReactNode;
};

/**
 * Обёртка для контента ниже первого экрана на главной.
 * Контент всегда виден сразу, без скрытия. Skeleton показывается только как placeholder
 * во время загрузки, если нужно (опционально).
 */
export function ProgressiveBelowFold({ children }: ProgressiveBelowFoldProps) {
  return <>{children}</>;
}
