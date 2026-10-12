import { toast } from "sonner";
import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useAuth } from "../../portal/auth";
import { usePortalData } from "../../portal/data";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../portal/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { latestProgress, projectStatusLabel, formatCurrency } from "../../portal/utils";

export function ProjectsList() {
  const { hasRole } = useAuth();
  const { projects, reports, addProject } = usePortalData();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    client: "",
    location: "",
    startDate: "",
    budget: "",
    siteName: "Main Site",
    siteAddress: "",
  });

  const canCreate = hasRole("admin");

  const handleCreate = async () => {
    if (!form.name || !form.location || !form.startDate) return;
    if (submitting) return;
    setSubmitting(true);
    try {
    await addProject(
      {
        name: form.name,
        client: form.client,
        location: form.location,
        startDate: form.startDate,
        endDate: null,
        budget: Number(form.budget) || 0,
        status: "ongoing",
      },
      form.siteName || "Main Site",
      form.siteAddress || form.location
    );
    setForm({ name: "", client: "", location: "", startDate: "", budget: "", siteName: "Main Site", siteAddress: "" });
    setOpen(false);
    } catch (error) { toast.error((error as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold leading-8 tracking-tight text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">All concurrent construction projects.</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Project name</Label>
                  <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-client">Client</Label>
                  <Input id="p-client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-location">Location</Label>
                  <Input id="p-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-start">Start date</Label>
                    <Input id="p-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-budget">Budget (₱)</Label>
                    <Input id="p-budget" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-site-address">Site address</Label>
                  <Input id="p-site-address" value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="bg-orange-600 hover:bg-orange-700" disabled={submitting} onClick={handleCreate}>Create project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <Link key={p.id} to={`/portal/projects/${p.id}`}>
            <Card className="h-full hover:border-orange-300 transition-colors">
              <CardContent className="pt-6 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <Badge variant={p.status === "ongoing" ? "ongoing" : p.status === "completed" ? "completed" : "outline"}>
                    {projectStatusLabel(p.status)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{p.client} · {p.location}</p>
                <p className="text-sm text-gray-500">Budget: {formatCurrency(p.budget)}</p>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
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
