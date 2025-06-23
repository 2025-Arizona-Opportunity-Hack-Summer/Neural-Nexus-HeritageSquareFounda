import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  const nameParts = name.split(" ").filter((part) => part.length > 0);
  const initials = nameParts.map((part) => part[0].toUpperCase());

  return initials.join("");
}
