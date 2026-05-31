/** Shared layout width tokens — dashboards use full available width */
export const layout = {
  /** Marketing / catalog pages */
  page: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
  /** Dashboards, admin tables, wide grids */
  dashboard: "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8",
  /** Learn experience, course content */
  wide: "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8",
  /** Forms, auth, narrow flows */
  narrow: "mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8",
  /** Certificate / verify */
  medium: "mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8",
} as const;
