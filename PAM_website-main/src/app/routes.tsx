import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { Projects } from "./pages/Projects";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { NotFound } from "./pages/NotFound";
import { Layout } from "./components/Layout";

// Internal portal — Construction Project Tracking and Progress Monitoring System.
// See .github/agents/portal-backend-build.agent.md for what still needs a real backend.
import { PortalLogin } from "./pages/portal/PortalLogin";
import { PortalLayout } from "./pages/portal/PortalLayout";
import { Dashboard } from "./pages/portal/Dashboard";
import { ProjectsList } from "./pages/portal/ProjectsList";
import { ProjectDetail } from "./pages/portal/ProjectDetail";
import { ReportSubmit } from "./pages/portal/ReportSubmit";
import { ReportsList } from "./pages/portal/ReportsList";
import { Milestones } from "./pages/portal/Milestones";
import { Notifications } from "./pages/portal/Notifications";
import { UsersAdmin } from "./pages/portal/UsersAdmin";
import { NotAuthorized } from "./pages/portal/NotAuthorized";
import { RoleRoute } from "./pages/portal/RoleRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "services", Component: Services },
      { path: "projects", Component: Projects },
      { path: "about", Component: About },
      { path: "contact", Component: Contact },
      // Catch-all 404 route — must be last
      { path: "*", Component: NotFound },
    ],
  },
  // Internal portal — separate layout (no public Header/Footer), gated by login.
  { path: "/portal/login", Component: PortalLogin },
  {
    path: "/portal",
    Component: PortalLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "projects", Component: ProjectsList },
      { path: "projects/:id", Component: ProjectDetail },
      { path: "projects/:id/submit-report", Component: ReportSubmit },
      { path: "reports", Component: ReportsList },
      {
        path: "milestones",
        element: (
          <RoleRoute roles={["admin", "project_manager"]}>
            <Milestones />
          </RoleRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <RoleRoute roles={["admin", "project_manager"]}>
            <Notifications />
          </RoleRoute>
        ),
      },
      {
        path: "users",
        element: (
          <RoleRoute roles={["admin"]}>
            <UsersAdmin />
          </RoleRoute>
        ),
      },
      { path: "not-authorized", Component: NotAuthorized },
    ],
  },
]);
