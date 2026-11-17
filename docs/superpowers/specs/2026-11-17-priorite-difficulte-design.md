# Priorité et difficulté des tickets — conception

Statut : validée le 2026-11-17 (option A du tri).

## Pourquoi

Le tableau dit ce qui reste à faire, pas dans quel ordre ni ce que ça coûte. Pour choisir le prochain travail, chaque ticket porte une priorité et une difficulté, visibles sur la carte, et le tableau peut ranger les cartes par priorité.

## Ce qui change

- **Deux champs facultatifs** sur `tickets` :
  - `priority` : `high`, `medium` ou `low` (« Haute », « Moyenne », « Basse ») ;
  - `difficulty` : `easy`, `medium` ou `hard` (« Facile », « Moyenne », « Difficile »).

  La difficulté remplace une estimation en temps : trois niveaux suffisent pour choisir. Un ticket sans valeur n'affiche rien. Un changement de l'un des deux champs s'inscrit dans l'historique comme « modifié ».
- **Carte** : une pastille de priorité colorée (tokens `priority.*` du thème) et la difficulté en texte discret, dans la ligne du bas.
- **Volet du ticket** : deux sélecteurs à trois choix, comme celui de la colonne. Mêmes sélecteurs dans « Nouveau ticket », facultatifs.
- **Tri (option A)** : un bouton « Trier : manuel / priorité » dans la barre d'outils, mémorisé dans le navigateur.
  - En mode priorité, chaque colonne range : Haute, Moyenne, Basse, puis sans priorité. À priorité égale : Facile, Moyenne, Difficile, puis sans difficulté. À égalité : ordre manuel.
  - En mode priorité, glisser une carte vers une autre colonne la déplace (en haut de cette colonne, dans l'ordre manuel). La glisser à l'intérieur de sa colonne ne change rien.
  - Le mode manuel garde le comportement actuel.
- **Conventions** : les modèles SQL (`README.md`, `CLAUDE.md`, et le `CLAUDE.md` de notia) renseignent `priority` et `difficulty` à la création. Claude remplit les tickets ouverts de notia une fois la migration appliquée.

## Approches écartées

- Tri par priorité permanent : le glisser-déposer à l'intérieur d'une colonne ne servirait plus à rien.
- Filtre par priorité sans tri : ne range pas les colonnes.
- Deux lignes dans la description : ni tri, ni pastille.

## Hors sujet

Filtre par priorité ou difficulté ; estimation en heures ; tri par date.
