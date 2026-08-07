export const colors = {
  background: "#f6f5fb",
  surface: "#ffffff",
  surfaceLow: "#fcfaff",
  surfaceContainer: "#f3eefa",
  text: "#120e1b",
  textMuted: "#5e5868",
  textLight: "#8c8597",
  outline: "#857c91",
  outlineVariant: "#e9e3f0",
  outlineSoft: "#f0ebf7",
  primary: "#6344f5",
  primaryPressed: "#4f2ee5",
  primarySoft: "#f0ebff",
  primaryGlow: "rgba(99, 68, 245, 0.15)",
  secondary: "#d946ef",
  tertiary: "#f43f5e",
  coral: "#ff7043",
  warning: "#d97706",
  warningSoft: "#fef3c7",
  warningText: "#b45309",
  danger: "#ef4444",
  dangerSoft: "#fee2e2",
  dangerText: "#b91c1c",
  success: "#10b981",
  successSoft: "#d1fae5",
  successText: "#047857",
  info: "#0284c7",
  infoSoft: "#e0f2fe",
  infoText: "#0369a1",
  inkWash: "#eee8ff",
  headerWash: "#f4efff",
  chip: "#f5f0ff",
  badgeBg: "#ede9fe",
  badgeText: "#5b21b6",
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const

export const radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const

export const shadow = {
  sm: {
    shadowColor: "#6344f5",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  card: {
    shadowColor: "#58429b",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  floating: {
    shadowColor: "#4f2ee5",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  glow: {
    shadowColor: "#6344f5",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
} as const

export const typography = {
  display: 30,
  hero: 24,
  title: 18,
  subtitle: 16,
  body: 14,
  caption: 13,
  label: 11,
} as const


