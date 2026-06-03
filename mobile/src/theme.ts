export const colors = {
  primary: "#9065d5",
  pinkPurple: "#e560bc",
  rosePink: "#ff7196",
  coral: "#ff9971",
  softYellow: "#ffc95e",
  pastelLime: "#f9f871",
  bgMain: "#fff9fb",
  bgSoft: "#fff3f8",
  bgCard: "#ffffff",
  bgSidebar: "#f8f1ff",
  bgPanel: "#fff7ec",
  bgCanvas: "#f7f3ff",
  textPrimary: "#2f243a",
  textSecondary: "#5f5270",
  textMuted: "#8a7a99",
  borderDefault: "#eadff6",
  borderSoft: "#f3d7e7",
  successText: "#5f6500",
  warningText: "#b45309"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24
} as const;

export const shadow = {
  shadowColor: colors.pinkPurple,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 3
} as const;

