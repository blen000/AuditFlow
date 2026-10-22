-- The Auditee View now has separate "Normal" and "Special" permissions.
-- Special audit follow-up/response/progress/status actions used to be available from
-- the Special Audit Reports page to anyone holding the Auditee View permissions plus
-- special audit report access. Grant the new Special Auditee View permission to
-- exactly those roles so their access is unchanged; administrators can then adjust it
-- independently in Role Management.
--
-- Normal Auditee View access needs no data change: it is derived at runtime from the
-- existing Auditee View permissions (see normalizePermissions in src/lib/permissions.ts).
UPDATE "Role"
SET "permissions" = array_append("permissions", 'auditee_view_special')
WHERE NOT ('auditee_view_special' = ANY ("permissions"))
  AND (
    'auditee_view_access' = ANY ("permissions")
    OR "permissions" && ARRAY[
      'auditee_view_follow_up',
      'auditee_view_auditee_response',
      'auditee_view_add_progress',
      'auditee_view_change_status'
    ]::text[]
  )
  AND (
    'reports_special_audits_access' = ANY ("permissions")
    OR 'special_audits_new_access' = ANY ("permissions")
  );
