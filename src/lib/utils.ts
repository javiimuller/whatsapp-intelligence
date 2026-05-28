import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function average(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function mostCommon(arr: string[], fallback = "N/A"): string {
  if (!arr.length) return fallback;
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
}

export function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    const key = value || "Sin datos";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function parseAnalysis(jsonString: string | any) {
  if (!jsonString) return null;
  if (typeof jsonString === "object") return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}
