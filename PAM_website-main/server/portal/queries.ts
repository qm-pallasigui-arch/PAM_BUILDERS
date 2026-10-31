export const projectColumns = `p.id,p.name,p.category,p.color,p.permits, ARRAY(SELECT u.name FROM users u JOIN project_assignments a ON a.user_id=u.id WHERE a.project_id=p.id ORDER BY u.name) AS "assignedNames",COALESCE(p.client,'') AS client,COALESCE(p.location,'') AS location,
  p.start_date::text AS "startDate",p.end_date::text AS "endDate",p.budget::float8 AS budget,p.status,
  ARRAY(SELECT s.id FROM sites s WHERE s.project_id=p.id ORDER BY s.id) AS "siteIds",
  ARRAY(SELECT a.user_id FROM project_assignments a WHERE a.project_id=p.id ORDER BY a.user_id) AS "assignedUserIds"`;
export const siteColumns = `id,project_id AS "projectId",name,COALESCE(address,'') AS address`;
export const milestoneColumns = `id,project_id AS "projectId",title,COALESCE(description,'') AS description,due_date::text AS "dueDate",status,completed_at AS "completedAt"`;
export const reportColumns = `r.id,r.project_id AS "projectId",r.site_id AS "siteId",r.submitted_by AS "submittedBy",
  (SELECT name FROM users WHERE id=r.submitted_by) AS "submittedByName",r.report_date::text AS "reportDate",
  r.correction_reason AS "correctionReason",r.description,r.percent_complete AS "percentComplete",
  CASE WHEN r.photo_url IS NULL THEN NULL ELSE '/api/portal/reports/' || r.id || '/photo' END AS "photoDataUrl",
  COALESCE((SELECT json_agg(json_build_object('materialName',material_name,'quantity',quantity::float8,'unit',unit) ORDER BY id) FROM materials_log WHERE report_id=r.id),'[]') AS materials,
  COALESCE((SELECT json_agg(json_build_object('workerName',worker_name,'position',position,'hoursWorked',hours_worked::float8) ORDER BY id) FROM manpower_log WHERE report_id=r.id),'[]') AS manpower`;
export const userColumns = `id,name,email,role,status`;
