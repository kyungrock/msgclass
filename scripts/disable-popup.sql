UPDATE popup_config
SET enabled = 0,
    title = '',
    body = '',
    updated_at = datetime('now')
WHERE id = 1;
