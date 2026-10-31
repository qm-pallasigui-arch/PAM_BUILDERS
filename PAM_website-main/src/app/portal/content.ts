import { useEffect, useState } from "react";
import { api } from "./api";
import pageDefaults from "./pageDefaults.json";
export interface Leader {
  id: string;
  name: string;
  role: string;
  experience: string;
  image: string;
}
export interface ContactCardData {
  id: string;
  kind: "phone" | "email" | "address" | "hours" | "text";
  title: string;
  lines: string[];
  note: string;
}
export interface ContactContent {
  title: string;
  intro: string;
  formTitle: string;
  projectTypes: string[];
  cards: ContactCardData[];
  emergency: {
    enabled: boolean;
    title: string;
    description: string;
    phone: string;
  };
}
export const defaultPages = pageDefaults as {
  leadership: Leader[];
  contact: ContactContent;
};
export interface WebsiteProject {
  details?: { year: string; duration: string; size: string };
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  color: string | null;
  order: number;
  published: boolean;
  linkedProjectId: number | null;
  showClient: boolean;
  showBudget: boolean;
  showLocation: boolean;
  client?: string;
  budget?: number;
  location?: string;
}
export interface WebsiteContent {
  leadership: Leader[];
  contact: ContactContent;
  projects: WebsiteProject[];
  categories: { name: string; color: string }[];
  permitTemplates: string[];
  birUrl: string;
}
export const emptyContent: WebsiteContent = {
  ...defaultPages,
  projects: [],
  categories: [{ name: "General", color: "#ea580c" }],
  permitTemplates: [],
  birUrl: "",
};
export function useWebsiteContent(admin = false) {
  const [content, setContent] = useState<WebsiteContent>(emptyContent),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api<WebsiteContent>(admin ? "content" : "public-content")
      .then((c) => {
        if (active) setContent({ ...defaultPages, ...c });
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [admin]);
  return { content, setContent, error, loading };
}
export function projectColor(
  project: { color?: string | null; category?: string },
  content: WebsiteContent,
) {
  return (
    project.color ||
    content.categories.find((c) => c.name === project.category)?.color ||
    "#ea580c"
  );
}
export async function uploadContentAsset(file: File, projectId?: number) {
  if (
    file.size > 2 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
      file.type,
    )
  )
    throw new Error("Choose a JPEG, PNG, WebP or PDF up to 2 MB.");
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
  return (
    await api<{ url: string }>("assets", "POST", {
      name: file.name,
      contentType: file.type,
      data,
      projectId,
    })
  ).url;
}
