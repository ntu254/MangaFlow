export function statusTone(status: string) {
  if (status.includes("RISK") || status.includes("REVISION") || status.includes("REJECTED")) {
    return "danger" as const;
  }
  if (status.includes("WARNING") || status.includes("REVIEW")) {
    return "warning" as const;
  }
  if (status.includes("APPROVED") || status.includes("READY")) {
    return "success" as const;
  }
  return "default" as const;
}

export type DialogPayload = {
  title: string;
  message: string;
  confirmLabel: string;
  actionType: string;
  payload: any;
};

export type OnAction = (
  title: string,
  message: string,
  confirmLabel: string,
  actionType: string,
  payload: any
) => void;
