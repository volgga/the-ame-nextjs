import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", asChild = false, children, ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        className: `${baseClasses} ${className}`,
        ...props,
      });
    }

    return (
      <button ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
