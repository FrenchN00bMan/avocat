const express = require('express');
const site = require('../config/site.json');
const { getAllArticles } = require('../utils/markdown');

const router = express.Router();

function renderPage(res, template, options = {}) {
  const canonical = options.canonical || '/';
  const schema = options.schema ? JSON.stringify(options.schema) : null;

  res.render(template, {
    ...options,
    schemaJson: schema,
    seo: {
      ...options.seo,
      canonical: `${site.url}${canonical}`
    }
  });
}

router.get('/', async (req, res, next) => {
  try {
    const latestArticles = (await getAllArticles()).slice(0, 2);

    renderPage(res, 'pages/index', {
      canonical: '/',
      navKey: 'home',
      latestArticles,
      seo: {
        title: 'Avocat Droit du Travail Clermont-Ferrand | Maître Géraldine Audinet',
        description: "Maître Géraldine Audinet, avocate exclusivement spécialisée en droit du travail et sécurité sociale à Clermont-Ferrand depuis 1999. Conseil et contentieux pour employeurs."
      },
      schema: {
        '@context': 'https://schema.org',
        '@type': 'LegalService',
        name: site.legalName,
        description: "Cabinet d'avocat exclusivement spécialisé en droit du travail et sécurité sociale à Clermont-Ferrand.",
        url: site.url,
        telephone: site.phone,
        email: site.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: site.address,
          addressLocality: site.city,
          postalCode: site.postalCode,
          addressCountry: site.country
        },
        areaServed: site.areaServed,
        founder: {
          '@type': 'Person',
          name: 'Géraldine Audinet',
          jobTitle: 'Avocate'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/avocat-droit-travail-employeurs/', (req, res) => {
  renderPage(res, 'pages/employeurs', {
    canonical: '/avocat-droit-travail-employeurs/',
    navKey: 'employeurs',
    seo: {
      title: 'Avocat Droit du Travail pour Employeurs – Clermont-Ferrand | Maître Audinet',
      description: 'Maître Audinet, avocate spécialisée en droit social, accompagne les employeurs du Puy-de-Dôme : contrats, licenciement, IRP, conventions collectives. Conseil et contentieux.'
    },
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      name: 'Cabinet Audinet – Droit du travail employeurs',
      url: `${site.url}/avocat-droit-travail-employeurs/`,
      areaServed: 'Clermont-Ferrand'
    }
  });
});

router.get('/licenciement-avocat-clermont-ferrand/', (req, res) => {
  renderPage(res, 'pages/licenciement', {
    canonical: '/licenciement-avocat-clermont-ferrand/',
    navKey: 'licenciement',
    seo: {
      title: 'Avocat Licenciement Clermont-Ferrand | Sécurisez votre procédure | Maître Audinet',
      description: 'Maître Audinet vous accompagne pour tout licenciement : motif personnel, économique, inaptitude, rupture conventionnelle. Sécurisation de la procédure et défense prud’homale.'
    },
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Quel est le délai pour contester un licenciement aux prud'hommes ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Le salarié dispose de 12 mois à compter de la notification du licenciement pour saisir le Conseil de prud'hommes."
          }
        }
      ]
    }
  });
});

router.get('/redaction-contrats-travail/', (req, res) => {
  renderPage(res, 'pages/contrats', {
    canonical: '/redaction-contrats-travail/',
    navKey: 'contrats',
    seo: {
      title: 'Rédaction Contrats de Travail Employeur – Avocat Clermont-Ferrand | Maître Audinet',
      description: 'Maître Audinet rédige et sécurise vos contrats de travail : CDI, CDD, clauses de non-concurrence, forfait jours, rémunération variable. Conseil employeur à Clermont-Ferrand.'
    }
  });
});

router.get('/droit-securite-sociale-employeur/', (req, res) => {
  renderPage(res, 'pages/securite-sociale', {
    canonical: '/droit-securite-sociale-employeur/',
    navKey: 'securite-sociale',
    seo: {
      title: 'Avocat Droit Sécurité Sociale Employeur – URSSAF, AT/MP | Maître Audinet Clermont-Ferrand',
      description: 'Maître Audinet défend les employeurs face aux contrôles URSSAF, accidents du travail et maladies professionnelles à Clermont-Ferrand. Recours amiable, contentieux Pôle Social.'
    }
  });
});

router.get('/cabinet-audinet/', (req, res) => {
  renderPage(res, 'pages/cabinet', {
    canonical: '/cabinet-audinet/',
    navKey: 'cabinet',
    seo: {
      title: 'Maître Géraldine Audinet – Avocate droit du travail Clermont-Ferrand depuis 1999',
      description: 'Maître Géraldine Audinet, avocate inscrite au Barreau de Clermont-Ferrand depuis 1999, spécialisée exclusivement en droit du travail et sécurité sociale.'
    }
  });
});

router.get('/contact/', (req, res) => {
  renderPage(res, 'pages/contact', {
    canonical: '/contact/',
    navKey: 'contact',
    seo: {
      title: 'Contact & Rendez-vous | Cabinet Audinet – Avocat droit du travail Clermont-Ferrand',
      description: 'Prenez rendez-vous avec Maître Géraldine Audinet, avocate spécialisée en droit du travail à Clermont-Ferrand. Réponse sous 24h.'
    }
  });
});

module.exports = router;
