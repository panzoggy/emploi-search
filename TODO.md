# TODO — EmploiSearch
*Dernière mise à jour : 26/09/2026*

## En cours

- [ ] Pull request `dev` → `main` et message à l'auteur du dépôt (passage à pnpm, refonte complète)

## À faire (priorité)

- [ ] Récupérer le compte d'avant les comptes : `set-password.js personal-user <nom>` (voir README)
- [ ] Pénalité d'ancienneté dans le score : des offres de 6-7 mois remontent en tête (en attente de validation)
- [ ] Lieu : distance réelle (géocodage via api-adresse.data.gouv.fr) plutôt que ville ou département. Miribel, à 20 km de Lyon, est aujourd'hui « hors zone »
- [ ] Choisir entre adresse TryCloudflare changeante et tunnel nommé (compte gratuit et domaine)
- [ ] Tests d'intégration des scrapers sur des pages HTML enregistrées, pour détecter une casse sans dépendre des sites en direct
- [ ] Tour : libérer de la place sur /mnt/projects (100 %, 3 Go libres) et installer docker-buildx (hors de l'app)

## Backlog

- [ ] Recherches planifiées : relancer les recherches du profil chaque matin, afficher les offres arrivées depuis la dernière visite
- [ ] Suivi des candidatures pour les offres « intéressé » : date d'envoi, relance, entretien
- [ ] Changement de mot de passe et suppression de compte depuis l'interface
- [ ] France Travail : API officielle gratuite (inscription nécessaire), une source fiable sans scraping
- [ ] Indeed au-delà de la première page, si l'on accepte de se connecter avec un compte
- [ ] Alertes (mail ou notification) quand une offre à plus de 80 arrive
- [ ] Export des offres gardées en CSV

## Terminé

- [x] Démarrage réparé (lockfiles, compilation, base), passage à pnpm et Node 22
- [x] HelloWork et Indeed fonctionnels (JSON-LD, Chrome sur Xvfb contre Cloudflare)
- [x] Pagination jusqu'à 25 offres inédites par site, doublons entre sites
- [x] Matching de profil expliqué, embeddings locaux, apprentissage des retours, analyse du CV
- [x] Bug de pagination du flux (store qui remettait page 1)
- [x] Interface « registre », filtres dans l'URL, défilement parasite des onglets corrigé
- [x] Comptes, isolation par compte, CV chiffré, aperçu du CV, audit de sécurité
- [x] setup.sh pour machine vierge, mise en ligne par TryCloudflare, adresses affichées au démarrage
- [x] Documentation réécrite (README, ARCHITECTURE, docs/matching.md)
- [x] Commit et push sur la branche `dev`
