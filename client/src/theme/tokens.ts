export const mangaFlowTheme = {
  colors: {
    primary: "#9065d5",
    primaryHover: "#7f55c7",
    pinkPurple: "#e560bc",
    rosePink: "#ff7196",
    coral: "#ff9971",
    softYellow: "#ffc95e",
    pastelLime: "#f9f871",
  },
  bg: {
    main: "#fff9fb",
    soft: "#fff3f8",
    card: "#ffffff",
    sidebar: "#f8f1ff",
    panel: "#fff7ec",
    canvas: "#f7f3ff",
  },
  text: {
    primary: "#2f243a",
    secondary: "#5f5270",
    muted: "#8a7a99",
    disabled: "#b8a9c7",
  },
  border: {
    default: "#eadff6",
    soft: "#f3d7e7",
    active: "#9065d5",
    warning: "#ffc95e",
  },
  button: {
    primary: { bg: "#9065d5", text: "#ffffff", hover: "#7f55c7" },
    secondary: { bg: "#ffe6f2", text: "#e560bc", hover: "#ffd4eb" },
    accent: { bg: "#ff9971", text: "#ffffff", hover: "#ff865a" },
    warning: { bg: "#ffc95e", text: "#3a2a00", hover: "#ffbd3d" },
    danger: { bg: "#ff7196", text: "#ffffff", hover: "#f05f86" },
  },
  status: {
    draft: { bg: "#f1edf7", text: "#6d5d7c" },
    inProgress: { bg: "#ece5ff", text: "#9065d5" },
    submitted: { bg: "#ffe6f2", text: "#e560bc" },
    review: { bg: "#fff0dc", text: "#d97706" },
    approved: { bg: "#f4ffd2", text: "#7a8f00" },
    revision: { bg: "#ffe7de", text: "#e15f2f" },
    rejected: { bg: "#ffe1e8", text: "#e11d48" },
    atRisk: { bg: "#fff0c2", text: "#b45309" },
    published: { bg: "#f9f871", text: "#5f6500" },
  },
  shadow: {
    soft: "0 8px 24px rgba(144, 101, 213, 0.10)",
    card: "0 12px 32px rgba(229, 96, 188, 0.08)",
    floating: "0 16px 40px rgba(47, 36, 58, 0.14)",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "18px",
    xl: "24px",
  },
} as const;

export type MangaFlowTheme = typeof mangaFlowTheme;
