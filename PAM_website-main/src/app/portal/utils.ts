import type { Milestone, Project, ProgressReport } from "./types";

/** A milestone is "delayed" if its due date has passed and it isn't completed. Computed on the fly — never stored. */
export function isMilestoneDelayed(milestone: Milestone): boolean {
  if (milestone.status === "completed") return false;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return milestone.dueDate < today;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Latest reported % complete for a project, from its most recent progress report (0 if none yet). */
export function latestProgress(projectId: number, reports: ProgressReport[]): number {
  const projectReports = reports
    .filter((r) => r.projectId === projectId && (!r.approvalStatus || r.approvalStatus === 'approved'))
    .sort((a, b) => b.id - a.id);
  return projectReports[0]?.percentComplete ?? 0;
}

export function projectStatusLabel(status: Project["status"]): string {
  switch (status) {
    case "ongoing":
      return "Ongoing";
    case "on_hold":
      return "On Hold";
    case "completed":
      return "Completed";
  }
}
