import { apiBaseUrl, parseApiResponse } from "@/shared/api";

export type TaskRate = {
  id: string;
  taskType: string;
  rate: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssistantEarning = {
  id: string;
  assistantId: string;
  taskId: string;
  seriesId: string;
  taskType: string;
  basePayment: number;
  bonusRate: number;
  bonusAmount: number;
  penaltyAmount: number;
  revisionFee: number;
  finalPayment: number;
  timingStatus: "EARLY" | "ON_TIME" | "LATE_WITHIN_24H" | "LATE";
  status: "PENDING" | "CONFIRMED" | "PAID" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  assistantName?: string;
  taskTitle?: string;
  seriesTitle?: string;
};

export type MonthlyPayrollSummary = {
  totalPending: number;
  totalConfirmed: number;
  totalPaid: number;
  count: number;
};

export async function fetchTaskRates(token: string): Promise<TaskRate[]> {
  const response = await fetch(`${apiBaseUrl}/task-rates`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<TaskRate[]>(response, "Failed to fetch task rates");
}

export async function createTaskRate(
  token: string,
  input: { taskType: string; rate: number; currency?: string; isActive?: boolean }
): Promise<TaskRate> {
  const response = await fetch(`${apiBaseUrl}/task-rates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
  return parseApiResponse<TaskRate>(response, "Failed to create task rate");
}

export async function updateTaskRate(
  token: string,
  taskRateId: string,
  input: { rate?: number; currency?: string; isActive?: boolean }
): Promise<TaskRate> {
  const response = await fetch(`${apiBaseUrl}/task-rates/${taskRateId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(input)
  });
  return parseApiResponse<TaskRate>(response, "Failed to update task rate");
}

export async function deactivateTaskRate(token: string, taskRateId: string): Promise<TaskRate> {
  const response = await fetch(`${apiBaseUrl}/task-rates/${taskRateId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<TaskRate>(response, "Failed to deactivate task rate");
}

export async function fetchMyEarnings(token: string): Promise<AssistantEarning[]> {
  const response = await fetch(`${apiBaseUrl}/payroll/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<AssistantEarning[]>(response, "Failed to fetch earnings");
}

export async function fetchSeriesPayroll(token: string, seriesId: string): Promise<AssistantEarning[]> {
  const response = await fetch(`${apiBaseUrl}/payroll/series/${seriesId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<AssistantEarning[]>(response, "Failed to fetch series payroll");
}

export async function calculateTaskEarning(token: string, taskId: string): Promise<AssistantEarning> {
  const response = await fetch(`${apiBaseUrl}/payroll/tasks/${taskId}/calculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<AssistantEarning>(response, "Failed to calculate task earning");
}

export async function confirmTaskEarning(token: string, taskId: string): Promise<AssistantEarning> {
  const response = await fetch(`${apiBaseUrl}/payroll/tasks/${taskId}/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<AssistantEarning>(response, "Failed to confirm earning");
}

export async function markPaid(token: string, earningId: string): Promise<AssistantEarning> {
  const response = await fetch(`${apiBaseUrl}/payroll/${earningId}/mark-paid`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<AssistantEarning>(response, "Failed to mark earning as paid");
}

export async function fetchMonthlySummary(token: string): Promise<MonthlyPayrollSummary> {
  const response = await fetch(`${apiBaseUrl}/payroll/monthly`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return parseApiResponse<MonthlyPayrollSummary>(response, "Failed to fetch monthly summary");
}
