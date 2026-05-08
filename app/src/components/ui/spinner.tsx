import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center gap-[3px]", className)}
      {...props}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[4px] h-[4px] rounded-full bg-current"
          style={{
            animation: `orbitalPulse 1.4s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

export { Spinner }
