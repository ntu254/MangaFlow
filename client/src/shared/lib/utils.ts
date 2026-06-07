import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display-lg",
        "headline-lg",
        "headline-md",
        "title-lg",
        "body-lg",
        "body-md",
        "label-md",
        "label-sm",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
