import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { api } from './api';
import type { PortalUser, Role } from './types';

interface AuthContextValue {
  user: PortalUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ok:boolean; error?:string}>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
async function loginRequest(email: string, password: string): Promise<{ok:boolean; user?:PortalUser; error?:string}> {
  try { return {ok:true,...await api<{user:PortalUser}>('login','POST',{email,password})}; }
  catch (error) { return {ok:false,error:(error as Error).message}; }
}
export function AuthProvider({children}: {children:ReactNode}) {
  const [user,setUser] = useState<PortalUser|null>(null);
  const [loading,setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    localStorage.removeItem('pam_portal_auth');
    localStorage.removeItem('pam_portal_data_v1');
    api<{user:PortalUser}>('me').then(result => { if (active) setUser(result.user); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    const expired = () => setUser(null);
    window.addEventListener('portal-session-expired',expired);
    return () => { active=false; window.removeEventListener('portal-session-expired',expired); };
  },[]);
  const login: AuthContextValue['login'] = async (email,password) => {
    const result = await loginRequest(email,password);
    if (result.ok && result.user) setUser(result.user);
    return {ok:result.ok,error:result.error};
  };
  const logout = async () => {
    try { await api('logout','POST'); setUser(null); }
    catch (error) { toast.error((error as Error).message); }
  };
  return <AuthContext.Provider value={{user,loading,login,logout,hasRole:(...roles) => !!user && roles.includes(user.role)}}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
