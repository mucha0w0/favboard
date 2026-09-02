import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  error: "text-red-600",
  success: "text-stone-600",
  info: "text-stone-500",
};

export function Alert({ variant = "info", children, className }: AlertProps) {
  return (
    <p
      className={cn("text-sm", variants[variant], className)}
      role="alert"
    >
      {children}
    </p>
  );
}
