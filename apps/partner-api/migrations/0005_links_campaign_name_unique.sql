DELETE FROM links
WHERE id IN (
  SELECT duplicate.id
  FROM links AS duplicate
  INNER JOIN links AS keeper
    ON duplicate.user_uid = keeper.user_uid
   AND duplicate.campaign_name = keeper.campaign_name
   AND (
     duplicate.created_at > keeper.created_at
     OR (
       duplicate.created_at = keeper.created_at
       AND duplicate.id > keeper.id
     )
   )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_links_user_uid_campaign_name_unique
ON links(user_uid, campaign_name);
