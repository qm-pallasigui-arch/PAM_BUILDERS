import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../portal/auth";
import type { Role } from "../../portal/types";

/** Wrap a page element with this to restrict it to specific roles. Assumes PortalLayout already enforced login. */
export function RoleRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return <Navigate to="/portal/not-authorized" replace />;
  }
  return <>{children}</>;
}
