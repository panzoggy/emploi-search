# À faire

## Prochaines étapes

- Lieu : calculer une vraie distance (géocodage via api-adresse.data.gouv.fr) plutôt que ville ou département. Miribel à 20 km de Lyon est aujourd'hui « hors zone ».
- Recherches planifiées : relancer automatiquement les recherches du profil chaque matin et afficher le nombre d'offres arrivées depuis la dernière visite.
- Suivi des candidatures pour les offres « intéressé » : date d'envoi, relance, entretien.
- Tests d'intégration des scrapers sur des pages HTML enregistrées, pour détecter une casse sans dépendre des sites en direct.

- Récupérer le compte d'avant les comptes : `set-password.js personal-user <nom>` (voir README).
- Choisir entre adresse TryCloudflare changeante et tunnel nommé (compte gratuit et domaine).
- Disque des projets de la tour plein (/mnt/projects à 100 %, 3 Go libres) : à surveiller, hors de l'app.

## Plus tard

- France Travail : son API officielle est gratuite (inscription nécessaire) et ajouterait une source fiable, sans scraping.
- Indeed au-delà de la première page, si l'on accepte de se connecter avec un compte.
- Alertes (mail ou notification) quand une offre à plus de 80 arrive.
- Export des offres gardées en CSV.
- Changement de mot de passe et suppression de compte depuis l'interface.
