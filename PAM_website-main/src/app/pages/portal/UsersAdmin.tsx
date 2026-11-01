import { PageHeader } from "../../portal/PageHeader";
import { AddCard } from "../../portal/AddCard";
import { useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { usePortalData } from '../../portal/data';
import type { PortalUser } from '../../portal/types';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../portal/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';

const ROLE_LABEL = {admin:'Admin', project_manager:'Project Manager', site_staff:'Site Staff'};
const blank = {name:'',email:'',password:'',role:'site_staff' as PortalUser['role'],status:'active' as PortalUser['status']};
export function UsersAdmin() {
  const {users,saveUser} = usePortalData();
  const [open,setOpen] = useState(false);
  const [id,setId] = useState<number|null>(null);
  const [form,setForm] = useState(blank);
  const [busy,setBusy] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const edit = (user?:PortalUser) => {
    trigger.current = document.activeElement as HTMLElement;
    setId(user?.id ?? null); setForm(user ? {...user,password:''} : blank); setOpen(true);
  };
  const submit = async (e:FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true);
    try { const {password,...rest} = form; await saveUser(id,{...rest,...(password ? {password} : {})}); setOpen(false); toast.success('User saved.'); }
    catch (error) { toast.error((error as Error).message); }
    finally {setBusy(false);}
  };
  return <div className="space-y-6">
    <PageHeader section="Administration" title="Users" description="Manage staff accounts, access roles, and account status." />
    <AddCard title="Add user" description="Create a staff account and choose its access role." onClick={()=>edit()} />
    <Card><CardContent className="pt-6"><Table>
      <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>{users.map(u=><TableRow key={u.id}><TableCell className="font-medium">{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell>{ROLE_LABEL[u.role]}</TableCell><TableCell><Badge variant={u.status==='active'?'active':'outline'}>{u.status}</Badge></TableCell><TableCell><Button variant="outline" size="default" onClick={()=>edit(u)}>Edit</Button></TableCell></TableRow>)}</TableBody>
    </Table></CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent onCloseAutoFocus={event => { event.preventDefault(); trigger.current?.focus(); }}><DialogHeader><DialogTitle>{id ? 'Edit user' : 'New user'}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="user-name">Name</Label><Input id="user-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required maxLength={150}/></div>
        <div className="space-y-1.5"><Label htmlFor="user-email">Email</Label><Input id="user-email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
        <div className="space-y-1.5"><Label htmlFor="user-password">{id ? 'New password (leave blank to keep)' : 'Password'}</Label><Input id="user-password" type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required={!id} minLength={12} maxLength={72}/></div>
        <div className="space-y-1.5"><Label htmlFor="user-role">Role</Label><select id="user-role" className="h-9 w-full rounded-md border bg-input-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40" value={form.role} onChange={e=>setForm({...form,role:e.target.value as PortalUser['role']})}>{Object.entries(ROLE_LABEL).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="user-status">Status</Label><select id="user-status" className="h-9 w-full rounded-md border bg-input-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40" value={form.status} onChange={e=>setForm({...form,status:e.target.value as PortalUser['status']})}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save user'}</Button>
      </form>
    </DialogContent></Dialog>
  </div>;
}
