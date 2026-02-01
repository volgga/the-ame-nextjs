import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors";
    const variantClasses =
      variant === "outline"
        ? "border border-outline-btn-border text-color-text-main bg-transparent hover:bg-outline-btn-hover-bg active:bg-outline-btn-active-bg"
        : "bg-badge-bg text-badge-text";

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${className}`}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
