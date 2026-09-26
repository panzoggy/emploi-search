# Arborescence

Fichiers suivis par git (hors lockfiles), avec leur rôle quand il n’est pas évident.

```
.gitignore  # Fichiers ignorés
.prettierrc  # Format commun back et front
ARBORESCENCE.md
ARCHITECTURE.md  # Domaines, règles entre modules, données
README.md  # Présentation, lancement, utilisation, développement
STATE.md  # État du projet et décisions
TODO.md  # Prochaines étapes
backend/.dockerignore
backend/.env.example  # Variables d’environnement
backend/Dockerfile  # Image Playwright : Chrome, Xvfb, modèle intégré
backend/package.json
backend/pnpm-workspace.yaml  # Paquets autorisés à exécuter un script d’installation
backend/prisma/migrations/20260926143749_init/migration.sql  # Création initiale des tables
backend/prisma/migrations/20260926155848_accounts_and_cv_file/migration.sql
backend/prisma/migrations/migration_lock.toml
backend/prisma/schema.prisma  # Schéma de la base SQLite
backend/src/app.ts  # Assemblage Express
backend/src/auth/auth.routes.ts
backend/src/auth/index.ts  # Interface publique du domaine authentification
backend/src/auth/password.test.ts  # Tests
backend/src/auth/password.ts  # scrypt est intégré à Node : pas de dépendance native à compiler (contrairement à argon2)
backend/src/auth/require-auth.ts
backend/src/auth/session-cookie.ts
backend/src/auth/sessions.ts
backend/src/auth/set-password.ts  # Commande d'administration : définit le mot de passe d'un compte, éventuellement en le renommant.
backend/src/collection/browser.ts  # Navigateur réel pour les sites protégés par Cloudflare (Indeed).
backend/src/collection/collector.ts
backend/src/collection/http.ts
backend/src/collection/json-ld.ts  # Les trois sites publient l'offre au format schema.org/JobPosting pour Google Jobs :
backend/src/collection/offer-attributes.ts  # Chaque site écrit le type de contrat à sa façon : on ramène tout à une liste courte
backend/src/collection/offer-details.ts
backend/src/collection/parsing.test.ts  # Tests
backend/src/collection/salary.ts  # Tout est ramené en brut annuel pour pouvoir comparer
backend/src/collection/search-runner.ts
backend/src/collection/searches.routes.ts
backend/src/collection/sources/hellowork.ts
backend/src/collection/sources/indeed.ts  # Indeed est derrière Cloudflare : une requête HTTP simple reçoit un 403.
backend/src/collection/sources/linkedin.ts  # API "invité" de LinkedIn : celle qui alimente la page publique des offres, sans compte
backend/src/collection/types.ts
backend/src/index.ts  # Démarrage de l’API
backend/src/matching/embeddings.ts  # multilingual-e5-small (quantifié, ~118 Mo) : retenu après comparaison sur des intitulés français,
backend/src/matching/index.ts  # Interface publique du domaine matching
backend/src/matching/locations.ts
backend/src/matching/matching.service.ts
backend/src/matching/scoring.test.ts  # Tests
backend/src/matching/scoring.ts  # Score d'une offre face au profil : une somme pondérée de critères, chacun expliqué à l'utilisateur.
backend/src/matching/vectors.ts  # Stockage des vecteurs en BLOB SQLite et opérations de base (vecteurs déjà normalisés)
backend/src/offers/feed-filters.test.ts  # Tests
backend/src/offers/feed-filters.ts
backend/src/offers/offers.routes.ts
backend/src/offers/offers.service.ts
backend/src/profile/cv-analysis.test.ts  # Tests
backend/src/profile/cv-analysis.ts
backend/src/profile/index.ts  # Interface publique du domaine profil
backend/src/profile/profile-store.ts
backend/src/profile/profile.routes.ts
backend/src/profile/skills-dictionary.ts  # Compétences reconnues dans un CV : [libellé affiché, ...variantes d'écriture].
backend/src/shared/client-ip.ts  # Derrière Cloudflare, tous les visiteurs arrivent par le tunnel : la vraie adresse est dans CF-Connecting-IP
backend/src/shared/db.ts
backend/src/shared/errors.ts
backend/src/shared/french-places.ts  # Principales villes françaises et leur département : sert à reconnaître "Villeurbanne (69)"
backend/src/shared/json-list.ts  # Listes stockées en JSON dans des colonnes texte (SQLite n'a pas de tableaux)
backend/src/shared/logger.ts
backend/src/shared/request-guards.test.ts  # Tests
backend/src/shared/request-guards.ts
backend/src/shared/sealed-data.test.ts  # Tests
backend/src/shared/sealed-data.ts  # Chiffrement au repos des données sensibles (le CV). Clé serveur DATA_KEY (32 octets en base64),
backend/src/shared/text.test.ts  # Tests
backend/src/shared/text.ts  # Normalisation commune à la déduplication, au matching et à l'extraction du CV
backend/tsconfig.json
docker-compose.yml  # Backend (réseau interne seulement), frontend nginx (80), tunnel Cloudflare
docs/matching.md  # Calcul du score, choix du modèle, limites
frontend/.dockerignore
frontend/Dockerfile  # Build Vite puis nginx
frontend/index.html  # Page hôte, thème appliqué avant le rendu
frontend/nginx.conf  # Sert le front, proxy /api, envoi de CV jusqu’à 6 Mo
frontend/package.json
frontend/pnpm-workspace.yaml  # Paquets autorisés à exécuter un script d’installation
frontend/postcss.config.js
frontend/src/app/App.tsx
frontend/src/app/TopBar.tsx
frontend/src/auth/AuthProvider.tsx
frontend/src/auth/LoginPage.tsx
frontend/src/auth/auth-api.ts
frontend/src/auth/index.ts  # Interface publique du domaine authentification
frontend/src/auth/useAuthForm.ts
frontend/src/index.css  # Jetons de couleur des thèmes sombre et clair
frontend/src/main.tsx
frontend/src/offers/FeedColumn.tsx  # Colonne de gauche : ligne de total, bandeau des arrivées, liste
frontend/src/offers/FeedPage.tsx
frontend/src/offers/FeedTabs.tsx
frontend/src/offers/FilterBar.tsx
frontend/src/offers/FilterMenu.tsx
frontend/src/offers/MatchReasons.tsx  # Une marque typographique par verdict, comme dans un registre. Vert et rouge gardent leur sens.
frontend/src/offers/OfferDetailPanel.tsx
frontend/src/offers/OfferList.tsx
frontend/src/offers/OfferListItem.tsx
frontend/src/offers/OfferMeta.tsx
frontend/src/offers/TriageActions.tsx
frontend/src/offers/feed-query.ts
frontend/src/offers/feed-reducer.ts
frontend/src/offers/index.ts  # Interface publique du domaine offres
frontend/src/offers/offers-api.ts
frontend/src/offers/types.ts
frontend/src/offers/useFeed.ts
frontend/src/offers/useFeedController.ts
frontend/src/offers/useFeedCounts.ts
frontend/src/offers/useFeedKeyboard.ts
frontend/src/offers/useFeedQuery.ts
frontend/src/offers/useOfferDetail.ts  # Le détail contient le score et le statut de l'utilisateur : le cache est vidé à chaque changement de compte
frontend/src/offers/useSeenOnDwell.ts  # Une offre compte comme "vue" quand elle reste affichée un instant, pas quand on la survole en passant
frontend/src/offers/useSelection.ts  # Offre affichée dans le détail. Sur grand écran il y en a toujours une ; sur mobile, seulement au toucher.
frontend/src/offers/useTriage.tsx
frontend/src/profile/ChipInput.tsx
frontend/src/profile/CvDropzone.tsx
frontend/src/profile/CvPreview.tsx  # Aperçu du CV enregistré. Le paramètre v force le rechargement après un nouvel import.
frontend/src/profile/CvSuggestionsPanel.tsx
frontend/src/profile/ProfileFields.tsx
frontend/src/profile/ProfilePage.tsx
frontend/src/profile/ProfileRow.tsx  # Une ligne de réglage : intitulé et explication à gauche, contrôle à droite
frontend/src/profile/index.ts  # Interface publique du domaine profil
frontend/src/profile/pdf-render.ts  # Rendu d'un PDF page par page dans des canvas, via pdf.js (chargé seulement à l'ouverture de l'aperçu).
frontend/src/profile/profile-api.ts
frontend/src/profile/types.ts
frontend/src/profile/useCv.ts
frontend/src/profile/usePdfPreview.ts  # Télécharge le CV (avec la session de l'utilisateur) et le dessine dans le conteneur
frontend/src/profile/useProfile.ts
frontend/src/profile/useProfileReady.ts  # Le flux a besoin de savoir si un profil minimal existe, pour guider l'utilisateur
frontend/src/searches/ActiveSearches.tsx  # Bandeau discret des recherches en cours, visible depuis le flux
frontend/src/searches/SearchActivity.tsx
frontend/src/searches/SearchLauncher.tsx
frontend/src/searches/SearchesPage.tsx
frontend/src/searches/SourceStatus.tsx
frontend/src/searches/index.ts  # Interface publique du domaine recherches
frontend/src/searches/searches-api.ts
frontend/src/searches/types.ts
frontend/src/searches/useActiveSearches.ts
frontend/src/searches/useSearchHistory.ts
frontend/src/shared/api/client.ts
frontend/src/shared/lib/cn.ts
frontend/src/shared/lib/format.ts
frontend/src/shared/lib/useInterval.ts
frontend/src/shared/lib/useMediaQuery.ts
frontend/src/shared/lib/useStableValue.ts  # Garde la même référence tant que le contenu ne change pas (objets reconstruits à chaque rendu)
frontend/src/shared/theme/useTheme.ts
frontend/src/shared/ui/Button.tsx
frontend/src/shared/ui/EmptyState.tsx
frontend/src/shared/ui/Kbd.tsx  # Inutile au toucher : masqué sur petit écran
frontend/src/shared/ui/Popover.tsx
frontend/src/shared/ui/ScoreMeter.tsx  # Le score se lit comme une donnée : un nombre (et une jauge dans le détail), sans couleur décorative.
frontend/src/shared/ui/Segmented.tsx
frontend/src/shared/ui/Skeleton.tsx
frontend/src/shared/ui/Tag.tsx
frontend/src/shared/ui/TextField.tsx
frontend/src/vite-env.d.ts  # / <reference types="vite/client" />
frontend/tailwind.config.js  # Couleurs Tailwind reliées aux jetons
frontend/tsconfig.json
frontend/tsconfig.node.json
frontend/vite.config.ts
package.json  # Scripts de confort à la racine (pnpm -C)
restart.sh  # Arrêt puis démarrage (mêmes options que start.sh)
scripts/lib.sh  # Fonctions communes aux scripts : accès Docker (sudo si besoin), .env, adresses
setup.sh  # Prépare une machine vierge : Docker, backend/.env et secrets, images. Relançable sans risque
start.sh  # Lance (setup automatique si besoin) et affiche les adresses locale et Internet
stop.sh  # Arrête l’app et le tunnel
```
