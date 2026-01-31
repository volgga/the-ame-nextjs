type ChevronArrowProps = {
  direction: "left" | "right";
  className?: string;
};

/** Chevron-стрелка (уголок), белая, ~3px stroke, для навигации слайдера */
export function ChevronArrow({ direction, className = "" }: ChevronArrowProps) {
  const isLeft = direction === "left";
  return (
    <svg
      width="32"
      height="40"
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d={isLeft ? "M24 4L8 20L24 36" : "M8 4L24 20L8 36"}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
