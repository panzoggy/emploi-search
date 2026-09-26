# État du projet

Mis à jour le 26/09/2026.

## Où on en est

L'application démarre avec `./start.sh` et fonctionne de bout en bout : collecte sur les trois sites, profil avec import de CV, score expliqué, flux trié au clavier, historique des recherches. Tests backend (41) et vérification TypeScript au vert, linter de standards sans violation côté backend comme frontend.

Testé en réel : une recherche « développeur react / Lyon » ramène environ 55 offres nouvelles (HelloWork 16, Indeed 15, LinkedIn 25), toutes avec leur description complète. Relancée, elle ne ramène que des offres inédites.

## Ce qui a changé par rapport à la version reçue

La version reçue ne démarrait pas : lockfiles supprimés alors que les Dockerfiles faisaient `npm ci`, back et front qui ne compilaient pas, base jamais créée (le CLI Prisma était retiré de l'image). Une fois démarrée, elle butait sur une limite de 100 requêtes par quart d'heure, des filtres incompatibles avec SQLite et des préférences mal enregistrées. HelloWork ne ramenait rien (sélecteurs inventés) et Indeed était bloqué par Cloudflare.

Refonte faite depuis :

- pnpm à la place de npm, avec la liste explicite des paquets autorisés à exécuter un script d'installation (Prisma, esbuild). Node 22.
- Backend réorganisé par domaine (`collection`, `offers`, `profile`, `matching`, `shared`), migrations Prisma au lieu de `db push`, logs pino.
- Collecte : lecture du JSON-LD des pages d'offres, pagination jusqu'à 25 offres inédites par site, détection des doublons entre sites, Indeed via Chrome sur écran virtuel.
- Score : embeddings locaux et critères pondérés, expliqués à l'écran, avec apprentissage des favoris et des rejets.
- Interface refaite en style « registre » (grille, filets, zéro arrondi, un accent vermillon) : thème sombre par défaut et thème clair, flux en deux colonnes, raccourcis clavier, annulation, affichage mobile.
- Filtres du flux (texte, source, contrat, télétravail, score minimum, date) gardés dans l'URL.

- Comptes (identifiant et mot de passe, sans e-mail), sessions de 400 jours prolongées à l'usage, isolation complète des données par compte, CV chiffré au repos, aperçu du CV (rendu pdf.js).
- En ligne par défaut via TryCloudflare : `start.sh` affiche toujours l'adresse locale, l'adresse publique et le code d'inscription. `setup.sh` prépare une machine vierge (Docker compris) et `start.sh` le lance tout seul si besoin.

## Décisions

- Indeed : pas de connexion à un compte pour dépasser la première page, pour ne pas stocker d'identifiants et ne pas risquer la suspension du compte. Tri par date à la place.
- Modèle d'embeddings choisi sur mesure (voir `docs/matching.md`).
- Une offre compte comme vue après 1,5 s d'affichage ou dès qu'elle est classée.
- Pas de déconnexion automatique (demande explicite). Pas d'e-mail : mot de passe réinitialisé par l'hébergeur (`set-password.js`).
- Chiffrement au repos limité au CV, avec une clé serveur : un chiffrement lié au mot de passe empêcherait le calcul des scores quand l'utilisateur n'est pas connecté.
