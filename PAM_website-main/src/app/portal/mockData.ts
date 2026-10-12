// Seed fixtures and explicit demo builds. Excluded from standard backend-enabled builds.
import type {
  PortalUser,
  Project,
  Site,
  Milestone,
  ProgressReport,
  PortalNotification,
} from "./types";

export const DEMO_USERS: (PortalUser & { password: string })[] = [
  {
    id: 1,
    name: "PAM Builders Management",
    email: "admin@pambuilders.com",
    password: "admin123",
    role: "admin",
    status: "active",
  },
  {
    id: 2,
    name: "Juan Dela Cruz",
    email: "pm@pambuilders.com",
    password: "pm123",
    role: "project_manager",
    status: "active",
  },
  {
    id: 3,
    name: "Mark Santos",
    email: "site@pambuilders.com",
    password: "site123",
    role: "site_staff",
    status: "active",
  },
];

export const DEMO_PROJECTS: Project[] = [
  {
    id: 1,
    name: "Villa Cristina Residential Build",
    client: "Cristina Reyes",
    location: "Antipolo, Rizal",
    startDate: "2026-06-01",
    endDate: null,
    budget: 4500000,
    status: "ongoing",
    siteIds: [1],
  },
  {
    id: 2,
    name: "Riverside Commercial Fit-out",
    client: "Riverside Mall Corp",
    location: "Marikina City",
    startDate: "2026-07-15",
    endDate: null,
    budget: 2800000,
    status: "ongoing",
    siteIds: [2],
  },
  {
    id: 3,
    name: "St. Michael Parish Renovation",
    client: "St. Michael Parish",
    location: "Taytay, Rizal",
    startDate: "2026-02-01",
    endDate: "2026-08-20",
    budget: 1750000,
    status: "completed",
    siteIds: [3],
  },
];

export const DEMO_SITES: Site[] = [
  { id: 1, projectId: 1, name: "Main Site", address: "Lot 14, Sumulong Hwy, Antipolo" },
  { id: 2, projectId: 2, name: "Main Site", address: "Riverside Mall, Marikina City" },
  { id: 3, projectId: 3, name: "Main Site", address: "St. Michael Parish, Taytay" },
];

export const DEMO_MILESTONES: Milestone[] = [
  { id: 1, projectId: 1, title: "Foundation complete", description: "Excavation and footing poured", dueDate: "2026-07-01", status: "completed", completedAt: "2026-06-29" },
  { id: 2, projectId: 1, title: "Structural framing", description: "Columns, beams, slab on 2nd floor", dueDate: "2026-09-15", status: "in_progress", completedAt: null },
  { id: 3, projectId: 1, title: "Roofing installation", description: "Trusses and roofing sheets", dueDate: "2026-09-25", status: "pending", completedAt: null },
  { id: 4, projectId: 2, title: "Demolition & site clearing", description: "Remove existing fit-out", dueDate: "2026-08-01", status: "completed", completedAt: "2026-08-03" },
  { id: 5, projectId: 2, title: "Electrical & plumbing rough-in", description: "Rough-in before wall closure", dueDate: "2026-09-10", status: "pending", completedAt: null },
  { id: 6, projectId: 3, title: "Final inspection", description: "Client walkthrough and sign-off", dueDate: "2026-08-20", status: "completed", completedAt: "2026-08-20" },
];

export const DEMO_REPORTS: ProgressReport[] = [
  {
    id: 1,
    projectId: 1,
    siteId: 1,
    submittedBy: 3,
    submittedByName: "Mark Santos",
    reportDate: "2026-09-29",
    description: "Continued column pouring on the 2nd floor, east wing.",
    percentComplete: 55,
    photoDataUrl: null,
    materials: [
      { materialName: "Portland Cement", quantity: 40, unit: "bags" },
      { materialName: "Rebar 12mm", quantity: 120, unit: "pcs" },
    ],
    manpower: [
      { workerName: "Mark Santos", position: "Foreman", hoursWorked: 8 },
      { workerName: "Rico Flores", position: "Mason", hoursWorked: 8 },
      { workerName: "Ben Ramos", position: "Laborer", hoursWorked: 8 },
    ],
  },
  {
    id: 2,
    projectId: 2,
    siteId: 2,
    submittedBy: 3,
    submittedByName: "Mark Santos",
    reportDate: "2026-09-30",
    description: "Electrical conduit layout started per approved plan.",
    percentComplete: 30,
    photoDataUrl: null,
    materials: [{ materialName: "PVC Conduit 20mm", quantity: 80, unit: "m" }],
    manpower: [{ workerName: "Jay Villanueva", position: "Electrician", hoursWorked: 8 }],
  },
];

export const DEMO_NOTIFICATIONS: PortalNotification[] = [
  {
    id: 1,
    message: "Milestone \"Electrical & plumbing rough-in\" for Riverside Commercial Fit-out is due in 10 days.",
    type: "info",
    isRead: false,
    createdAt: "2026-09-30T08:00:00+08:00",
  },
];
