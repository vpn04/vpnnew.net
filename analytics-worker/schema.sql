CREATE TABLE IF NOT EXISTS pages (
  path TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  total_views INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS page_views_daily (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE TABLE IF NOT EXISTS page_views_monthly (
  month TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (month, path)
);

CREATE TABLE IF NOT EXISTS page_views_yearly (
  year TEXT NOT NULL,
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (year, path)
);

CREATE INDEX IF NOT EXISTS idx_pages_total_views ON pages (total_views DESC);
CREATE INDEX IF NOT EXISTS idx_daily_views ON page_views_daily (day, views DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_views ON page_views_monthly (month, views DESC);
CREATE INDEX IF NOT EXISTS idx_yearly_views ON page_views_yearly (year, views DESC);
