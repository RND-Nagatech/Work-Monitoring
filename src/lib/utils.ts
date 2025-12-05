import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStatus(status: 'OPEN' | 'ON PROGRESS' | 'DONE'): string {
  switch (status) {
    case 'OPEN':
      return 'Open';
    case 'ON PROGRESS':
      return 'In Progress';
    case 'DONE':
      return 'Done';
    default:
      return status;
  }
}
