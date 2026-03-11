# Déploiement sur Infomaniak — avocat.quiba.fr

Guide de déploiement manuel du site Cabinet Audinet sur hébergement mutualisé Infomaniak (Node.js).

---

## Étape 1 : Créer le site Node.js dans le Manager Infomaniak

1. Connectez-vous au **Manager Infomaniak** (manager.infomaniak.com)
2. Allez dans **Hébergement Web** → sélectionnez votre hébergement
3. Cliquez sur **Ajouter un site**
4. Choisissez **Node.js** comme type de site
5. Sélectionnez la version **Node.js 20** (ou supérieure, version LTS)
6. Associez le domaine **avocat.quiba.fr**
7. Choisissez l'installation **personnalisée** (pas le projet exemple)

---

## Étape 2 : Créer un accès SSH/SFTP

Infomaniak ne crée pas automatiquement d'utilisateur SSH pour les sites Node.js.

1. Dans le Manager → **Hébergement Web** → **FTP / SSH**
2. Cliquez **Ajouter un utilisateur**
3. Activez l'accès **SSH** (en plus de SFTP)
4. Notez le nom d'utilisateur et mot de passe

---

## Étape 3 : Configurer le site dans le Manager

Dans le tableau de bord de votre site Node.js, configurez :

| Paramètre | Valeur |
|-----------|--------|
| **Dossier d'exécution** | `./` |
| **Commande de build** | `npm install --production && npm run build` |
| **Commande de lancement** | `npm start` |
| **Port d'écoute** | `3000` |

> ⚠️ **Important** : Le port dans le Manager doit correspondre au port dans votre fichier `.env`. Votre code utilise `process.env.PORT || 3000`, donc ça marchera. Si Infomaniak impose un port différent via la variable `PORT`, votre code s'adaptera automatiquement.

---

## Étape 4 : Préparer les fichiers à envoyer

Sur votre Mac, ouvrez un Terminal dans le dossier du projet et créez une archive **sans** `node_modules` ni `.env` :

```bash
# Depuis le dossier du projet
tar czf audinetavocat.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.production' \
  --exclude='.DS_Store' \
  --exclude='public/css/main.css' \
  server.js \
  package.json \
  package-lock.json \
  ecosystem.config.js \
  main.js \
  config/ \
  content/ \
  middleware/ \
  public/ \
  routes/ \
  scripts/ \
  src/ \
  utils/ \
  views/ \
  .gitignore \
  .env.example \
  *.html \
  style.css
```

---

## Étape 5 : Transférer les fichiers via SFTP

Utilisez un client SFTP (comme **Cyberduck** ou **FileZilla**) :

1. **Hôte** : votre serveur Infomaniak (indiqué dans le Manager, quelque chose comme `sshXXX.infomaniak.com`)
2. **Port** : 22
3. **Protocole** : SFTP
4. **Utilisateur / Mot de passe** : ceux créés à l'étape 2

Naviguez vers le répertoire de votre site (souvent `sites/avocat.quiba.fr/`), puis :
- Déposez l'archive `audinetavocat.tar.gz`

---

## Étape 6 : Installer via SSH

Connectez-vous en SSH (via le navigateur depuis le Manager, ou via Terminal) :

```bash
# 1. Aller dans le dossier du site
cd sites/avocat.quiba.fr/

# 2. Extraire l'archive
tar xzf audinetavocat.tar.gz

# 3. Supprimer l'archive
rm audinetavocat.tar.gz

# 4. Créer le fichier .env de production
cat > .env << 'EOF'
PORT=3000
HOST=127.0.0.1
NODE_ENV=production
SITE_URL=https://avocat.quiba.fr
SESSION_SECRET=p8;Tvf+1vcyQ^kL3^&,9*uh95YMA1,{-
ADMIN_EMAIL=sebastien@quiba.net
ADMIN_PASSWORD_HASH=$2b$12$IeHxJctXKUP2e0fqTrXnZ.whNuKs39HJd1MQ9fP0ErNv7iDLoEEoy
EOF

# 5. Installer les dépendances
npm install --production

# 6. Builder le CSS (Tailwind)
npm run build
```

> **Note sur le PORT** : Si Infomaniak assigne un port différent via la variable d'environnement `PORT`, votre code s'adaptera automatiquement grâce à `process.env.PORT || 3000`. Vérifiez dans le dashboard Node.js quel port est configuré.

---

## Étape 7 : Démarrer l'application

Depuis le **tableau de bord Node.js** dans le Manager Infomaniak :

1. Cliquez sur **Démarrer** (ou **Redémarrer**)
2. Vérifiez la **console d'exécution** pour voir les logs
3. Vous devriez voir : `Audinet site listening on http://127.0.0.1:3000`

---

## Étape 8 : Configurer le SSL

1. Dans le Manager → votre site → **Certificat SSL**
2. Activez le **certificat Let's Encrypt** gratuit (inclus chez Infomaniak)
3. Le site sera alors accessible en HTTPS

---

## Étape 9 : Vérifications post-déploiement

Testez ces URLs dans votre navigateur :

- [ ] `https://avocat.quiba.fr` → page d'accueil
- [ ] `https://avocat.quiba.fr/cabinet` → page cabinet
- [ ] `https://avocat.quiba.fr/contact` → formulaire de contact
- [ ] `https://avocat.quiba.fr/blog` → liste des articles
- [ ] `https://avocat.quiba.fr/admin` → back-office (connexion)
- [ ] `https://avocat.quiba.fr/sitemap.xml` → sitemap XML
- [ ] `https://avocat.quiba.fr/robots.txt` → fichier robots

---

## Mise à jour du site (procédure pour les mises à jour futures)

```bash
# Sur votre Mac : recréer l'archive avec les fichiers modifiés
# Transférer via SFTP
# En SSH :
cd sites/avocat.quiba.fr/
tar xzf audinetavocat.tar.gz
rm audinetavocat.tar.gz
npm install --production
npm run build
# Puis redémarrer depuis le Manager Infomaniak
```

---

## Dépannage

### Le site affiche une erreur 502 ou ne démarre pas
→ Vérifiez la console dans le dashboard Node.js
→ Vérifiez que le port correspond (Manager vs .env)

### Les styles CSS ne s'affichent pas
→ Vérifiez que `npm run build` a bien généré `public/css/main.css`
→ Vérifiez que le dossier `public/` est bien servi

### Le back-office refuse la connexion
→ Vérifiez les variables `ADMIN_EMAIL` et `ADMIN_PASSWORD_HASH` dans `.env`
→ En production, `secure: true` est activé sur les cookies : le HTTPS est obligatoire

### Erreur "MODULE_NOT_FOUND"
→ Relancez `npm install --production` en SSH
