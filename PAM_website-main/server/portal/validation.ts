import { z } from 'zod';
const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);
export const id = z.coerce.number().int().positive();
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Invalid calendar date');
export const password = z.string().min(12).refine(v => Buffer.byteLength(v) <= 72, 'Password must be at most 72 UTF-8 bytes');
export const loginInput = z.object({ email: z.string().trim().toLowerCase().email().max(150), password: z.string().min(1).max(72) });
export const userInput = z.object({ name: required(150), email: z.string().trim().toLowerCase().email().max(150), password, role: z.enum(['admin','project_manager','site_staff']), status: z.enum(['active','inactive']) });
export const projectInput = z.object({ name: required(200), client: text(200), location: text(200), startDate: date, endDate: date.nullable(), budget: z.number().min(0).max(999999999999.99), status: z.enum(['ongoing','on_hold','completed']) });
export const siteInput = z.object({ name: required(200), address: text(255).default('') });
export const milestoneInput = z.object({ projectId: id, title: required(200), description: text(10000), dueDate: date, status: z.enum(['pending','in_progress','completed']) });
export const reportInput = z.object({ projectId: id, siteId: id, reportDate: date, description: required(10000), percentComplete: z.number().int().min(0).max(100), photoDataUrl: z.string().max(500).nullable().default(null),
  materials: z.array(z.object({ materialName: required(150), quantity: z.number().min(0).max(9999999999.99), unit: text(30) })).max(100),
  manpower: z.array(z.object({ workerName: required(150), position: text(100), hoursWorked: z.number().min(0).max(24) })).max(100) });
export const photoInput = z.object({ projectId: id, siteId: id, data: z.string().max(4200000), contentType: z.enum(['image/jpeg','image/png','image/webp']) });
export function pagination(query: Record<string, unknown>) {
  return { limit: z.coerce.number().int().min(1).max(100).default(100).parse(query.limit), after: z.coerce.number().int().min(0).default(0).parse(query.after) };
}
export function validateImage(data: string, type: string) {
  const bytes = Buffer.from(data, 'base64');
  const valid = type === 'image/jpeg' ? bytes.subarray(0, 3).equals(Buffer.from([255,216,255]))
    : type === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
  if (!valid || bytes.length > 3 * 1024 * 1024 || !bytes.length) throw new Error('Use a JPEG, PNG or WebP image up to 3 MB.');
  return bytes;
}
