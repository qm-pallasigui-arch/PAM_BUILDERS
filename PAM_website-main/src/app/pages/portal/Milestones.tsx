import { PageHeader } from "../../portal/PageHeader";
import { AddCard } from "../../portal/AddCard";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { ContentState } from "../../portal/ContentState";
import type { MilestoneStatus } from "../../portal/types";
import { Check } from "lucide-react";
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
  DialogFooter,
} from "../../components/ui/dialog";
import { isMilestoneDelayed, formatDate } from "../../portal/utils";

export function Milestones() {
  const { projects, milestones, addMilestone, setMilestoneStatus } = usePortalData();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const addCardRef = useRef<HTMLButtonElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const updateLock = useRef(false);
  const changeStatus = async (id: number, status: MilestoneStatus) => {
    if (updateLock.current) return;
    updateLock.current = true; setUpdating(id);
    try { await setMilestoneStatus(id, status); toast.success(status === 'completed' ? 'Milestone completed.' : 'Milestone started.'); }
    catch (error) { toast.error((error as Error).message); }
    finally { updateLock.current = false; setUpdating(null); }
  };
  const [form, setForm] = useState({
    projectId: projects[0]?.id ?? 0,
    title: "",
    description: "",
    dueDate: "",
  });

  const sorted = [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const handleCreate = async () => {
    if (submitting) return;
    if (!form.title.trim() || !form.dueDate || !form.projectId) { setFormError('Choose a project and enter a title and due date.'); return; }
    setFormError(null);
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
    toast.success('Milestone created.');
    } catch (error) { setFormError((error as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader section="Project management" title="Milestones" description="Track important deadlines across projects. Unfinished milestones become overdue after their due date." />
        <Dialog open={open} onOpenChange={value => { if (!submitting) { setOpen(value); setFormError(null); } }}>
          <DialogContent onCloseAutoFocus={event => { event.preventDefault(); addCardRef.current?.focus(); }}>
            <DialogHeader><DialogTitle>New Milestone</DialogTitle></DialogHeader>
            <fieldset disabled={submitting} className="space-y-3">
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
                <Input id="m-title" required aria-invalid={!!formError && !form.title.trim()} aria-describedby={formError ? 'milestone-form-error' : undefined} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-desc">Description</Label>
                <Textarea id="m-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-due">Due date</Label>
                <Input id="m-due" type="date" required aria-invalid={!!formError && !form.dueDate} aria-describedby={formError ? 'milestone-form-error' : undefined} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </fieldset>
            {formError && <p id="milestone-form-error" role="alert" className="text-sm text-red-700">{formError}</p>}
            <DialogFooter>
              <Button variant="outline" disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700" loading={submitting} loadingLabel="Creating milestone..." onClick={handleCreate}>Create milestone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 && <p className="text-sm text-gray-600">A project must be available before you can create a milestone.</p>}
      {projects.length > 0 && <AddCard buttonRef={addCardRef} title="Add milestone" description="Set a deadline and track an important project outcome." onClick={() => setOpen(true)} />}
      {sorted.length === 0 && <ContentState title="No milestones yet" description="Milestones track important deadlines and completion across your projects." />}
      {sorted.length > 0 && <Card>
        <CardContent className="pt-6 space-y-2">
          {sorted.map((m) => {
            const project = projects.find((p) => p.id === m.projectId);
            const delayed = isMilestoneDelayed(m);
            return (
              <div key={m.id} className="flex flex-wrap gap-3 items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <p className="text-sm text-gray-500">{project?.name} · Due {formatDate(m.dueDate)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={m.status === "completed" ? "completed" : m.status === "in_progress" ? "ongoing" : "outline"}>
                    {{ pending: 'Pending', in_progress: 'In progress', completed: 'Completed' }[m.status]}
                  </Badge>
                  {delayed && <Badge variant="destructive">Overdue</Badge>}
                  {m.status === 'pending' && <Button variant="outline" disabled={updating !== null} loading={updating === m.id} loadingLabel="Updating..." onClick={() => void changeStatus(m.id, 'in_progress')}>Start work</Button>}
                  {m.status !== "completed" && (
                    <Button size="default" variant="outline" disabled={updating !== null} loading={updating === m.id} loadingLabel="Updating..." onClick={() => void changeStatus(m.id, "completed")}>
                      <Check className="h-4 w-4" /> Mark complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>}
    </div>
  );
}
