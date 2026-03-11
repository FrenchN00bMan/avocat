const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const { getAllArticles, getArticleBySlug, saveArticle, updateArticle, deleteArticle } = require('../utils/markdown');
const { getTrackingSettings, saveTrackingSettings } = require('../utils/tracking');

const router = express.Router();
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 30 * 60 * 1000;

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
}

function getAttemptState(ip) {
  const now = Date.now();
  const existing = loginAttempts.get(ip);

  if (!existing || now > existing.windowEndsAt) {
    const fresh = {
      count: 0,
      windowEndsAt: now + WINDOW_MS,
      blockedUntil: 0
    };
    loginAttempts.set(ip, fresh);
    return fresh;
  }

  return existing;
}

function registerFailure(ip) {
  const state = getAttemptState(ip);
  state.count += 1;

  if (state.count >= MAX_ATTEMPTS) {
    state.blockedUntil = Date.now() + BLOCK_MS;
  }

  loginAttempts.set(ip, state);
}

function clearFailures(ip) {
  loginAttempts.delete(ip);
}

function getBlockMessage(state) {
  const remainingMs = state.blockedUntil - Date.now();
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return `Accès temporairement bloqué. Réessayez dans ${remainingMinutes} min.`;
}

async function passwordMatches(password) {
  if (!password) {
    return false;
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return false;
  }

  return bcrypt.compare(password, hash);
}

function renderLogin(res, error = null, status = 200) {
  return res.status(status).render('admin/login', {
    seo: {
      title: 'Connexion admin | Cabinet Audinet',
      description: 'Connexion au back-office du cabinet Audinet.',
      canonical: `${process.env.SITE_URL || 'https://www.audinetavocat.fr'}/admin/login`
    },
    error
  });
}

router.get('/login', (req, res) => {
  if (!process.env.ADMIN_PASSWORD_HASH) {
    return renderLogin(res, "Configuration admin incomplète : définissez ADMIN_PASSWORD_HASH dans l'environnement.", 503);
  }

  return renderLogin(res);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const targetEmail = process.env.ADMIN_EMAIL || 'geraldine@audinetavocat.fr';
  const ip = getClientIp(req);
  const state = getAttemptState(ip);

  if (!process.env.ADMIN_PASSWORD_HASH) {
    return renderLogin(res, "Configuration admin incomplète : définissez ADMIN_PASSWORD_HASH dans l'environnement.", 503);
  }

  if (state.blockedUntil && state.blockedUntil > Date.now()) {
    return renderLogin(res, getBlockMessage(state), 429);
  }

  if (email === targetEmail && await passwordMatches(password)) {
    clearFailures(ip);
    return req.session.regenerate((error) => {
      if (error) {
        return renderLogin(res, "Impossible d'ouvrir la session admin.", 500);
      }

      req.session.adminUser = { email };
      return res.redirect('/admin/dashboard');
    });
  }

  registerFailure(ip);
  return renderLogin(res, 'Identifiants invalides.', 401);
});

router.post('/logout', (req, res) => {
  res.clearCookie('audinet.sid');
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const allArticles = await getAllArticles({ includeDrafts: true });
    const draftCount = allArticles.filter((article) => !article.published).length;
    const publishedCount = allArticles.length - draftCount;
    const filter = ['all', 'published', 'draft'].includes(req.query.status) ? req.query.status : 'all';
    const articles = allArticles.filter((article) => {
      if (filter === 'published') {
        return article.published;
      }

      if (filter === 'draft') {
        return !article.published;
      }

      return true;
    });

    res.render('admin/dashboard', {
      articles,
      filter,
      totalCount: allArticles.length,
      draftCount,
      publishedCount,
      seo: {
        title: 'Dashboard admin | Cabinet Audinet',
        description: 'Gestion des articles du cabinet Audinet.',
        canonical: `${process.env.SITE_URL || 'https://www.audinetavocat.fr'}/admin/dashboard`
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tracking', requireAuth, async (req, res, next) => {
  try {
    const tracking = await getTrackingSettings();
    res.render('admin/tracking', {
      tracking,
      saved: req.query.saved === '1',
      seo: {
        title: 'Tracking | Cabinet Audinet',
        description: 'Configuration GA4 et tags du site.',
        canonical: `${process.env.SITE_URL || 'https://www.audinetavocat.fr'}/admin/tracking`
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/tracking', requireAuth, async (req, res, next) => {
  try {
    await saveTrackingSettings(req.body);
    res.redirect('/admin/tracking?saved=1');
  } catch (error) {
    next(error);
  }
});

router.get('/articles/new', requireAuth, (req, res) => {
  res.render('admin/editor', {
    article: {
      published: false,
      category: 'Droit du travail',
      readingTime: '5 min'
    },
    seo: {
      title: 'Nouvel article | Cabinet Audinet',
      description: 'Créer un article du blog.',
      canonical: `${process.env.SITE_URL || 'https://www.audinetavocat.fr'}/admin/articles/new`
    }
  });
});

router.post('/articles', requireAuth, async (req, res, next) => {
  try {
    const saved = await saveArticle({
      ...req.body,
      published: req.body.published === 'true'
    });
    res.redirect(`/admin/articles/${saved.slug}/edit`);
  } catch (error) {
    next(error);
  }
});

router.get('/articles/:slug/edit', requireAuth, async (req, res, next) => {
  try {
    const article = await getArticleBySlug(req.params.slug, { includeDrafts: true });
    if (!article) {
      return res.redirect('/admin/dashboard');
    }

    return res.render('admin/editor', {
      article,
      seo: {
        title: 'Éditer un article | Cabinet Audinet',
        description: 'Édition du contenu du blog.',
        canonical: `${process.env.SITE_URL || 'https://www.audinetavocat.fr'}/admin/articles/${req.params.slug}/edit`
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/articles/:slug', requireAuth, async (req, res, next) => {
  try {
    const saved = await updateArticle(req.params.slug, {
      ...req.body,
      published: req.body.published === 'true'
    });
    res.redirect(`/admin/articles/${saved.slug}/edit`);
  } catch (error) {
    next(error);
  }
});

router.post('/articles/:slug/delete', requireAuth, async (req, res, next) => {
  try {
    await deleteArticle(req.params.slug);
    res.redirect('/admin/dashboard');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
