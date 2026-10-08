import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl uppercase tracking-widest font-bold transition-all disabled:opacity-50 disabled:pointer-events-none active:border-b-0 active:translate-y-[4px]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-blue-500)] text-white border-b-4 border-[var(--color-blue-600)] hover:bg-[var(--color-blue-500)]/90",
        secondary: "bg-[var(--color-green-500)] text-white border-b-4 border-[var(--color-green-600)] hover:bg-[var(--color-green-500)]/90",
        danger: "bg-[var(--color-red-500)] text-white border-b-4 border-[var(--color-red-600)] hover:bg-[var(--color-red-500)]/90",
        ghost: "bg-transparent text-[var(--color-gray-text)] border-transparent border-0 hover:bg-[var(--color-gray-bg)] active:translate-y-0",
        outline: "bg-transparent text-[var(--color-blue-500)] border-2 border-[var(--color-gray-border)] hover:bg-[var(--color-gray-bg)] active:translate-y-0 active:border-2",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
