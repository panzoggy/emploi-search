# Comment le score est calculé

Chaque offre reçoit une note sur 100, recalculée dès que le profil change ou qu'une offre est mise en favori, marquée intéressante ou écartée. Le code est dans `backend/src/matching/`, et la fonction de score (`scoring.ts`) ne fait aucun accès réseau ni disque : elle se teste avec des données inventées.

## Les critères

| Critère | Poids | Ce qui est comparé |
|---|---|---|
| Métier | 35 | L'intitulé de l'offre face à chaque métier visé. On garde le meilleur. |
| Parcours | 15 | Le texte complet de l'offre face au profil (métiers, compétences, début du CV). |
| Compétences | 15 | Les compétences du profil citées dans l'offre. Trois ou quatre citées suffisent pour le maximum. |
| Niveau | 10 | Junior, confirmé, senior ou lead, déduit de l'intitulé ou des années d'expérience demandées. |
| Lieu | 10 | Même ville, même département (69 pour Villeurbanne quand on cherche Lyon), ou télétravail complet. |
| Contrat | 10 | CDI, CDD, intérim, freelance, stage, alternance. |
| Salaire | 5 | Le haut de la fourchette face au minimum demandé, tout ramené en brut annuel. |

Un critère que le profil ne renseigne pas est retiré du calcul. Une information que l'offre ne donne pas (salaire non publié, par exemple) compte comme neutre et s'affiche avec un point d'interrogation, plutôt que de pénaliser ou de favoriser l'offre sans raison.

Les mots et entreprises exclus mettent l'offre à zéro et la sortent des nouvelles.

## Métier et parcours : les embeddings

Comparer des mots ne suffit pas : « intégrateur React » et « développeur front » ne partagent aucun mot, et « chef de projet BTP » en partage deux avec « chef de projet marketing ». Chaque intitulé et chaque texte est donc transformé en vecteur par un petit modèle multilingue, multilingual-e5-small, qui tourne sur la machine. Deux textes proches par le sens donnent des vecteurs proches.

Le choix du modèle vient d'un test sur des intitulés français répartis en cinq métiers, avec des pièges volontaires (data analyst contre data engineer, infirmière contre aide-soignante). Le score AUC, qui mesure à quelle fréquence le modèle classe une bonne offre devant une mauvaise, a donné :

| Modèle | AUC | Taille |
|---|---|---|
| multilingual-e5-small | 0,913 | 118 Mo |
| multilingual-e5-base | 0,847 | 280 Mo |
| paraphrase-multilingual-mpnet-base-v2 | 0,887 | 280 Mo |
| bge-m3 | 0,887 | 570 Mo |
| bge-reranker-v2-m3 (reranker) | 0,913 | 570 Mo |

Le plus petit fait aussi bien que le plus gros, donc on garde le petit. Pour ces intitulés-là, il se trompe d'ordre environ une fois sur dix, d'où l'intérêt des autres critères pour rattraper les erreurs.

Les similarités de ce modèle sont tassées : deux métiers sans rapport tournent autour de 0,83, deux métiers proches autour de 0,87. Elles sont donc étalées sur 0 à 1 entre deux bornes mesurées sur de vraies offres (un profil développeur React face à 53 offres de développement et 63 de comptabilité). Pour l'intitulé, 0,835 vaut 0 et 0,895 vaut 1. Pour le texte, 0,83 et 0,885. Avec ces bornes, les offres de comptabilité ont obtenu entre 17 et 50 et celles de développement entre 45 et 92. Les bornes sont dans `scoring.ts` (`CALIBRATION`) si un autre type de profil montre qu'il faut les ajuster.

## Ce que le classement apprend de tes choix

Une fois deux offres gardées (favori ou intéressé) et deux offres écartées, l'app calcule le vecteur moyen de chaque groupe. Une offre proche des offres gardées gagne jusqu'à 12 points, une offre proche des offres écartées en perd autant. L'effet grandit avec le nombre de retours et atteint son maximum vers huit offres par groupe. Quand il pèse assez, il apparaît dans le détail du score (« Ressemble aux offres que tu as gardées »).

## Limites connues

- Le lieu se juge par ville et par département. Une offre à Miribel (Ain, 01), à 20 km de Lyon, est considérée hors zone. Un vrai calcul de distance réglerait ça.
- Le niveau d'expérience n'est connu que si l'offre le dit. Sinon il reste neutre.
- Les compétences sont reconnues par correspondance exacte (après normalisation des accents et de la casse). « JS » et « JavaScript » sont rapprochés par le dictionnaire du CV, pas par le score.
- La calibration a été faite sur un profil tech. Elle tient probablement pour d'autres métiers, sans garantie.
