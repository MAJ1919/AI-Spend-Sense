import * as React from "react"
import * as SliderPrimitives from "@radix-ui/react-slider"
import { cn } from "../../lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitives.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitives.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-input">
      <SliderPrimitives.Range className="absolute h-full bg-brand-accent" />
    </SliderPrimitives.Track>
    <SliderPrimitives.Thumb className="block h-4 w-4 rounded-full border border-brand-accent/50 bg-brand-accent shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitives.Root>
))
Slider.displayName = SliderPrimitives.Root.displayName

export { Slider }
