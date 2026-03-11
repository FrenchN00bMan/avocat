const express = require('express');
const site = require('../config/site.json');
const { getAllArticles, getArticleBySlug } = require('../utils/markdown');

const router = express.Router();

router.get('/actualites/', async (req, res, next) => {
  try {
    const articles = await getAllArticles();
    res.render('pages/blog/index', {
      navKey: 'blog',
      articles,
      seo: {
        title: 'Actualités Droit du Travail Employeurs | Blog Cabinet Audinet Clermont-Ferrand',
        description: 'Actualités juridiques en droit du travail pour les employeurs : licenciement, rupture conventionnelle, contrats, CSE, URSSAF.',
        canonical: `${site.url}/actualites/`
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/actualites/:slug/', async (req, res, next) => {
  try {
    const article = await getArticleBySlug(req.params.slug);

    if (!article) {
      return res.status(404).render('pages/404', {
        seo: {
          title: 'Article introuvable | Cabinet Audinet',
          description: "L'article demandé est introuvable.",
          canonical: `${site.url}/actualites/${req.params.slug}/`
        }
      });
    }

    return res.render('pages/blog/article', {
      navKey: 'blog',
      article,
      seo: {
        title: `${article.title} | Cabinet Audinet`,
        description: article.description,
        canonical: `${site.url}/actualites/${article.slug}/`
      },
      schemaJson: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: article.date,
        author: {
          '@type': 'Person',
          name: 'Géraldine Audinet'
        },
        publisher: {
          '@type': 'LegalService',
          name: site.name
        }
      })
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
