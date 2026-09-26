# EmploiSearch

Un outil perso de recherche d'emploi. Il va chercher les offres sur HelloWork, Indeed et LinkedIn, les range selon ton profil et ne te remontre jamais une offre que tu as déjà vue, sauf si tu l'as gardée en favori ou marquée comme intéressante.

Le principe : tu décris ce que tu cherches (ou tu déposes ton CV), tu lances une recherche, puis tu tries le flux au clavier. Chaque offre a un score sur 100 avec le détail de ce qui colle et de ce qui ne colle pas. Tes choix affinent le classement des offres suivantes.

## Lancer l'application

Sur une machine Linux, il suffit de :

```bash
git clone https://github.com/panzoggy/emploi-search.git && cd emploi-search
./start.sh
```

Au premier lancement, `start.sh` voit que rien n'est prêt et lance `./setup.sh` tout seul. Le setup installe Docker s'il manque (Debian, Ubuntu, Raspberry Pi OS, Arch, Fedora), le démarre et l'active au boot, crée `backend/.env` avec la clé de chiffrement et le code d'inscription, puis construit les images. Il demande le mot de passe `sudo` si Docker doit être installé. Il peut être relancé sans risque : ce qui est déjà fait est sauté.

À la fin, `start.sh` affiche toujours la même chose :

```
EmploiSearch tourne
  Réseau local        http://192.168.1.42
  Internet            https://mots-au-hasard.trycloudflare.com
  Code d'inscription  k3x9-exemple
```

L'adresse locale sert à la maison, l'adresse Internet partout ailleurs. Le code est demandé à la création d'un compte : c'est lui qu'on transmet aux personnes invitées.

```bash
./start.sh            # réseau local et Internet
./start.sh --local    # réseau local seulement, sans tunnel
./stop.sh             # arrête tout (les données sont conservées)
./restart.sh          # arrête puis relance en reconstruisant, par exemple après un git pull
```

L'adresse Internet change à chaque redémarrage de l'app ou de la machine. Relancer `./start.sh` quand tout tourne déjà ne coupe rien et réaffiche les adresses actuelles.

Le premier lancement prend quelques minutes : il y a environ 3 Go à télécharger, Chrome (pour Indeed) et le modèle de classement. Si le port 80 est déjà pris : `FRONTEND_PORT=8080 ./start.sh`. Les logs de la session en cours sont dans `logs/app.log` ; ils repartent de zéro à chaque démarrage.

## Comptes

Chaque personne a son compte (identifiant et mot de passe, sans e-mail) avec son propre profil, son CV, ses recherches et son classement des offres. Rien d'un compte n'est visible depuis un autre.

On reste connecté tant qu'on utilise l'app : la session dure 400 jours et se prolonge à chaque visite. Seul le bouton « Déconnexion » la ferme.

Sans e-mail, il n'y a pas de « mot de passe oublié ». Celui qui héberge l'app peut redéfinir un mot de passe (et renommer le compte au passage) :

```bash
docker exec -it emploi-backend node dist/auth/set-password.js <compte> [nouveau-nom]
```

C'est aussi comme ça qu'on récupère le compte de la version sans comptes : il s'appelle `personal-user` et garde tout ce qui avait été fait. Par exemple, `docker exec -it emploi-backend node dist/auth/set-password.js personal-user chris`.

## S'en servir

1. Onglet Profil. Dépose ton CV en PDF : l'app propose les métiers, compétences, villes et le niveau qu'elle y trouve, tu ajoutes ce qui est juste. Complète ensuite les critères (contrat, salaire minimum, télétravail, mots et entreprises à exclure). Tout est facultatif, un critère vide est simplement ignoré.
2. Onglet Offres, bouton « Rechercher », puis « Lancer pour mon profil ». L'app lance une recherche par métier visé et par lieu. La progression de chaque site s'affiche en direct, et les offres arrivent dans le flux au fil de l'eau. Le même menu permet une recherche libre.
3. Tu tries. Au clavier : `J` et `K` pour passer d'une offre à l'autre, `F` favori, `I` intéressé, `X` écarter, `O` pour ouvrir l'offre sur le site. Chaque action peut être annulée depuis la notification.

La barre au-dessus de la liste filtre les offres : texte (touche `/`), source, contrat, télétravail, score minimum et date de publication. Les filtres s'inscrivent dans l'adresse de la page, donc un rechargement ou un lien partagé les conserve.

Une offre sort des « Nouvelles » dès que tu l'as classée, ou dès qu'elle est restée affichée plus d'une seconde et demie. Elle n'est pas perdue pour autant, on la retrouve dans l'onglet « Vues ».

Une nouvelle recherche ne ramène que des offres absentes de la base. Elle parcourt les pages de résultats jusqu'à trouver 25 offres inédites par site, et reconnaît une même offre publiée sur deux sites. Relancer régulièrement la même recherche (onglet Recherches) permet donc de suivre ce qui sort.

## Mise en ligne

L'accès depuis Internet passe par un tunnel Cloudflare rapide (TryCloudflare) : gratuit, sans compte, et aucun port à ouvrir sur la box, puisque c'est la machine qui appelle Cloudflare. Ce qu'il faut savoir :

- l'adresse est aléatoire et change à chaque démarrage : il faut la retransmettre ;
- Cloudflare le réserve aux tests : pas de garantie de disponibilité, et 200 requêtes simultanées au maximum (large pour quelques personnes) ;
- sans le code d'inscription, personne ne peut créer de compte. Pour le changer, modifie `SIGNUP_CODE` dans `backend/.env` puis `./restart.sh`.

Pour une adresse fixe, il faut un compte Cloudflare gratuit et un nom de domaine géré par Cloudflare (quelques euros par an). On crée alors un tunnel nommé dans le tableau de bord (Zero Trust, Networks, Tunnels), qui donne un jeton, et on remplace la commande du service `tunnel` de `docker-compose.yml` par `tunnel --no-autoupdate run --token <jeton>`.

Pour déménager une installation existante, il faut emporter la base (volume Docker `emploi-search_backend_data`) et `backend/.env` : sans la même `DATA_KEY`, les CV ne sont plus lisibles. Un serveur loué (VPS) fonctionne, avec une réserve : Indeed et LinkedIn bloquent plus volontiers les adresses de centres de données. Une machine à la maison reste le meilleur choix pour la collecte.

## Sécurité

- Toutes les données passent par un compte : sans session valide, l'API ne renvoie rien (401), et chaque requête ne touche qu'aux données du compte connecté. Une offre hors de son propre flux répond 404, même si on devine son identifiant.
- Mots de passe hachés avec scrypt. Sessions : jeton aléatoire dans un cookie inaccessible au JavaScript (`httpOnly`, `SameSite=Lax`, `Secure` en HTTPS) ; la base n'en garde que l'empreinte.
- Les requêtes qui modifient des données doivent venir de la page de l'app elle-même (protection CSRF). Pas de CORS : aucun autre site ne peut lire l'API.
- 20 tentatives de connexion par quart d'heure et par adresse.
- Les CV (PDF et texte) sont chiffrés dans la base (AES-256-GCM, clé `DATA_KEY` de `backend/.env`). Ça protège une copie de la base ou une sauvegarde, pas un serveur entièrement compromis. Le reste du profil (métiers, compétences, lieux) n'est pas chiffré.
- Les réponses de l'API ne sont jamais mises en cache, ni par le navigateur ni par Cloudflare. Les cookies n'apparaissent pas dans les logs.
- L'API n'écoute que sur le réseau interne de Docker : on n'y accède que par nginx.

## Ce qu'il faut savoir

Indeed, sans compte, ne montre que la première page de résultats (15 à 16 offres). L'app trie par date pour que ce soient les plus récentes. Indeed est aussi protégé par Cloudflare : on passe par un vrai Chrome, ce que leurs conditions d'utilisation interdisent. Pour un usage perso à faible volume, le risque réaliste est un blocage temporaire de l'adresse IP. Ce ne serait plus le cas si l'outil devenait public.

Les sites changent leur HTML de temps en temps. Les scrapers lisent en priorité les données structurées (JSON-LD) que les sites publient pour Google, qui bougent beaucoup moins que la mise en page, mais une casse reste possible. Dans ce cas, l'onglet Recherches affiche le site en erreur, et `logs/app.log` dit pourquoi.

Le score est expliqué dans [docs/matching.md](docs/matching.md), avec ses limites.

## Développer

Le projet utilise pnpm (pas npm) et Node 22 ou plus.

```bash
cd backend
pnpm install
cp .env.example .env           # puis mettre une clé : DATA_KEY=$(openssl rand -base64 32)
pnpm exec prisma migrate dev   # crée la base SQLite locale
pnpm dev                       # API sur http://localhost:4000

cd ../frontend
pnpm install
pnpm dev                       # interface sur http://localhost:3000, /api est redirigé vers le backend
```

Hors Docker, la recherche Indeed ne marche pas : elle a besoin de l'écran virtuel du conteneur. HelloWork et LinkedIn fonctionnent normalement. Au premier démarrage, le modèle de classement (environ 120 Mo) est téléchargé dans `backend/.models`.

Avant de pousser :

```bash
cd backend && pnpm test && pnpm typecheck && pnpm format
cd frontend && pnpm typecheck && pnpm format
```

Après une modification de `backend/prisma/schema.prisma`, crée une migration avec `pnpm exec prisma migrate dev --name ce-qui-change`. Le conteneur l'applique tout seul au démarrage.

## Stack et ports

- Frontend : React 18, TypeScript, Vite, Tailwind, Framer Motion. Servi par nginx sur le port 80, qui redirige `/api` vers le backend.
- Backend : Node, Express, TypeScript, Prisma sur SQLite, logs avec pino. Port 4000.
- Collecte : axios et cheerio pour HelloWork et LinkedIn, Playwright et Chrome sur écran virtuel (Xvfb) pour Indeed.
- Classement : modèle d'embeddings multilingual-e5-small exécuté localement (transformers.js), aucune donnée ne sort de la machine.

L'organisation du code est décrite dans [ARCHITECTURE.md](ARCHITECTURE.md).

## Mise à jour depuis la toute première version

L'ancienne version créait la base avec `prisma db push`. La nouvelle utilise des migrations, et Prisma refuse de migrer une base qu'il n'a pas créée. Si le démarrage échoue avec l'erreur P3005, supprime l'ancienne base (elle ne contenait rien d'utilisable, puisque l'app ne démarrait pas) :

```bash
./stop.sh
docker volume rm emploi-search_backend_data
./start.sh
```
