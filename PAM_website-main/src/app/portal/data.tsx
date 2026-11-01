import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, allPages, type Page } from './api';
import { useAuth } from './auth';
import type { Project, Site, Milestone, ProgressReport, PortalNotification, PortalUser } from './types';

interface PortalData {
  projects: Project[]; sites: Site[]; milestones: Milestone[]; reports: ProgressReport[];
  notifications: PortalNotification[]; delayAlerts: PortalNotification[]; users: PortalUser[];
}
const empty: PortalData = {projects:[],sites:[],milestones:[],reports:[],notifications:[],delayAlerts:[],users:[]};
interface DataContextValue extends PortalData {
  loading: boolean; hasLoaded: boolean; error: string | null; refresh: () => Promise<void>;
  addReport: (input: Omit<ProgressReport,'id'>) => Promise<void>;
  addMilestone: (input: Omit<Milestone,'id'|'completedAt'>) => Promise<void>;
  setMilestoneStatus: (id: number,status: Milestone['status']) => Promise<void>;
  addProject: (input: Omit<Project,'id'|'siteIds'>,siteName: string,siteAddress: string) => Promise<void>;
  updateProject: (id: number,input: Partial<Project>) => Promise<void>;
  addSite: (projectId: number,name: string,address: string) => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  saveUser: (id: number | null,input: Partial<PortalUser> & {password?: string}) => Promise<void>;
}
const DataContext = createContext<DataContextValue | undefined>(undefined);
export function DataProvider({children}: {children:ReactNode}) {
  const {user} = useAuth();
  const [data,setData] = useState<PortalData>(empty);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const [loadedFor,setLoadedFor] = useState<typeof user>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    if (!user) { setData(empty); setLoading(false); setError(null); return; }
    setLoading(true); setError(null);
    try {
      const projects: Project[] = [], sites: Site[] = [];
      let after = 0;
      do {
        const page = await api<Page<Project> & {sites:Site[]}>('projects?after=' + after);
        projects.push(...page.items); sites.push(...page.sites);
        if (page.nextCursor === null) break;
        after = page.nextCursor;
      } while (true);
      const [milestones,reports,users] = await Promise.all([
        allPages<Milestone>('milestones'),allPages<ProgressReport>('reports'),
        user.role === 'admin' ? allPages<PortalUser>('users') : Promise.resolve([]),
      ]);
      const notifications: PortalNotification[] = [], delayAlerts: PortalNotification[] = [];
      if (user.role !== 'site_staff') {
        after = 0;
        do {
          const page = await api<Page<PortalNotification> & {delayAlerts:PortalNotification[]}>('notifications?after=' + after);
          notifications.push(...page.items); delayAlerts.push(...page.delayAlerts);
          if (page.nextCursor === null) break;
          after = page.nextCursor;
        } while (true);
      }
      if (current === generation.current) {
        setData({projects,sites,milestones,reports,notifications,delayAlerts,users});
        setLoadedFor(user);
      }
    } catch (error) {
      if (current === generation.current) setError((error as Error).message);
    } finally { if (current === generation.current) setLoading(false); }
  },[user]);
  useEffect(() => { setData(empty); setLoadedFor(null); void refresh(); return () => { generation.current++; }; },[refresh]);
  const mutate = async (path: string,method: string,input?: unknown) => { await api(path,method,input); await refresh(); };
  return <DataContext.Provider value={{...(loadedFor === user ? data : empty),loading,hasLoaded: !!user && loadedFor === user,error,refresh,
    addReport: input => mutate('reports','POST',input),
    addMilestone: input => mutate('milestones','POST',input),
    setMilestoneStatus: (id,status) => mutate('milestones/' + id,'PUT',{status}),
    addProject: (input,siteName,siteAddress) => mutate('projects','POST',{...input,siteName,siteAddress}),
    updateProject: (id,input) => mutate('projects/' + id,'PUT',input),
    addSite: (id,name,address) => mutate('projects/' + id + '/sites','POST',{name,address}),
    markNotificationRead: id => mutate('notifications/' + id + '/read','PUT'),
    saveUser: (id,input) => mutate(id ? 'users/' + id : 'users',id ? 'PUT' : 'POST',input),
  }}>{children}</DataContext.Provider>;
}
export function usePortalData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('usePortalData must be used within a DataProvider');
  return context;
}
