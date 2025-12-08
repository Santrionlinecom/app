-- Migration: Add SEO fields to cms_posts
ALTER TABLE cms_posts ADD COLUMN seo_keyword TEXT;
ALTER TABLE cms_posts ADD COLUMN meta_description TEXT;
