# STATE — EmploiSearch
*Dernière mise à jour : 26/09/2026*

## Résumé de l'état actuel

L'application tourne sur la tour (`./start.sh`) et en ligne via un tunnel TryCloudflare. `start.sh` affiche à chaque lancement l'adresse locale, l'adresse Internet (qui change à chaque démarrage) et le code d'inscription. Collecte sur HelloWork, Indeed et LinkedIn, score de profil expliqué, flux trié au clavier avec filtres, comptes utilisateur isolés, CV chiffré avec aperçu. Tests backend (41), TypeScript et linter de standards au vert des deux côtés.

Tout est sur la branche `dev` de `panzoggy/emploi-search` (commit `d00379c`), pas encore fusionné dans `main`.

## Ce qui a été fait — session du 26/09/2026

- Réparation du démarrage (lockfiles, compilation, base jamais créée), passage à pnpm et Node 22.
- Collecte réécrite : JSON-LD des pages d'offres, Indeed via Chrome sur Xvfb, pagination jusqu'à 25 offres inédites par site, doublons entre sites.
- Matching : embeddings multilingual-e5-small locaux (comparés à 5 autres modèles), critères pondérés expliqués, apprentissage favoris/rejets, analyse de CV.
- Interface refaite deux fois : d'abord « clean-minimal », jugée « AI slop » par Chris, puis style « registre » (grille, filets, zéro arrondi, accent vermillon). Filtres dans l'URL.
- Comptes (identifiant, mot de passe, sans e-mail), isolation des données par compte, CV chiffré (AES-256-GCM), aperçu du CV (pdf.js), audit de sécurité (5 failles corrigées).
- `setup.sh` pour machine vierge (testé Debian, Ubuntu, Arch, Fedora), mise en ligne systématique par TryCloudflare.
- Documentation réécrite (README, ARCHITECTURE, docs/matching.md).

## Décisions prises

| Décision | Raison | Date |
|---|---|---|
| pnpm au lieu de npm, scripts d'installation limités à Prisma et esbuild | Demande de Chris : npm = failles et malwares silencieux | 26/09 |
| Indeed limité à la page 1, trié par date | Au-delà, Indeed exige un compte : stocker des identifiants et risquer la suspension n'en vaut pas la peine | 26/09 |
| multilingual-e5-small | Meilleur AUC (0,913) sur des intitulés français que des modèles 3 à 5 fois plus lourds (docs/matching.md) | 26/09 |
| Offre « vue » après 1,5 s d'affichage ou dès qu'elle est classée | Choix de Chris : ne rien perdre de ce qui est seulement survolé | 26/09 |
| Style « registre » (suisse) pour l'interface | Choisi par Chris parmi 3 directions après rejet de la première version | 26/09 |
| Pas de déconnexion automatique : sessions de 400 jours prolongées à l'usage | Demande explicite de Chris | 26/09 |
| Pas d'e-mail ; mot de passe réinitialisé par l'hébergeur (`set-password.js`) | Demande « sans vérif mail » | 26/09 |
| Chiffrement au repos limité au CV, clé serveur | Une clé liée au mot de passe empêcherait de calculer les scores hors connexion | 26/09 |
| Offres communes, scores/statuts/recherches par compte | Pas de double téléchargement ; chacun ne voit que ce que ses recherches ont trouvé | 26/09 |
| En ligne par défaut via TryCloudflare, code d'inscription obligatoire | Demande de Chris ; sans compte Cloudflare l'adresse change à chaque démarrage | 26/09 |

## Contexte non-évident

- L'image backend est `mcr.microsoft.com/playwright:v1.63.0-noble` : sa version doit rester identique à `playwright-core` du package.json, sinon Indeed casse.
- Chrome headless est bloqué par Indeed ; seul Chrome « avec écran » sur Xvfb passe. `xvfb-run` se fige en PID 1 dans Docker : Xvfb est lancé à la main dans le CMD.
- HelloWork déclare `jobLocationType: TELECOMMUTE` dès un jour de télétravail : ce n'est pas un télétravail complet.
- Calibration des similarités e5 mesurée sur de vraies offres (titre 0,835–0,895, texte 0,83–0,885) : à revérifier si les profils utilisateurs sont très différents d'un profil tech.
- La migration `accounts_and_cv_file` a été complétée à la main : l'ancien utilisateur unique devient `personal-user`, sans mot de passe, données conservées.
- `DATA_KEY` (backend/.env) : la perdre rend les CV illisibles. À sauvegarder avec la base.
- nginx doit servir les `.mjs` en JavaScript (worker pdf.js) et transmettre `X-Forwarded-Proto` du tunnel (cookie `Secure`).
- `trycloudflare.com` est dans la Public Suffix List : chaque tunnel est un site distinct pour les cookies.
- Tailwind : ne jamais nommer une couleur `base` (collision avec la taille `text-base`).

## Prochaines étapes

1. Récupérer le compte d'avant les comptes : `docker exec -it emploi-backend node dist/auth/set-password.js personal-user <nom>`.
2. Ouvrir la pull request `dev` → `main` et prévenir l'ami de Chris (passage à pnpm, refonte complète).
3. Pénalité d'ancienneté dans le score (des offres Indeed de 6-7 mois remontent) : proposée, en attente de Chris.
4. Lieu par distance réelle (géocodage) au lieu de ville/département.

## Points en suspens

- Pénalité d'ancienneté : Chris n'a pas encore répondu.
- Adresse Internet changeante (TryCloudflare) vs tunnel nommé (compte gratuit et domaine) : à décider.
- Disque `/mnt/projects` de la tour à 100 % (3 Go libres) : hors de l'app, mais tout peut casser.
- buildx absent sur la tour (`sudo pacman -S docker-buildx`) : builds plus lents.

## Historique

### Version reçue (avant le 26/09/2026)

La version reçue ne démarrait pas : lockfiles supprimés alors que les Dockerfiles faisaient `npm ci`, back et front qui ne compilaient pas, base jamais créée (le CLI Prisma était retiré de l'image). Une fois démarrée, elle butait sur une limite de 100 requêtes par quart d'heure, des filtres incompatibles avec SQLite et des préférences mal enregistrées. HelloWork ne ramenait rien (sélecteurs inventés) et Indeed était bloqué par Cloudflare. Pas de comptes, pas de matching, une interface générique.
