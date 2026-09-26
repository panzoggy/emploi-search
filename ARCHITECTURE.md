# Architecture

Deux applications : une API (backend) et une interface (frontend). Dans les deux, le code est rangé par domaine métier et non par couche technique. Ajouter une fonctionnalité doit se faire dans un dossier, sans avoir à parcourir cinq couches.

## Backend (`backend/src`)

| Dossier | Rôle |
|---|---|
| `collection/` | Aller chercher les offres sur les sites. Une recherche parcourt les pages de chaque site jusqu'à trouver 25 offres absentes de la base, récupère le détail de chacune et les enregistre. Les recherches passent une par une dans une file d'attente. |
| `collection/sources/` | Un fichier par site (HelloWork, Indeed, LinkedIn). Chacun sait lire une page de résultats et une page d'offre, rien de plus. |
| `auth/` | Comptes, connexion, sessions (cookie), et `requireAuth`, le garde posé devant toutes les routes de données. |
| `offers/` | Le flux d'offres vu par l'utilisateur : listes par onglet (nouvelles, favoris, intéressé, vues, écartées), compteurs, changement de statut. |
| `profile/` | La fiche de l'utilisateur et l'analyse du CV (texte du PDF, métiers, compétences, années d'expérience). |
| `matching/` | Le score de chaque offre face au profil : embeddings, critères pondérés, apprentissage à partir des favoris et des rejets. Détails dans `docs/matching.md`. |
| `shared/` | Ce qui sert réellement à plusieurs domaines : client Prisma, logger, gestion d'erreurs, protections des requêtes (origine, cache), chiffrement au repos, normalisation de texte, table des villes françaises. Rien de métier. |

`app.ts` assemble l'API, `index.ts` la démarre.

Règles entre domaines :

- Un domaine en utilise un autre par son `index.ts` (son interface publique), jamais en important ses fichiers internes. Par exemple `collection` appelle `matching` pour noter les offres qu'il vient d'enregistrer, et `matching` lit le profil via `profile/index.ts`.
- Exception assumée : la base SQLite est commune. `matching` lit directement les offres et leurs statuts pour calculer les scores, parce que faire transiter des milliers de vecteurs par une interface n'apporterait rien.
- Les routes Express (`*.routes.ts`) sont les points d'entrée HTTP de chaque domaine, montées dans `app.ts`.

Vocabulaire des fichiers, pour que les noms gardent un sens précis :

- `*.routes.ts` : validation des requêtes (zod) et appel du service, aucune logique métier.
- `*.service.ts` : la logique métier d'un domaine, qui parle à la base.
- `*-store.ts` : lecture et écriture d'une table, avec conversion des champs JSON.
- les autres fichiers sont des fonctions pures nommées d'après ce qu'elles font (`scoring.ts`, `salary.ts`, `cv-analysis.ts`…).

## Frontend (`frontend/src`)

| Dossier | Rôle |
|---|---|
| `auth/` | Page de connexion et d'inscription, état de connexion partagé (`AuthProvider`). |
| `offers/` | Le flux : liste, détail, tri au clavier, onglets, compteurs. `useFeedController` orchestre, les composants affichent. |
| `searches/` | Lancer une recherche, suivre sa progression en direct (fournisseur `SearchActivity` partagé par toutes les pages), historique. |
| `profile/` | La page profil : dépôt du CV, suggestions, critères, barre d'enregistrement. |
| `app/` | La coquille : barre du haut et routes. |
| `shared/` | Client API, petites fonctions (dates, salaires, classes CSS), thème clair/sombre et composants d'interface génériques (`shared/ui`). |

Mêmes règles : chaque domaine expose son `index.ts` et les autres passent par lui. La logique vit dans des hooks (`use*.ts`), les composants se contentent d'afficher.

Le design suit un style « registre », inspiré du graphisme suisse : filets fins, aucun arrondi, grotesque (Archivo) pour le texte et chiffres en chasse fixe (IBM Plex Mono), étiquettes en petites capitales. Les jetons de couleur sont dans `index.css` (sombre « encre » par défaut, clair « papier » en option) et repris dans `tailwind.config.js`, qui supprime aussi les arrondis pour tout le projet. Un seul accent, vermillon, réservé à l'action principale et à la ligne sélectionnée. `success` et `danger` ne servent qu'aux verdicts du score. Un état sélectionné s'inverse (fond encre) plutôt que de se colorer.

## Données

Schéma dans `backend/prisma/schema.prisma`, migrations dans `backend/prisma/migrations`.

- `Offer` : une offre, avec sa description complète et deux vecteurs (intitulé, texte). Unique par site et identifiant, et repérable d'un site à l'autre par son empreinte (intitulé et entreprise normalisés).
- `OfferStatus` : ce que l'utilisateur a fait de l'offre. Pas de ligne signifie « nouvelle ».
- `OfferMatch` : le score et ses explications, recalculés quand le profil ou les retours changent.
- `Search` : une recherche et sa progression site par site.
- `Profile` : la fiche, le texte et le PDF du CV (chiffrés).
- `User`, `Session` : les comptes et leurs sessions.

Les offres sont communes à tous les comptes : une offre trouvée par deux personnes n'est stockée qu'une fois. Ce qui est personnel (scores, statuts, recherches, profil) est rattaché à un compte, et un utilisateur ne voit que les offres que ses propres recherches ont trouvées. Si sa recherche tombe sur une offre déjà en base, elle est ajoutée à son flux sans être retéléchargée.
