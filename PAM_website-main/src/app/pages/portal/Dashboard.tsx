import { PageHeader } from "../../portal/PageHeader";
import { Link } from "react-router";
import { FolderKanban, Flag, ClipboardList, AlertTriangle } from "lucide-react";
import { useAuth } from "../../portal/auth";
import { usePortalData } from "../../portal/data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { isMilestoneDelayed, formatDate, latestProgress, projectStatusLabel } from "../../portal/utils";

export function Dashboard() {
  const { user } = useAuth();
  const { projects, milestones, reports } = usePortalData();

  const ongoingProjects = projects.filter((p) => p.status === "ongoing");
  const delayedMilestones = milestones.filter(isMilestoneDelayed);
  const reportsThisWeek = reports.filter((r) => {
    const d = new Date(r.reportDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  return (
    <div className="space-y-6">
      <PageHeader section="Dashboard" title={`Welcome back, ${user?.name.split(" ")[0] ?? "team"}`} description="Your overview of projects, deadlines, and recent site activity." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ongoing Projects</p>
              <p className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">{ongoingProjects.length}</p>
            </div>
            <FolderKanban className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Delayed Milestones</p>
              <p className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">{delayedMilestones.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reports (last 7 days)</p>
              <p className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">{reportsThisWeek.length}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Status Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/portal/projects/${p.id}`}
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md portal-interactive border border-transparent"
            >
              <div>
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-500">{p.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{latestProgress(p.id, reports)}% complete</span>
                <Badge variant={p.status === "ongoing" ? "ongoing" : p.status === "completed" ? "completed" : "outline"}>
                  {projectStatusLabel(p.status)}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {delayedMilestones.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <Flag className="h-4 w-4" /> Delayed Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {delayedMilestones.map((m) => {
              const project = projects.find((p) => p.id === m.projectId);
              return (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 text-sm py-3">
                  <span>
                    <span className="font-medium text-gray-900">{m.title}</span>
                    <span className="text-gray-500"> — {project?.name}</span>
                  </span>
                  <span className="text-red-600">Due {formatDate(m.dueDate)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
