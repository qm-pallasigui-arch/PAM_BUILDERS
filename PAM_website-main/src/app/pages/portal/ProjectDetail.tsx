import { PageHeader } from "../../portal/PageHeader";
import { ReportCard } from "../../portal/ReportCard";
import { ApprovalControl } from "../../portal/ApprovalControl";
import { ReportCreateAction } from "../../portal/ReportCreateAction";
import { ProjectPermits } from "./ProjectPermits";
import { ProjectControls } from "./ProjectControls";
import { Link, useParams } from "react-router";
import { usePortalData } from "../../portal/data";
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

  const project = projects.find((p) => p.id === projectId);
  const projectSites = sites.filter((s) => s.projectId === projectId);
  const projectMilestones = milestones
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const projectReports = reports
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.id-a.id);

  if (!project) {
    return <p className="text-gray-500">Project not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline"><Link to="/portal/projects">Back to Projects</Link></Button>
      <PageHeader section="Project management / Project details" title={project.name} description={[project.client, project.location].filter(Boolean).join(" / ")} actions={<Badge variant={project.status === "ongoing" ? "ongoing" : project.status === "completed" ? "completed" : "outline"}>
          {projectStatusLabel(project.status)}
        </Badge>} />

      <ApprovalControl resource="projects" record={project} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Budget</p><p className="font-semibold">{formatCurrency(project.budget)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Start date</p><p className="font-semibold">{formatDate(project.startDate)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Sites</p><p className="font-semibold">{projectSites.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Approved progress</p><p className="font-semibold">{latestProgress(project.id, reports)}%</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3">
        <ProjectControls project={project} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="pt-6"><p className="text-gray-500">Target completion date</p><p className="font-semibold">{project.endDate?formatDate(project.endDate):'Not set'}</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-gray-500">Assigned personnel</p><p className="font-semibold">{project.assignedNames?.join(', ')||'No assigned personnel'}</p></CardContent></Card></section>
      <ProjectPermits project={project}/>
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
                  <Badge variant={m.status === "completed" ? "completed" : m.status === "in_progress" ? "ongoing" : "outline"}>
                    {{ pending: 'Pending', in_progress: 'In progress', completed: 'Completed' }[m.status]}
                  </Badge>
                  {delayed && <Badge className="ml-2" variant="destructive">Overdue</Badge>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <section className="space-y-4" aria-labelledby="project-reports-heading">
        <h2 id="project-reports-heading" className="text-lg font-semibold">Recent progress reports</h2>
        <ReportCreateAction projectId={project.id} />
        {projectReports.length === 0 && <p className="text-sm text-gray-500">No reports submitted yet.</p>}
        {projectReports.map(r => <ReportCard key={r.id} report={r} projectName={project.name} />)}
      </section>
    </div>
  );
}
