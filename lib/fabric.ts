/**
 * lib/fabric.ts
 *
 * Shared Fabric.js dynamic loader singleton.
 * -------------------------------------------------------------
 * Ensures Fabric.js is loaded dynamically ONLY on the client side (preventing
 * Next.js SSR evaluation errors with window/document), and guarantees that only
 * ONE module instance is ever imported and shared across the entire application.
 *
 * This prevents isolated module instances from creating mismatched prototype chains,
 * which otherwise causes "TypeError: objects[i].render is not a function" when
 * fabricCanvas.renderAll() is executed across canvas initialization, text additions,
 * image replacements, and background changes.
 */

let cachedFabric: any = null;
let fabricLoadPromise: Promise<any> | null = null;

/**
 * Loads the Fabric.js library dynamically on the client side.
 * Returns a cached singleton instance so all components and call sites
 * share the exact same Fabric module reference and prototype chain.
 */
export async function loadFabric(): Promise<any> {
  // Guard against SSR execution in Next.js
  if (typeof window === "undefined") {
    return null;
  }

  // Return cached instance if already loaded
  if (cachedFabric) {
    return cachedFabric;
  }

  // If loading is already in flight, reuse the same Promise
  if (!fabricLoadPromise) {
    fabricLoadPromise = import("fabric").then((mod) => {
      // Fabric.js in CommonJS/ESM can export { fabric }, default, or set window.fabric
      const fabricObj =
        (mod as any).fabric ||
        (mod as any).default?.fabric ||
        (mod as any).default ||
        (window as any).fabric ||
        mod;

      cachedFabric = fabricObj;

      // Keep window.fabric consistent with this singleton
      if (typeof window !== "undefined") {
        (window as any).fabric = fabricObj;
      }

      return fabricObj;
    });
  }

  return fabricLoadPromise;
}

/**
 * Synchronously returns the already-loaded Fabric singleton,
 * or checks window.fabric if available.
 */
export function getFabricSync(): any {
  if (cachedFabric) return cachedFabric;
  if (typeof window !== "undefined" && (window as any).fabric) {
    cachedFabric = (window as any).fabric;
    return cachedFabric;
  }
  return null;
}
