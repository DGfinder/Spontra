import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Airport helpers
export function formatAirport(code?: string, detailedName?: string): string {
  if (!code) return ''
  if (detailedName) return detailedName
  return code
}