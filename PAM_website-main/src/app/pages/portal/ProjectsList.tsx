import { PageHeader } from "../../portal/PageHeader";
import { ApprovalBadge } from "../../portal/ApprovalControl";
import { AddCard } from "../../portal/AddCard";
import { ProjectAppearance } from './ProjectAppearance';
import { useWebsiteContent,projectColor } from '../../portal/content';
import { toast } from "sonner";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../portal/auth";
import { usePortalData } from "../../portal/data";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../portal/Button";
import { ContentState } from "../../portal/ContentState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { latestProgress, projectStatusLabel, formatCurrency } from "../../portal/utils";

export function ProjectsList() {
  const {content}=useWebsiteContent();
  const [appearance,setAppearance]=useState<{category:string;color:string|null}>({category:'General',color:null});
  const { hasRole } = useAuth();
  const { projects, reports, addProject } = usePortalData();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const addCardRef = useRef<HTMLButtonElement>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    client: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "",
    siteName: "Main Site",
    siteAddress: "",
  });

  const canCreate = hasRole("admin", "project_manager");

  const handleCreate = async () => {
    if (submitting) return;
    if (!form.name.trim() || !form.location.trim() || !form.startDate) {
      setFormError('Enter a project name, location, and start date.'); return;
    }
    if (Number(form.budget) < 0 || (form.endDate && form.endDate < form.startDate)) {
      setFormError('Use a non-negative budget and a target completion date on or after the start date.'); return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
    await addProject(
      {
        ...appearance,
        name: form.name,
        client: form.client,
        location: form.location,
        startDate: form.startDate,
        endDate: form.endDate || null,
        budget: Number(form.budget) || 0,
        status: "ongoing",
      },
      form.siteName || "Main Site",
      form.siteAddress || form.location
    );
    setForm({ name: "", client: "", location: "", startDate: "", endDate: "", budget: "", siteName: "Main Site", siteAddress: "" });
    setOpen(false);
    toast.success(hasRole('admin') ? 'Project created and approved.' : 'Project submitted for admin approval.');
    } catch (error) { setFormError((error as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader section="Project management" title="Projects" description="Track construction projects, approvals, and site progress." />
        {canCreate && (
          <Dialog open={open} onOpenChange={value => { if (!submitting) { setOpen(value); setFormError(null); } }}>
            <DialogContent onCloseAutoFocus={event => { event.preventDefault(); addCardRef.current?.focus(); }} className="max-h-[85dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
              </DialogHeader>
              <fieldset disabled={submitting} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Project name</Label>
                  <Input id="p-name" required aria-invalid={!!formError && !form.name.trim()} aria-describedby={formError ? 'project-form-error' : undefined} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-client">Client</Label>
                  <Input id="p-client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-location">Location</Label>
                  <Input id="p-location" required aria-invalid={!!formError && !form.location.trim()} aria-describedby={formError ? 'project-form-error' : undefined} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-start">Start date</Label>
                    <Input id="p-start" type="date" required aria-invalid={!!formError && !form.startDate} aria-describedby={formError ? 'project-form-error' : undefined} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-budget">Budget (â‚±)</Label>
                    <Input id="p-budget" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-site-address">Site address</Label>
                  <Input id="p-site-address" value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
                </div>
              <label className="block">Target completion date<Input type="date" min={form.startDate} value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></label>
              <ProjectAppearance {...appearance} onChange={patch=>setAppearance(a=>({...a,...patch}))}/>
              </fieldset>
              {formError && <p id="project-form-error" role="alert" className="text-sm text-red-700">{formError}</p>}
              <DialogFooter>
                <Button variant="outline" disabled={submitting} onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="bg-orange-600 hover:bg-orange-700" loading={submitting} loadingLabel="Creating project..." onClick={handleCreate}>Create project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {projects.length === 0 && <ContentState title={canCreate ? 'Create your first project' : 'No assigned projects yet'} description={canCreate ? 'Add a project to start tracking sites, reports, and milestones.' : 'Projects will appear here when an administrator assigns you to them.'} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canCreate && <AddCard buttonRef={addCardRef} title="Add project" description="Set up a project, its site, and target dates." onClick={() => setOpen(true)} />}
        {projects.map((p) => (
          <Link className="portal-interactive group block rounded-xl" key={p.id} to={`/portal/projects/${p.id}`}>
            <Card className="h-full transition-colors group-hover:bg-orange-50 group-hover:border-orange-300 group-focus-visible:bg-orange-50" style={{borderTop:`5px solid ${projectColor(p,content)}`}}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <Badge variant={p.status === "ongoing" ? "ongoing" : p.status === "completed" ? "completed" : "outline"}>
                    {projectStatusLabel(p.status)}
                  </Badge>
                </div>
                <ApprovalBadge status={p.approvalStatus} />
                <p className="text-xs text-gray-500">{p.category??'General'}</p>
                <dl className="grid grid-cols-2 gap-3 py-3"><div className="col-span-2"><dt className="text-xs text-gray-500">Budget</dt><dd className="text-xl font-semibold">{formatCurrency(p.budget)}</dd></div><div><dt className="text-xs text-gray-500">Client</dt><dd className="font-medium break-words">{p.client||'Not set'}</dd></div><div><dt className="text-xs text-gray-500">Location</dt><dd className="font-medium break-words">{p.location||'Not set'}</dd></div></dl>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Approved progress</span>
                    <span>{latestProgress(p.id, reports)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${latestProgress(p.id, reports)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
