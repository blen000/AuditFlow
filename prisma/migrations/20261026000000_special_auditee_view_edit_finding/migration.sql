-- Adds "Edit Finding" to the Special Auditee View actions.
-- Roles that could edit findings in the Normal Auditee View (or hold its "Full access"
-- parent) and can open the Special Auditee View keep matching access on special cases.
UPDATE "Role" r
SET "permissions" = ARRAY(
  SELECT DISTINCT p
  FROM unnest(r."permissions" || ARRAY['auditee_special_edit_finding']) AS p
)
WHERE 'auditee_view_special' = ANY (r."permissions")
  AND ('auditee_view_access' = ANY (r."permissions")
    OR 'auditee_view_edit_finding' = ANY (r."permissions"));
