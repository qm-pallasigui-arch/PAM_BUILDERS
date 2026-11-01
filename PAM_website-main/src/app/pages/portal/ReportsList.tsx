import { ReportCard } from "../../portal/ReportCard";
import { PageHeader } from "../../portal/PageHeader";
import { ReportCreateAction } from "../../portal/ReportCreateAction";
import { useState } from "react";
import { Link } from "react-router";
import { ContentState } from "../../portal/ContentState";
import { Button } from "../../portal/Button";
import { usePortalData } from "../../portal/data";

export function ReportsList() {
  const { projects, reports } = usePortalData();
  const [projectFilter, setProjectFilter] = useState<number | "all">("all");

  const filtered = reports
    .filter((r) => projectFilter === "all" || r.projectId === projectFilter)
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader section="Site reporting" title="Progress reports" description="Review daily site updates, photos, and approval decisions." />
        <select
          aria-label="Filter reports by project"
          className="h-9 rounded-md border border-gray-300 px-3 text-sm"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <ReportCreateAction projectId={projectFilter === "all" ? undefined : projectFilter} />
        {filtered.length === 0 && <ContentState title={projectFilter === 'all' ? 'No progress reports yet' : 'No reports for this project'} description={projectFilter === 'all' ? 'Open a project to submit its first site report.' : 'Choose another project or clear the filter to see all reports.'} action={projectFilter === 'all' ? <Button asChild variant="outline"><Link to="/portal/projects">View projects</Link></Button> : <Button variant="outline" onClick={() => setProjectFilter('all')}>Clear filter</Button>} />}
        {filtered.map(r => <ReportCard key={r.id} report={r} projectName={projects.find(p => p.id === r.projectId)?.name ?? 'Project'} />)}
      </div>
    </div>
  );
}
