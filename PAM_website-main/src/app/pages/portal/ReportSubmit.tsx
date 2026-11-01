import { PageHeader } from "../../portal/PageHeader";
import { CompletionControl } from "./CompletionControl";
import { latestProgress } from "../../portal/utils";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Plus, Trash2 } from "lucide-react";
import { usePortalData } from "../../portal/data";
import { useAuth } from "../../portal/auth";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../portal/Button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import type { MaterialLogEntry, ManpowerLogEntry } from "../../portal/types";
import { uploadPhoto } from "../../portal/api";
import { toast } from "sonner";

export function ReportSubmit() {
  const { id } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user,hasRole } = useAuth();
  const { projects, sites, reports, addReport } = usePortalData();

  const project = projects.find((p) => p.id === projectId);
  const projectSites = sites.filter((s) => s.projectId === projectId);

  const [siteId, setSiteId] = useState(projectSites[0]?.id ?? 0);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const baseline=latestProgress(projectId,reports);
  const previous=[...reports].filter(r=>r.projectId===projectId).sort((a,b)=>b.id-a.id)[0];
  const [percentComplete, setPercentComplete] = useState(baseline);
  const [correction,setCorrection]=useState(hasRole('admin')&&!project?.assignedUserIds?.includes(user?.id??0)),[reason,setReason]=useState('');
  useEffect(()=>{setPercentComplete(baseline);},[baseline,projectId]);
  useEffect(()=>{setSiteId(projectSites[0]?.id??0);},[projectId,projectSites[0]?.id]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!photoFile) { setPhotoDataUrl(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoDataUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);
  const [materials, setMaterials] = useState<MaterialLogEntry[]>([{ materialName: "", quantity: 0, unit: "" }]);
  const [manpower, setManpower] = useState<ManpowerLogEntry[]>([{ workerName: "", position: "", hoursWorked: 8 }]);

  if (!project) return <p className="text-gray-500">Project not found.</p>;

  if (project.approvalStatus && project.approvalStatus !== "approved") return <p role="status">This project must be approved before you can submit a report.</p>;

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use a JPEG, PNG or WebP image up to 3 MB.');
      e.target.value = '';
      setPhotoFile(null);
      return;
    }
    setPhotoFile(file);
  };

  const updateMaterial = (index: number, patch: Partial<MaterialLogEntry>) => {
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };
  const updateManpower = (index: number, patch: Partial<ManpowerLogEntry>) => {
    setManpower((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !siteId) {toast.error("Select a site before submitting.");return;}
    if(!correction && percentComplete<baseline){toast.error("Progress cannot decrease.");return;}
    if(correction&&!reason.trim()){toast.error("Enter a correction reason.");return;}

    if (submitting) return;
    setSubmitting(true);
    try {
    const photoUrl = photoFile ? await uploadPhoto(photoFile, projectId, siteId) : null;
    await addReport({
      ...(correction?{correctionReason:reason.trim()}:{}),
      projectId,
      siteId,
      submittedBy: user.id,
      submittedByName: user.name,
      reportDate,
      description,
      percentComplete,
      photoDataUrl: photoUrl,
      materials: materials.filter((m) => m.materialName.trim()),
      manpower: manpower.filter((m) => m.workerName.trim()),
    });

    toast.success(hasRole('admin') ? 'Progress report submitted and approved.' : 'Progress report submitted for admin approval.');
    navigate(`/portal/projects/${projectId}`);
    } catch (error) { toast.error((error as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={()=>navigate(`/portal/projects/${projectId}`)}>Back to project</Button>
      <PageHeader section="Site reporting / New report" title="Add progress report" description={project.name} />

      {previous&&<Button variant="outline" onClick={()=>{setDescription(previous.description);setMaterials(previous.materials.map(m=>({...m})));setManpower(previous.manpower.map(m=>({...m})));toast.success('Previous report copied. Review quantities and hours before submitting.');}}>Copy previous report</Button>}
      <p className="text-sm text-gray-500">Current project progress: {baseline}%. Each submission adds to this project's report history.</p>
      {hasRole('admin')&&<div className="rounded border p-4 space-y-3"><label className="flex gap-2"><input type="checkbox" checked={correction} onChange={e=>{setCorrection(e.target.checked);if(!e.target.checked)setPercentComplete(baseline);}}/>Admin progress correction</label>{correction&&<label className="block">Required correction reason<Textarea value={reason} onChange={e=>setReason(e.target.value)}/></label>}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="min-w-0">
          <CardHeader><CardTitle className="text-base">Report Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="site">Site</Label>
                <select
                  id="site"
                  className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm"
                  value={siteId}
                  onChange={(e) => setSiteId(Number(e.target.value))}
                >
                  {projectSites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Report date</Label>
                <Input id="date" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description of work done</Label>
              <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <CompletionControl value={percentComplete} saved={baseline} correction={correction} disabled={submitting} onChange={setPercentComplete}/>


          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader><CardTitle className="text-base">Site photo</CardTitle><p className="text-sm text-gray-600">Document the work described in this report.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo">Upload a site photo</Label>
              <Input disabled={submitting || !project.assignedUserIds?.includes(user?.id??0)} id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} aria-describedby="photo-help" />
              <p id="photo-help" className="text-xs text-gray-500">JPEG, PNG, or WebP, up to 3 MB.{!project.assignedUserIds?.includes(user?.id??0) && ' Photo uploads require assignment to this project.'}</p>
            </div>
            {photoDataUrl ? <figure className="space-y-2"><img src={photoDataUrl} alt={`Site photo preview for ${project.name}`} className="aspect-[4/3] w-full rounded-lg border bg-gray-50 object-contain" /><figcaption className="break-words text-xs text-gray-600">{photoFile?.name}</figcaption></figure> : <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed bg-gray-50 p-6 text-center text-sm text-gray-500">Your site photo preview will appear here.</div>}
          </CardContent>
        </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Materials Used</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setMaterials((prev) => [...prev, { materialName: "", quantity: 0, unit: "" }])}
            >
              <Plus className="h-4 w-4" /> Add row
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {materials.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_90px_32px] gap-2 items-center">
                <Input placeholder="Material (e.g. Cement)" value={m.materialName} onChange={(e) => updateMaterial(i, { materialName: e.target.value })} />
                <Input type="number" placeholder="Qty" value={m.quantity || ""} onChange={(e) => updateMaterial(i, { quantity: Number(e.target.value) })} />
                <Input placeholder="Unit" value={m.unit} onChange={(e) => updateMaterial(i, { unit: e.target.value })} />
                <Button size="icon" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" type="button" onClick={() => setMaterials((prev) => prev.filter((_, idx) => idx !== i))} aria-label={`Remove material row ${i + 1}`}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Manpower Present</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setManpower((prev) => [...prev, { workerName: "", position: "", hoursWorked: 8 }])}
            >
              <Plus className="h-4 w-4" /> Add row
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {manpower.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-center">
                <Input placeholder="Worker name" value={m.workerName} onChange={(e) => updateManpower(i, { workerName: e.target.value })} />
                <Input placeholder="Position" value={m.position} onChange={(e) => updateManpower(i, { position: e.target.value })} />
                <Input type="number" placeholder="Hrs" value={m.hoursWorked || ""} onChange={(e) => updateManpower(i, { hoursWorked: Number(e.target.value) })} />
                <Button size="icon" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" type="button" onClick={() => setManpower((prev) => prev.filter((_, idx) => idx !== i))} aria-label={`Remove manpower row ${i + 1}`}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={submitting} loadingLabel="Submitting report..." className="bg-orange-600 hover:bg-orange-700">Submit Report</Button>
          <Button type="button" variant="outline" disabled={submitting} onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
