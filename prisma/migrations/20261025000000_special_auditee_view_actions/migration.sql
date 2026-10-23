-- The Special Auditee View now has its own action permissions, separate from the
-- Normal Auditee View, so each can be granted independently in Role Management.
--
-- Until now special audit cases were acted on with the normal Auditee View action
-- keys. Copy those across for every role that can open the Special Auditee View, so
-- nobody gains or loses anything on deploy. The "Full access" parent
-- (auditee_view_access) granted every action, so it maps to all special actions.
UPDATE "Role" r
SET "permissions" = ARRAY(
  SELECT DISTINCT p
  FROM unnest(
    r."permissions" || ARRAY(
      SELECT m.special
      FROM (VALUES
        ('auditee_view_follow_up',       'auditee_special_follow_up'),
        ('auditee_view_auditee_response', 'auditee_special_auditee_response'),
        ('auditee_view_add_progress',    'auditee_special_add_progress'),
        ('auditee_view_change_status',   'auditee_special_change_status'),
        ('auditee_view_delete_finding',  'auditee_special_delete')
      ) AS m(normal, special)
      WHERE 'auditee_view_access' = ANY (r."permissions")
         OR m.normal = ANY (r."permissions")
    )
  ) AS p
)
WHERE 'auditee_view_special' = ANY (r."permissions");
