export const SYSTEM_ROLES = {
  ADMIN: "ADMIN",
  MANGAKA: "MANGAKA",
  ASSISTANT: "ASSISTANT",
  EDITOR: "EDITOR",
  BOARD: "BOARD"
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

export const SERIES_MEMBER_ROLES = {
  OWNER_MANGAKA: "OWNER_MANGAKA",
  CO_MANGAKA: "CO_MANGAKA",
  EDITOR: "EDITOR",
  ASSISTANT: "ASSISTANT",
  REVIEWER: "REVIEWER"
} as const;

export type SeriesMemberRole = typeof SERIES_MEMBER_ROLES[keyof typeof SERIES_MEMBER_ROLES];
