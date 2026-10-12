import { ProjectControls } from "./ProjectControls";
import { Link, useParams } from "react-router";
import { Plus } from "lucide-react";
import { usePortalData } from "../../portal/data";
import { useAuth } from "../../portal/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../portal/Button";
import {
  isMilestoneDelayed,
  formatDate,
  formatCurrency,
  latestProgress,
  projectStatusLabel,
} from "../../portal/utils";

export function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const { projects, sites, milestones, reports } = usePortalData();
  const { user } = useAuth();

  const project = projects.find((p) => p.id === projectId);
  const projectSites = sites.filter((s) => s.projectId === projectId);
  const projectMilestones = milestones
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const projectReports = reports
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate));

  if (!project) {
    return <p className="text-gray-500">Project not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">{project.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{project.client} · {project.location}</p>
        </div>
        <Badge variant={project.status === "ongoing" ? "ongoing" : project.status === "completed" ? "completed" : "outline"}>
          {projectStatusLabel(project.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Budget</p><p className="font-semibold">{formatCurrency(project.budget)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Start date</p><p className="font-semibold">{formatDate(project.startDate)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Sites</p><p className="font-semibold">{projectSites.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Latest progress</p><p className="font-semibold">{latestProgress(project.id, reports)}%</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3">
        {user && project.assignedUserIds?.includes(user.id) && (
          <Button asChild>
            <Link to={`/portal/projects/${project.id}/submit-report`}>
              <Plus className="h-4 w-4" /> Submit Daily Progress Report
            </Link>
          </Button>
        )}
        <ProjectControls project={project} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {projectMilestones.length === 0 && <p className="text-sm text-gray-500">No milestones yet.</p>}
          {projectMilestones.map((m) => {
            const delayed = isMilestoneDelayed(m);
            return (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <p className="text-sm text-gray-500">{m.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Due {formatDate(m.dueDate)}</p>
                  <Badge variant={delayed ? "destructive" : m.status === "completed" ? "completed" : m.status === "in_progress" ? "ongoing" : "outline"}>
                    {delayed ? "Delayed" : m.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Progress Reports</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {projectReports.length === 0 && <p className="text-sm text-gray-500">No reports submitted yet.</p>}
          {projectReports.map((r) => (
            <div key={r.id} className="border-b last:border-b-0 pb-3 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-medium text-gray-900">{formatDate(r.reportDate)} — {r.submittedByName}</p>
                <Badge variant="active">{r.percentComplete}% complete</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">{r.description}</p>
              {r.photoDataUrl && <a href={r.photoDataUrl} target="_blank" rel="noreferrer"><img src={r.photoDataUrl} alt="Site progress" loading="lazy" className="mt-3 h-32 rounded-md border object-cover" /></a>}
                {(r.materials.length > 0 || r.manpower.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {r.materials.map((m, i) => (
                    <Badge key={`mat-${i}`} variant="outline">{m.materialName}: {m.quantity} {m.unit}</Badge>
                  ))}
                  {r.manpower.map((m, i) => (
                    <Badge key={`man-${i}`} variant="outline">{m.workerName} ({m.position})</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
