const { getAllArticles } = require('./markdown');

const staticPaths = [
  '/',
  '/avocat-droit-travail-employeurs/',
  '/licenciement-avocat-clermont-ferrand/',
  '/redaction-contrats-travail/',
  '/droit-securite-sociale-employeur/',
  '/cabinet-audinet/',
  '/contact/',
  '/actualites/'
];

async function buildSitemapXml(siteUrl) {
  const articles = await getAllArticles();
  const urls = [
    ...staticPaths.map((path) => ({
      loc: `${siteUrl}${path}`,
      lastmod: new Date().toISOString().slice(0, 10)
    })),
    ...articles.map((article) => ({
      loc: `${siteUrl}/actualites/${article.slug}/`,
      lastmod: article.date
    }))
  ];

  const items = urls.map((item) => `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

module.exports = {
  buildSitemapXml
};
