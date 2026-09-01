import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

export function Alert({ variant = "info", children, className }: AlertProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variants[variant],
        className,
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
