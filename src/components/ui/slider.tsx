"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track 
      className="relative h-2 w-full grow cursor-pointer rounded-full bg-gray-200 dark:bg-gray-700"
    >
      <SliderPrimitive.Range 
        className="absolute h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" 
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="opacity-0 pointer-events-none"
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider } 