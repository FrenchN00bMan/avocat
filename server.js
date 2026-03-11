const path = require('path');
const fs = require('fs');
const express = require('express');
const nunjucks = require('nunjucks');
const session = require('express-session');
const compression = require('compression');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const site = require('./config/site.json');
const publicRoutes = require('./routes/public');
const blogRoutes = require('./routes/blog');
const adminRoutes = require('./routes/admin');
const { buildSitemapXml } = require('./utils/sitemap');
const { getTrackingSettings } = require('./utils/tracking');

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const siteUrl = process.env.SITE_URL || site.url;

nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production'
});

app.set('view engine', 'njk');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  name: 'audinet.sid',
  secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use(async (req, res, next) => {
  res.locals.site = site;
  res.locals.siteUrl = siteUrl;
  res.locals.currentPath = req.path;
  res.locals.currentYear = new Date().getFullYear();
  res.locals.adminUser = req.session.adminUser || null;
  try {
    res.locals.tracking = await getTrackingSettings();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/public', express.static(path.join(__dirname, 'public'), {
  extensions: false,
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0
}));

app.use('/', publicRoutes);
app.use('/', blogRoutes);
app.use('/admin', adminRoutes);

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const xml = await buildSitemapXml(siteUrl);
    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).render('pages/404', {
    seo: {
      title: 'Page introuvable | Cabinet Audinet',
      description: 'La page demandée est introuvable sur le site du cabinet Audinet.',
      canonical: `${siteUrl}${req.path}`
    }
  });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Une erreur est survenue.'
    : error.message;

  if (req.accepts('html')) {
    res.status(status).render('pages/error', {
      seo: {
        title: 'Erreur | Cabinet Audinet',
        description: 'Une erreur est survenue sur le site du cabinet Audinet.',
        canonical: `${siteUrl}${req.path}`
      },
      status,
      message
    });
    return;
  }

  res.status(status).json({ error: message });
});

if (require.main === module) {
  if (!fs.existsSync(path.join(__dirname, 'content', 'articles'))) {
    fs.mkdirSync(path.join(__dirname, 'content', 'articles'), { recursive: true });
  }

  app.listen(port, host, () => {
    console.log(`Audinet site listening on http://${host}:${port}`);
  });
}

module.exports = app;
