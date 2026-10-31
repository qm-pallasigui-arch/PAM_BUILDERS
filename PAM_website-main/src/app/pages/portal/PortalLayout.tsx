import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router";
import {
  HardHat,
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Flag,
  Bell,
  Users,
  LogOut,
  Globe,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { usePortalData } from "../../portal/data";
import { useAuth } from "../../portal/auth";
import { Button } from "../../portal/Button";
import type { Role } from "../../portal/types";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[]; // which roles see this link
}

const NAV_ITEMS: NavItem[] = [
  { to: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "project_manager", "site_staff"] },
  { to: "/portal/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "project_manager", "site_staff"] },
  { to: "/portal/reports", label: "Progress Reports", icon: ClipboardList, roles: ["admin", "project_manager", "site_staff"] },
  { to: "/portal/milestones", label: "Milestones", icon: Flag, roles: ["admin", "project_manager"] },
  { to: "/portal/notifications", label: "Notifications", icon: Bell, roles: ["admin", "project_manager"] },
  { to: "/portal/users", label: "Users", icon: Users, roles: ["admin"] },
];

const WEBSITE_ITEMS = [
  {to:"/portal/website-projects",label:"Projects"},
  {to:"/portal/website-about",label:"About"},
  {to:"/portal/website-contact",label:"Contact"},
];

/** Wraps every /portal/* route. Redirects to /portal/login if not authenticated. */
export function PortalLayout() {
  const { user, loading, logout, hasRole } = useAuth();
  const { loading: dataLoading, error: dataError, refresh } = usePortalData();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [websiteNavOpen, setWebsiteNavOpen] = useState(true);
  const websiteActive = WEBSITE_ITEMS.some(item=>location.pathname===item.to);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/portal/login" state={{ from: location.pathname }} replace />;
  }

  const visibleItems = NAV_ITEMS.filter((item) => hasRole(...item.roles));

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-800">
        <HardHat className="h-7 w-7 text-orange-500" />
        <span className="text-white font-semibold">PAM Builders Portal</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {import.meta.env.MODE === 'demo' && <p className="px-3 py-2 text-xs text-amber-200">Demo mode. Changes reset on reload.</p>}
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-orange-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
        {hasRole("admin") && <div className="mt-4 border-t border-gray-800 pt-3">
          <button type="button" aria-expanded={websiteNavOpen} onClick={()=>setWebsiteNavOpen(open=>!open)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${websiteActive?'bg-gray-800 text-orange-300':'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
            <Globe className="h-4 w-4 shrink-0"/><span className="flex-1">Website Content</span><ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${websiteNavOpen?'':'-rotate-90'}`}/>
          </button>
          {websiteNavOpen && <div className="ml-5 mt-1 space-y-1 border-l border-gray-700 pl-3">
            {WEBSITE_ITEMS.map(item=><NavLink key={item.to} to={item.to} onClick={()=>setMobileNavOpen(false)} className={({isActive})=>`block rounded-md px-3 py-2 text-sm transition-colors ${isActive?'bg-orange-600 text-white':'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>{item.label}</NavLink>)}
          </div>}
        </div>}
      </nav>
      <div className="px-4 py-4 border-t border-gray-800">
        <Button asChild variant="outline" className="mb-4 w-full border-orange-500 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 hover:text-orange-100 focus-visible:ring-orange-400"><Link to="/" onClick={() => setMobileNavOpen(false)}>
          <Globe className="h-4 w-4" /> PAM Builders website
        </Link></Button>
        <p className="text-sm text-white truncate">{user.name}</p>
        <p className="text-xs text-gray-400 capitalize mb-3">{user.role.replace("_", " ")}</p>
        <Button
          variant="outline"
          size="default"
          className="w-full border-red-200 bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 focus-visible:ring-red-300"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 text-sm leading-6 text-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-gray-900">
        <SidebarContent />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between h-14 px-4 bg-gray-900 border-b border-gray-800">
        <Link to="/portal/dashboard" className="flex items-center gap-2">
          <HardHat className="h-6 w-6 text-orange-500" />
          <span className="text-white font-semibold text-sm">PAM Builders Portal</span>
        </Link>
        <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6 text-white" />
        </button>
      </div>
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 max-h-dvh overflow-y-auto bg-gray-900 flex flex-col">
            <div className="flex items-center justify-end px-4 h-14 border-b border-gray-800">
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 lg:pt-0 lg:ml-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {dataLoading ? <p role="status">Loading portal data...</p> : dataError ? <div role="alert"><p>{dataError}</p><Button onClick={() => void refresh()}>Retry</Button></div> : <Outlet />}
        </div>
      </main>
    </div>
  );
}
