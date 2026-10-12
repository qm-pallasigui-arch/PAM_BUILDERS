import { toast } from "sonner";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { usePortalData } from "../../portal/data";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../portal/Button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../components/ui/dialog";
import { isMilestoneDelayed, formatDate } from "../../portal/utils";

export function Milestones() {
  const { projects, milestones, addMilestone, setMilestoneStatus } = usePortalData();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? 0,
    title: "",
    description: "",
    dueDate: "",
  });

  const sorted = [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const handleCreate = async () => {
    if (!form.title || !form.dueDate || !form.projectId) return;
    if (submitting) return;
    setSubmitting(true);
    try {
    await addMilestone({
      projectId: form.projectId,
      title: form.title,
      description: form.description,
      dueDate: form.dueDate,
      status: "pending",
    });
    setForm({ projectId: projects[0]?.id ?? 0, title: "", description: "", dueDate: "" });
    setOpen(false);
    } catch (error) { toast.error((error as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">Milestones</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tracked across all projects. A milestone is automatically flagged <span className="text-red-600 font-medium">Delayed</span> once its due date passes without being marked complete.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4" /> New Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Milestone</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="m-project">Project</Label>
                <select
                  id="m-project"
                  className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: Number(e.target.value) })}
                >
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-title">Title</Label>
                <Input id="m-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-desc">Description</Label>
                <Textarea id="m-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-due">Due date</Label>
                <Input id="m-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700" disabled={submitting} onClick={handleCreate}>Create milestone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-2">
          {sorted.map((m) => {
            const project = projects.find((p) => p.id === m.projectId);
            const delayed = isMilestoneDelayed(m);
            return (
              <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <p className="text-sm text-gray-500">{project?.name} · Due {formatDate(m.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={delayed ? "destructive" : m.status === "completed" ? "completed" : m.status === "in_progress" ? "ongoing" : "outline"}>
                    {delayed ? "Delayed" : m.status.replace("_", " ")}
                  </Badge>
                  {m.status !== "completed" && (
                    <Button size="default" variant="outline" onClick={() => void setMilestoneStatus(m.id, "completed").catch(error => toast.error(error.message))}>
                      <Check className="h-4 w-4" /> Mark complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
