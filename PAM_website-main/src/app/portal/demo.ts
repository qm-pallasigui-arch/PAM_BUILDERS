import { DEMO_USERS, DEMO_PROJECTS, DEMO_SITES, DEMO_MILESTONES, DEMO_REPORTS, DEMO_NOTIFICATIONS } from './mockData';
import type { PortalUser, Project, Site, Milestone, ProgressReport } from './types';
import { isMilestoneDelayed,latestProgress } from './utils';
import type { WebsiteContent } from './content';
import initialContent from './initialContent.json';

// An isolated, in-memory demo. Reloading resets all data and the current login.
export function createDemoApi() {
  const users = structuredClone(DEMO_USERS);
  const projects: Project[] = structuredClone(DEMO_PROJECTS).map(p => ({...p, assignedUserIds: users.map(u => u.id)}));
  const sites = structuredClone(DEMO_SITES);
  const milestones = structuredClone(DEMO_MILESTONES);
  const reports = structuredClone(DEMO_REPORTS);
  const notifications = structuredClone(DEMO_NOTIFICATIONS);
  const reads = new Set<string>();
  let userId: number | null = null;
  let content:WebsiteContent=structuredClone(initialContent) as WebsiteContent;
  const assets:{id:number;url:string;projectId?:number}[]=[];
  const profile = ({password: _, ...user}: typeof users[number]): PortalUser => user;
  const nextId = (rows: {id:number}[]) => Math.max(0,...rows.map(row => row.id)) + 1;
  const page = (items: unknown[]) => ({items: structuredClone(items), nextCursor: null});

  return (path: string, method = 'GET', body?: unknown): unknown => {
    const [resource, rawId, action] = path.split('?')[0].split('/');
    const id = Number(rawId);
    const input = (body ?? {}) as Record<string, any>;
    if (resource === 'login' && method === 'POST') {
      const found = users.find(u => u.email.toLowerCase() === String(input.email).trim().toLowerCase() && u.password === input.password && u.status === 'active');
      if (!found) throw new Error('Invalid email or password.');
      userId = found.id;
      return {user: profile(found)};
    }
    if(resource==='public-content'&&method==='GET')return {...content,permitTemplates:[],projects:content.projects.filter(p=>p.published).map(p=>{const {linkedProjectId,showClient,showBudget,showLocation,...safe}=p;const internal=projects.find(x=>x.id===linkedProjectId);return {...safe,...(internal&&showClient?{client:internal.client}:{}),...(internal&&showBudget?{budget:internal.budget}:{}),...(internal&&showLocation?{location:internal.location}:{})};})};
    const user = users.find(u => u.id === userId && u.status === 'active');
    if (!user) throw new Error('Please sign in.');
    if(resource==='permit-templates'&&method==='GET')return structuredClone(content.permitTemplates);
    if(resource==='content'){if(user.role!=='admin')throw new Error('Admin access required.');if(method==='PUT')content=structuredClone(input) as WebsiteContent;return structuredClone(content);}
    if(resource==='assets'&&method==='POST'){if(user.role==='site_staff'||(!input.projectId&&user.role!=='admin'))throw new Error('Admin or manager access required.');const url=`data:${input.contentType};base64,${input.data}`;assets.push({id:nextId(assets),url,projectId:input.projectId});return {url};}
    if (resource === 'me') return {user: profile(user)};
    if (resource === 'logout') { userId = null; return {ok:true}; }
    const manager = user.role !== 'site_staff';
    const allowed = projects.filter(p => manager || p.assignedUserIds?.includes(user.id));
    const canView = (projectId: number) => allowed.some(p => p.id === projectId);
    const requireManager = () => { if (!manager) throw new Error('Manager access required.'); };
    if (resource === 'users' && user.role !== 'admin') throw new Error('Admin access required.');
    if (resource === 'notifications') requireManager();

    if (method === 'GET') {
      switch(resource) {
        case 'projects': return {...page(allowed.map(p=>({...p,assignedNames:users.filter(u=>p.assignedUserIds?.includes(u.id)).map(u=>u.name)}))),sites:structuredClone(sites.filter(s => canView(s.projectId)))};
        case 'milestones': return page(milestones.filter(m => canView(m.projectId)));
        case 'reports': return page(reports.filter(r => canView(r.projectId)));
        case 'users': return page(users.map(profile));
        case 'notifications': return {...page(notifications.map(n => ({...n,isRead:reads.has(`${user.id}:${n.id}`)}))),delayAlerts:milestones.filter(isMilestoneDelayed).map(m => ({id:m.id,message:`Delayed milestone: ${m.title}`,type:'delay',isRead:false,createdAt:new Date().toISOString()}))};
      }
    }
    if (resource === 'reports' && method === 'POST') {
      const project = projects.find(p => p.id === input.projectId);
      if (!project || (!project.assignedUserIds?.includes(user.id) && !(input.correctionReason&&user.role==='admin'))) throw new Error('You must be assigned to this project.');
      if (input.siteId !== null && !sites.some(s => s.id === input.siteId && s.projectId === project.id)) throw new Error('Select a site in this project.');
      if(input.correctionReason&&user.role!=='admin')throw new Error('Admin access required.');
      if(!input.correctionReason&&input.percentComplete<latestProgress(project.id,reports))throw new Error('Progress cannot decrease. An admin correction with a reason is required.');
      reports.unshift({...input,id:nextId(reports),submittedBy:user.id,submittedByName:user.name} as ProgressReport);
      return {ok:true};
    }
    requireManager();
    if (resource === 'projects' && method === 'POST' && !rawId) {
      const projectId = nextId(projects), siteId = nextId(sites);
      const {siteName,siteAddress,...project} = input;
      projects.push({...project,id:projectId,siteIds:[siteId],assignedUserIds:[user.id]} as Project);
      sites.push({id:siteId,projectId,name:siteName,address:siteAddress} as Site);
    } else if (resource === 'projects' && method === 'POST' && action === 'sites') {
      const project = projects.find(p => p.id === id);
      if (!project) throw new Error('Project not found.');
      const siteId = nextId(sites);
      sites.push({id:siteId,projectId:id,name:input.name,address:input.address});
      project.siteIds.push(siteId);
    } else if (resource === 'projects' && method === 'PUT') {
      const project = projects.find(p => p.id === id);
      if (!project) throw new Error('Project not found.');
      const {assignedUserIds,...changes} = input;
      Object.assign(project,changes);
      if (user.role === 'admin' && assignedUserIds) project.assignedUserIds = assignedUserIds;
    } else if (resource === 'milestones' && method === 'POST') {
      if (!canView(input.projectId)) throw new Error('Project not found.');
      milestones.push({...input,id:nextId(milestones),completedAt:input.status === 'completed' ? new Date().toISOString() : null} as Milestone);
    } else if (resource === 'milestones' && method === 'PUT') {
      const milestone = milestones.find(m => m.id === id);
      if (!milestone) throw new Error('Milestone not found.');
      milestone.status = input.status;
      milestone.completedAt = input.status === 'completed' ? new Date().toISOString() : null;
    } else if (resource === 'notifications' && method === 'PUT' && action === 'read') {
      reads.add(`${user.id}:${id}`);
    } else if (resource === 'users' && (method === 'POST' || method === 'PUT')) {
      if (users.some(u => u.id !== id && u.email.toLowerCase() === String(input.email).toLowerCase())) throw new Error('Email already exists.');
      if (method === 'POST') users.push({...input,id:nextId(users)} as typeof users[number]);
      else {
        const target = users.find(u => u.id === id);
        if (!target) throw new Error('User not found.');
        Object.assign(target,input);
      }
    } else throw new Error('This action is unavailable in the demo.');
    return {ok:true};
  };
}

export const demoApi = createDemoApi();
