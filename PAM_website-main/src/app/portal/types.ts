// Portal data model types.
// These mirror the backend schema in /db/schema.sql — keep in sync when the
// real API is implemented (see .github/agents/portal-backend-build.agent.md).

export type Role = "admin" | "project_manager" | "site_staff";

export interface PortalUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
}

export type ProjectStatus = "ongoing" | "on_hold" | "completed";

export interface Project {
  id: number;
  name: string;
  client: string;
  location: string;
  startDate: string; // ISO date
  endDate: string | null; // ISO date
  budget: number;
  status: ProjectStatus;
  siteIds: number[];
  assignedUserIds?: number[]; // project_assignments: assignment grants report submission at all project sites
}

export interface Site {
  id: number;
  projectId: number;
  name: string;
  address: string;
}

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description: string;
  dueDate: string; // ISO date
  status: MilestoneStatus;
  completedAt: string | null;
}

export interface MaterialLogEntry {
  materialName: string;
  quantity: number;
  unit: string;
}

export interface ManpowerLogEntry {
  workerName: string;
  position: string;
  hoursWorked: number;
}

export interface ProgressReport {
  id: number;
  projectId: number;
  siteId: number | null;
  submittedBy: number;
  submittedByName: string;
  reportDate: string; // ISO date
  description: string;
  percentComplete: number;
  photoDataUrl: string | null; // Authenticated photo API URL; legacy field name preserved
  materials: MaterialLogEntry[];
  manpower: ManpowerLogEntry[];
}

export interface PortalNotification {
  id: number;
  message: string;
  type: "delay" | "info";
  isRead: boolean;
  createdAt: string; // ISO datetime
}

// Server-only persistence shapes; never returned as public user profiles.
export interface PortalSession { tokenHash: string; userId: number; expiresAt: string }
export interface LoginAttempt { key: string; attempts: number; resetAt: string }
export interface NotificationRead { notificationId: number; userId: number; readAt: string }
export interface PhotoUpload { id: number; projectId: number; siteId: number; uploadedBy: number; blobUrl: string; contentType: string; createdAt: string }

export interface PortalMigration { name: string; appliedAt: string }
