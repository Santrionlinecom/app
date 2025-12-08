-- Migration: Add SEO fields to cms_posts
ALTER TABLE cms_posts ADD COLUMN seo_keyword TEXT;
ALTER TABLE cms_posts ADD COLUMN meta_description TEXT;
git add package.json package-lock.json
git commit -m "Fix blog"
git push