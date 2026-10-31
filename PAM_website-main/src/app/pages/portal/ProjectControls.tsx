import { ProjectAppearance } from './ProjectAppearance';
import { useState } from 'react';
import { toast } from 'sonner';
import { usePortalData } from '../../portal/data';
import { useAuth } from '../../portal/auth';
import type { Project } from '../../portal/types';
import { Button } from '../../portal/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

export function ProjectControls({project}: {project:Project}) {
  const {users,updateProject,addSite} = usePortalData();
  const {hasRole} = useAuth();
  const [open,setOpen] = useState(false);
  const [busy,setBusy] = useState(false);
  const [name,setName] = useState(project.name);
  const [details,setDetails] = useState({client:project.client,location:project.location,budget:project.budget,startDate:project.startDate,endDate:project.endDate,category:project.category??'General',color:project.color??null});
  const [status,setStatus] = useState(project.status);
  const [assigned,setAssigned] = useState(project.assignedUserIds ?? []);
  const [siteName,setSiteName] = useState('');
  const [address,setAddress] = useState('');
  if (!hasRole('admin','project_manager')) return null;
  const save = async () => {
    setBusy(true);
    try { await updateProject(project.id,{...details,name,status,...(hasRole('admin') ? {assignedUserIds:assigned} : {})}); setOpen(false); toast.success('Project updated.'); }
    catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={value=>{if(value){setName(project.name);setStatus(project.status);setAssigned(project.assignedUserIds??[]);setDetails({client:project.client,location:project.location,budget:project.budget,startDate:project.startDate,endDate:project.endDate,category:project.category??'General',color:project.color??null});}setOpen(value);}}>
    <DialogTrigger asChild><Button variant="outline">Manage project</Button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Manage project</DialogTitle></DialogHeader>
      <div className="space-y-1.5"><Label htmlFor="edit-project-name">Project name</Label><Input id="edit-project-name" value={name} onChange={e=>setName(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="edit-project-status">Status</Label><select className="h-9 w-full rounded-md border bg-input-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40" id="edit-project-status" value={status} onChange={e=>setStatus(e.target.value as Project['status'])}>
        <option value="ongoing">Ongoing</option><option value="on_hold">On hold</option><option value="completed">Completed</option>
      </select></div>
      <div className="grid gap-3 sm:grid-cols-2">{(['client','location','startDate','endDate','budget'] as const).map(key=><label key={key} className="block">{{client:'Client',location:'Location',startDate:'Start date',endDate:'Target completion date',budget:'Budget (PHP)'}[key]}<Input type={key==='budget'?'number':key.includes('Date')?'date':'text'} min={key==='budget'?0:undefined} value={details[key]??''} onChange={e=>setDetails(d=>({...d,[key]:key==='budget'?Number(e.target.value):key==='endDate'?(e.target.value||null):e.target.value}))}/></label>)}</div>
      <ProjectAppearance category={details.category} color={details.color} onChange={patch=>setDetails(d=>({...d,...patch}))}/>
      {hasRole('admin') && <fieldset className="space-y-2"><legend className="font-medium">Assigned staff</legend><p className="text-xs text-gray-500">Assigned users can submit reports at every site in this project.</p>{users.map(u=><label key={u.id} className="flex gap-2 text-sm"><input type="checkbox" checked={assigned.includes(u.id)} onChange={e=>setAssigned(e.target.checked ? [...assigned,u.id] : assigned.filter(id=>id!==u.id))}/>{u.name}</label>)}</fieldset>}
      <Button disabled={busy || !name.trim()} onClick={()=>void save()}>Save project</Button>
      <form className="border-t pt-4 space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);try {await addSite(project.id,siteName,address);setSiteName('');setAddress('');toast.success('Site added.');} catch(error){toast.error((error as Error).message);}finally{setBusy(false);}}}>
        <div className="space-y-1.5"><Label htmlFor="new-site-name">New site name</Label><Input id="new-site-name" value={siteName} onChange={e=>setSiteName(e.target.value)} required/></div>
        <div className="space-y-1.5"><Label htmlFor="new-site-address">Address</Label><Input id="new-site-address" value={address} onChange={e=>setAddress(e.target.value)}/></div>
        <Button variant="outline" disabled={busy} type="submit">Add site</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
