const fs = require('fs/promises');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const slugify = require('slugify');

const articlesDir = path.join(__dirname, '..', 'content', 'articles');

marked.setOptions({
  headerIds: true,
  mangle: false
});

function ensureIsoDate(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function createExcerpt(content) {
  const text = content
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`>-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

function fileNameForArticle(date, slug) {
  return `${ensureIsoDate(date)}-${slug}.md`;
}

async function getArticleFiles() {
  try {
    const files = await fs.readdir(articlesDir);
    return files.filter((file) => file.endsWith('.md')).sort().reverse();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function parseArticleFile(fileName) {
  const fullPath = path.join(articlesDir, fileName);
  const raw = await fs.readFile(fullPath, 'utf8');
  const parsed = matter(raw);
  const slug = parsed.data.slug || fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  const date = ensureIsoDate(parsed.data.date || fileName.slice(0, 10));

  return {
    fileName,
    fullPath,
    slug,
    title: parsed.data.title || slug,
    description: parsed.data.description || parsed.data.summary || createExcerpt(parsed.content),
    summary: parsed.data.summary || createExcerpt(parsed.content),
    category: parsed.data.category || 'Droit du travail',
    readingTime: parsed.data.readingTime || `${Math.max(3, Math.ceil(parsed.content.split(/\s+/).length / 180))} min`,
    published: parsed.data.published !== false,
    date,
    html: marked.parse(parsed.content),
    content: parsed.content
  };
}

async function getAllArticles({ includeDrafts = false } = {}) {
  const files = await getArticleFiles();
  const articles = await Promise.all(files.map(parseArticleFile));

  return articles.filter((article) => includeDrafts || article.published);
}

async function getArticleBySlug(slug, { includeDrafts = false } = {}) {
  const files = await getArticleFiles();

  for (const file of files) {
    const article = await parseArticleFile(file);
    if (article.slug === slug && (includeDrafts || article.published)) {
      return article;
    }
  }

  return null;
}

async function saveArticle(input) {
  const slug = slugify(input.slug || input.title || 'article', { lower: true, strict: true });
  const date = ensureIsoDate(input.date);
  const fileName = fileNameForArticle(date, slug);
  const fullPath = path.join(articlesDir, fileName);

  const frontmatter = [
    '---',
    `title: "${(input.title || '').replace(/"/g, '\\"')}"`,
    `slug: "${slug}"`,
    `date: "${date}"`,
    `description: "${(input.description || '').replace(/"/g, '\\"')}"`,
    `summary: "${(input.summary || '').replace(/"/g, '\\"')}"`,
    `category: "${(input.category || 'Droit du travail').replace(/"/g, '\\"')}"`,
    `readingTime: "${(input.readingTime || '5 min').replace(/"/g, '\\"')}"`,
    `published: ${input.published ? 'true' : 'false'}`,
    '---',
    '',
    input.content || ''
  ].join('\n');

  await fs.mkdir(articlesDir, { recursive: true });
  await fs.writeFile(fullPath, frontmatter, 'utf8');

  return {
    slug,
    fileName
  };
}

async function updateArticle(previousSlug, input) {
  const existing = await getArticleBySlug(previousSlug, { includeDrafts: true });
  if (!existing) {
    const error = new Error('Article introuvable');
    error.status = 404;
    throw error;
  }

  const next = await saveArticle({
    ...existing,
    ...input
  });

  if (existing.fileName !== next.fileName) {
    await fs.unlink(existing.fullPath);
  }

  return next;
}

async function deleteArticle(slug) {
  const article = await getArticleBySlug(slug, { includeDrafts: true });
  if (!article) {
    return false;
  }

  await fs.unlink(article.fullPath);
  return true;
}

module.exports = {
  getAllArticles,
  getArticleBySlug,
  saveArticle,
  updateArticle,
  deleteArticle
};
