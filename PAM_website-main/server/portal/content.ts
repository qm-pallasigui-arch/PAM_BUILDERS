import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import type { Database } from "./db.js";
import { authenticate, roles, projectAccess, HttpError } from "./security.js";
import pageDefaults from "../../src/app/portal/pageDefaults.json";
import { validateImage } from "./validation.js";
const assetUrl = z.string().regex(/^$|^\/api\/portal\/assets\/\d+$/);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const requiredText = z.string().trim().min(1).max(200);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,30}$/, "Enter a phone number.");
const contactCard = z
  .object({
    id: requiredText,
    kind: z.enum(["phone", "email", "address", "hours", "text"]),
    title: requiredText,
    lines: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
    note: z.string().max(1000),
  })
  .superRefine((card, ctx) => {
    card.lines.forEach((line, index) => {
      if (card.kind === "email" && !z.string().email().safeParse(line).success)
        ctx.addIssue({
          code: "custom",
          path: ["lines", index],
          message: "Enter a valid email address.",
        });
      if (card.kind === "phone" && !phone.safeParse(line).success)
        ctx.addIssue({
          code: "custom",
          path: ["lines", index],
          message: "Enter a valid phone number.",
        });
    });
  });
const contentSchema = z.object({
  leadership: z
    .array(
      z.object({
        id: requiredText,
        name: requiredText,
        role: requiredText,
        experience: z.string().max(1000),
        image: assetUrl,
      }),
    )
    .max(50),
  contact: z.object({
    title: requiredText,
    intro: z.string().max(3000),
    formTitle: requiredText,
    projectTypes: z.array(requiredText).min(1).max(50),
    cards: z.array(contactCard).max(50),
    emergency: z
      .object({
        enabled: z.boolean(),
        title: requiredText,
        description: z.string().max(3000),
        phone: z.string().max(30),
      })
      .refine(
        (e) => !e.enabled || phone.safeParse(e.phone).success,
        "Enter an emergency phone number.",
      ),
  }),
  projects: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        title: z.string().trim().min(1).max(200),
        description: z.string().max(10000),
        image: z.union([
          assetUrl,
          z
            .string()
            .url()
            .refine(
              (url) => url.startsWith("https://images.unsplash.com/"),
              "Upload a project image.",
            ),
        ]),
        details: z
          .object({
            year: z.string().max(50),
            duration: z.string().max(100),
            size: z.string().max(100),
          })
          .optional(),
        category: z.string().max(100),
        color: color.nullable(),
        order: z.number().int(),
        published: z.boolean(),
        linkedProjectId: z.number().int().positive().nullable(),
        showClient: z.boolean(),
        showBudget: z.boolean(),
        showLocation: z.boolean(),
      }),
    )
    .max(500),
  categories: z
    .array(z.object({ name: z.string().trim().min(1).max(100), color }))
    .min(1)
    .max(100),
  permitTemplates: z.array(z.string().trim().min(1).max(200)).max(200),
  birUrl: assetUrl,
});
export async function contentRoute(
  db: Database,
  req: VercelRequest,
  res: VercelResponse,
  path: string,
) {
  if (
    !["content", "public-content", "assets", "permit-templates"].includes(
      path.split("/")[0],
    )
  )
    return false;
  if (path === "public-content" && req.method === "GET") {
    const content = (
      await db.query("SELECT content FROM website_content WHERE id=1")
    ).rows[0].content;
    const projects = [];
    for (const p of content.projects.filter((p: any) => p.published)) {
      const { linkedProjectId, showClient, showBudget, showLocation, ...safe } =
        p;
      const internal = linkedProjectId
        ? (
            await db.query(
              "SELECT client,budget::float8 AS budget,location FROM projects WHERE id=$1",
              [linkedProjectId],
            )
          ).rows[0]
        : null;
      projects.push({
        ...safe,
        ...(internal && showClient ? { client: internal.client } : {}),
        ...(internal && showBudget ? { budget: internal.budget } : {}),
        ...(internal && showLocation ? { location: internal.location } : {}),
      });
    }
    res.json({
      leadership: content.leadership ?? pageDefaults.leadership,
      contact: content.contact ?? pageDefaults.contact,
      projects,
      categories: content.categories,
      birUrl: content.birUrl,
      permitTemplates: [],
    });
    return true;
  }
  if (path.startsWith("assets/") && req.method === "GET") {
    const id = z.coerce.number().int().positive().parse(path.split("/")[1]);
    const asset = (
      await db.query("SELECT * FROM content_assets WHERE id=$1", [id])
    ).rows[0];
    if (!asset) throw new HttpError(404, "File not found.");
    if (!asset.public) {
      const user = await authenticate(db, req);
      if (asset.project_id) await projectAccess(db, user, asset.project_id);
      else roles(user, "admin");
    }
    res.setHeader("Content-Type", asset.content_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Disposition", "inline");
    res.send(Buffer.from(asset.data));
    return true;
  }
  const user = await authenticate(db, req);
  if (path === "permit-templates" && req.method === "GET") {
    res.json(
      (await db.query("SELECT content FROM website_content WHERE id=1")).rows[0]
        .content.permitTemplates,
    );
    return true;
  }
  if (path === "assets" && req.method === "POST") {
    const input = z
      .object({
        name: z.string().max(200),
        contentType: z.enum([
          "image/png",
          "image/jpeg",
          "image/webp",
          "application/pdf",
        ]),
        data: z.string().max(2800000),
        projectId: z.number().int().positive().optional(),
      })
      .parse(req.body);
    if (input.projectId) {
      roles(user, "admin", "project_manager");
      await projectAccess(db, user, input.projectId);
    } else roles(user, "admin");
    const bytes = Buffer.from(input.data, "base64");
    if (!bytes.length || bytes.length > 2 * 1024 * 1024)
      throw new HttpError(400, "File must be at most 2 MB.");
    if (input.contentType === "application/pdf") {
      if (bytes.subarray(0, 5).toString() !== "%PDF-")
        throw new HttpError(400, "Invalid PDF.");
    } else {
      try {
        validateImage(input.data, input.contentType);
      } catch {
        throw new HttpError(400, "Invalid image.");
      }
    }
    const row = (
      await db.query(
        "INSERT INTO content_assets(project_id,name,content_type,data) VALUES($1,$2,$3,$4) RETURNING id",
        [input.projectId ?? null, input.name, input.contentType, bytes],
      )
    ).rows[0];
    res.status(201).json({ url: "/api/portal/assets/" + row.id });
    return true;
  }
  roles(user, "admin");
  if (path === "content" && req.method === "GET") {
    res.json({
      ...pageDefaults,
      ...(await db.query("SELECT content FROM website_content WHERE id=1"))
        .rows[0].content,
    });
    return true;
  }
  if (path === "content" && req.method === "PUT") {
    const existing = (
      await db.query("SELECT content FROM website_content WHERE id=1")
    ).rows[0].content;
    const content = contentSchema.parse({
      ...pageDefaults,
      ...existing,
      ...req.body,
    });
    for (const rows of [content.leadership, content.contact.cards])
      if (new Set(rows.map((r) => r.id)).size !== rows.length)
        throw new HttpError(400, "Card IDs must be unique.");
    if (
      new Set(content.projects.map((p) => p.id)).size !==
        content.projects.length ||
      new Set(content.categories.map((c) => c.name)).size !==
        content.categories.length
    )
      throw new HttpError(400, "Names and project IDs must be unique.");
    for (const p of content.projects)
      if (p.linkedProjectId) await projectAccess(db, user, p.linkedProjectId);
    const urls = [
      content.birUrl,
      ...content.projects.map((p) => p.image),
      ...content.leadership.map((p) => p.image),
    ].filter((url) => url.startsWith("/api/portal/assets/"));
    for (const url of urls) {
      const asset = (
        await db.query(
          "SELECT project_id,content_type FROM content_assets WHERE id=$1",
          [Number(url.split("/").pop())],
        )
      ).rows[0];
      if (!asset || asset.project_id)
        throw new HttpError(400, "Upload a website file first.");
      if (
        (content.projects.some((p) => p.image === url) ||
          content.leadership.some((p) => p.image === url)) &&
        asset.content_type === "application/pdf"
      )
        throw new HttpError(
          400,
          "Project covers and leadership photos must be images.",
        );
    }
    // Publish only files referenced by currently published content; draft uploads stay private.
    const publicIds = [
      content.birUrl,
      ...content.projects.filter((p) => p.published).map((p) => p.image),
      ...content.leadership.map((p) => p.image),
    ]
      .filter((url) => url.startsWith("/api/portal/assets/"))
      .map((url) => Number(url.split("/").pop()));
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE website_content SET content=$1 WHERE id=1", [
        JSON.stringify(content),
      ]);
      await client.query(
        "UPDATE content_assets SET public=(id=ANY($1::int[])) WHERE project_id IS NULL",
        [publicIds],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    res.json(content);
    return true;
  }
  throw new HttpError(405, "Method not supported.");
}
