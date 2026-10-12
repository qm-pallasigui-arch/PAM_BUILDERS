import { useState } from "react";
import { usePortalData } from "../../portal/data";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { formatDate } from "../../portal/utils";

export function ReportsList() {
  const { projects, reports } = usePortalData();
  const [projectFilter, setProjectFilter] = useState<number | "all">("all");

  const filtered = reports
    .filter((r) => projectFilter === "all" || r.projectId === projectFilter)
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">Progress Reports</h1>
          <p className="text-gray-500 text-sm mt-1">All daily site reports across projects.</p>
        </div>
        <select
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
        {filtered.length === 0 && <p className="text-sm text-gray-500">No reports found.</p>}
        {filtered.map((r) => {
          const project = projects.find((p) => p.id === r.projectId);
          return (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{project?.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(r.reportDate)} · {r.submittedByName}</p>
                  </div>
                  <Badge variant="active">{r.percentComplete}% complete</Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2">{r.description}</p>
                {r.photoDataUrl && <a href={r.photoDataUrl} target="_blank" rel="noreferrer"><img src={r.photoDataUrl} alt="Site progress" loading="lazy" className="mt-3 h-32 rounded-md border object-cover" /></a>}
                {(r.materials.length > 0 || r.manpower.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {r.materials.map((m, i) => (
                      <Badge key={`mat-${i}`} variant="outline">{m.materialName}: {m.quantity} {m.unit}</Badge>
                    ))}
                    {r.manpower.map((m, i) => (
                      <Badge key={`man-${i}`} variant="outline">{m.workerName} — {m.hoursWorked}h</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
