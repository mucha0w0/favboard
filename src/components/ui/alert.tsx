import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  error: "border-red-200/80 bg-red-50/50 text-red-700",
  success: "border-stone-200 bg-stone-50 text-stone-700",
  info: "border-stone-200 bg-stone-50 text-stone-600",
};

export function Alert({ variant = "info", children, className }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5 text-sm",
        variants[variant],
        className,
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
