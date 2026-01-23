# 📚 Guide d'utilisation - Club de Lecture

**Application de gestion de club de lecture avec synchronisation Google Sheets**

---

## Table des matières

1. [Présentation](#présentation)
2. [Interface principale](#interface-principale)
3. [Sélectionner votre profil](#sélectionner-votre-profil)
4. [Parcourir les livres](#parcourir-les-livres)
5. [Proposer un livre](#proposer-un-livre)
6. [Modifier une proposition de livre](#modifier-une-proposition-de-livre)
7. [Supprimer un livre](#supprimer-un-livre)
8. [Consulter les détails d'un livre](#consulter-les-détails-dun-livre)
9. [Ajouter un avis](#ajouter-un-avis)
10. [Filtres et recherche](#filtres-et-recherche)
11. [Administration](#administration)
12. [Synchronisation](#synchronisation)

---

## Présentation

L'application **Club de Lecture** permet aux membres d'un club de :
- Proposer des livres à lire
- Consulter les propositions des autres membres
- Donner son avis et noter les livres
- Filtrer et rechercher dans la bibliothèque

Les données sont synchronisées automatiquement avec Google Sheets.

---

## Interface principale

### En-tête
```
┌─────────────────────────────────────────────────────────────────┐
│ 📚 et tes pensées...     [42 livres]  🔄  📄/🔲  ⚙️ ADMIN      │
└─────────────────────────────────────────────────────────────────┘
```

| Élément | Description |
|---------|-------------|
| **Compteur** | Nombre total de livres dans la bibliothèque |
| **🔄** | Actualiser depuis Google Sheets |
| **📄/🔲** | Basculer entre vue Liste et vue Grille |
| **⚙️ ADMIN** | Accéder au panneau d'administration |

### Barre latérale (gauche)
- **Membre Actif** : Sélectionner votre profil
- **Filtres** : Genre, Présentateur, Année
- **Tri** : Récents ou A-Z
- **Bouton** : "+ Proposer un livre"

### Zone principale (droite)
- Affichage des livres en grille ou en liste

---

## Sélectionner votre profil

**Important** : Sélectionnez votre nom avant toute action.

1. Dans la barre latérale, trouvez la section **"Membre Actif"** (fond noir)
2. Cliquez sur le menu déroulant
3. Sélectionnez votre nom

```
┌──────────────────────────┐
│ MEMBRE ACTIF             │
│ ┌──────────────────────┐ │
│ │ Marie-Andrée       ▼ │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

> ⚠️ **Votre profil détermine :**
> - L'attribution de vos propositions de livres
> - La possibilité de modifier VOS livres uniquement
> - L'attribution de vos avis

---

## Parcourir les livres

### Mode Grille (par défaut)
Les livres s'affichent en cartes avec :
- Image de couverture
- Genre
- Titre et auteur
- Note moyenne (⭐)
- Présentateur
- Évaluation personnelle (★★★★☆)

**Cliquez sur la flèche (▼)** pour déplier et voir :
- Résumé
- Recommandations
- Aperçu des avis

### Mode Liste
Vue compacte avec colonnes :
- Couverture miniature
- Titre / Auteur
- Genre
- Proposé par
- Note personnelle
- Note moyenne

**Cliquez sur une ligne** pour déplier les détails.

---

## Proposer un livre

1. Cliquez sur le bouton **"+ Proposer un livre"** (jaune, bas de la barre latérale)

2. Remplissez le formulaire :

```
┌─────────────────────────────────────────────────────────────┐
│                    PROPOSER UN LIVRE                         │
├─────────────────────────────────────────────────────────────┤
│ [Titre____________]  [Auteur_______________]                │
│                                                             │
│ 🖼️ COUVERTURE                          [🔍 Chercher]        │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│ │    │ │    │ │    │ │    │ │    │ │    │ ← Résultats      │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │
│                                                             │
│ Genre: [Roman_________▼]  Présenté par: [Votre nom___▼]    │
│                                                             │
│ ⭐ ÉVALUATION PERSONNELLE                                   │
│        ★  ★  ★  ★  ☆   (4/5 étoiles)                       │
│                                                             │
│ [Résumé du livre...                                    ]   │
│                                                             │
│            [ AJOUTER AU CLUB ]                              │
│                 Annuler                                      │
└─────────────────────────────────────────────────────────────┘
```

### Rechercher une couverture
1. Entrez le titre et/ou l'auteur
2. Cliquez sur **"🔍 Chercher"**
3. Sélectionnez une image parmi les 6 proposées
4. L'image apparaît en prévisualisation

### Donner une évaluation personnelle
- Cliquez sur les étoiles (1 à 5)
- Cette note représente VOTRE appréciation personnelle

3. Cliquez sur **"Ajouter au club"**

---

## Modifier une proposition de livre

> ⚠️ **Vous pouvez uniquement modifier les livres que VOUS avez proposés.**

### Méthode 1 : Depuis la grille
1. Survolez la carte du livre
2. Un **bouton crayon** (✏️) apparaît en haut à droite
3. Cliquez dessus

### Méthode 2 : Depuis la liste
1. Survolez la ligne du livre
2. Un **bouton crayon** (✏️) apparaît à droite
3. Cliquez dessus

### Méthode 3 : Depuis les détails
1. Cliquez sur un livre pour ouvrir ses détails
2. Si vous êtes le présentateur, le bouton **"✏️ Modifier"** apparaît

### Dans le formulaire de modification
- Modifiez les champs souhaités (titre, auteur, genre, etc.)
- Changez la couverture avec **"🔍 Chercher"**
- Ajustez votre évaluation personnelle
- Cliquez sur **"Mettre à jour"**

```
┌─────────────────────────────────────────────────────────────┐
│                    MODIFIER LE LIVRE                         │
├─────────────────────────────────────────────────────────────┤
│ [Titre actuel____]  [Auteur actuel_______]                  │
│ ...                                                         │
│            [ METTRE À JOUR ]                                │
│                 Annuler                                      │
│                                                             │
│     [ 🗑️ Supprimer ce livre ]  ← Bouton rouge              │
└─────────────────────────────────────────────────────────────┘
```

---

## Supprimer un livre

> ⚠️ **Action irréversible. Vous pouvez uniquement supprimer VOS livres.**

1. Ouvrez le formulaire de modification (voir section précédente)
2. Faites défiler jusqu'en bas
3. Cliquez sur le bouton rouge **"🗑️ Supprimer ce livre"**
4. Un modal de confirmation apparaît :

```
┌────────────────────────────────────┐
│              🗑️                    │
│                                    │
│     Supprimer ce livre ?           │
│                                    │
│    « Le titre du livre »           │
│                                    │
│  Cette action est irréversible.    │
│  Le livre sera supprimé            │
│  définitivement.                   │
│                                    │
│  [ Annuler ]  [ Supprimer ]        │
└────────────────────────────────────┘
```

5. Cliquez sur **"Supprimer"** pour confirmer

---

## Consulter les détails d'un livre

### Aperçu rapide (dépliable)
- **Grille** : Cliquez sur la flèche ▼ sur la carte
- **Liste** : Cliquez sur la ligne

Affiche : résumé, recommandations, aperçu des 3 premiers avis

### Vue détaillée complète
1. Cliquez sur **"Voir tous les détails"** (dans l'aperçu)
2. Ou cliquez sur le titre/image du livre

```
┌─────────────────────────────────────────────────────────────┐
│ [X]                                                         │
│ ┌─────────┐                                                 │
│ │         │  ROMAN                                          │
│ │ [Cover] │  Le titre du livre                              │
│ │         │  par Auteur                                     │
│ │         │  ⭐ 4.2 (moyenne)  |  Proposé par Marie-Andrée  │
│ └─────────┘                                                 │
│                                                             │
│ RÉSUMÉ                                                      │
│ Lorem ipsum dolor sit amet...                               │
│                                                             │
│ RECOMMANDATIONS                                             │
│ Si vous avez aimé ce livre...                               │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ AVIS DES MEMBRES (3)                    [+ Ajouter un avis] │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Paul • 15/01/2024                           ★★★★☆      │ │
│ │ Un excellent livre, je recommande...                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Ajouter un avis

1. Ouvrez les détails d'un livre
2. Cliquez sur **"+ Ajouter un avis"**
3. Remplissez le formulaire :
   - Votre nom s'affiche automatiquement
   - Sélectionnez une note (1-5 étoiles)
   - Écrivez votre avis
4. Cliquez sur **"Publier l'avis"**

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 Marie-Andrée              Note: [5 étoiles ▼]           │
│                                                             │
│ VOTRE AVIS                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ J'ai adoré ce livre ! L'auteur nous transporte...       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│              [ PUBLIER L'AVIS ]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Filtres et recherche

### Recherche
Tapez dans le champ de recherche pour filtrer par :
- Titre du livre
- Nom de l'auteur

### Filtre par genre
Sélectionnez un genre spécifique (Roman, Science-Fiction, etc.)
Le nombre de livres par genre est affiché.

### Filtre par présentateur
- **Tous les membres** : Voir tous les livres
- **📚 Mes propositions** : Voir uniquement VOS livres
- **[Nom d'un membre]** : Voir les livres d'un membre spécifique

### Filtre par année
Filtrer les livres selon l'année de proposition.

### Tri
- **🕒 Récents** : Les plus récents en premier
- **🔤 A-Z** : Ordre alphabétique par titre

### Réinitialiser les filtres
Si des filtres sont actifs, un bouton **"↻ Réinitialiser les filtres"** apparaît.

---

## Administration

### Accès
1. Cliquez sur **"⚙️ ADMINISTRATION"**
2. Entrez le mot de passe : `club-lecture-2024`
3. Cliquez sur **"Accéder"**

### Gérer les genres
- **Ajouter** : Tapez un genre et cliquez sur "+"
- **Supprimer** : Cliquez sur le "✕" à côté du genre

### Gérer les membres
- **Ajouter** : Tapez un nom et cliquez sur "+"
- **Supprimer** : Cliquez sur le "✕" à côté du nom

```
┌─────────────────────────────────────────────────────────────┐
│ Administration                                         [X]  │
│ ZONE SÉCURISÉE                                              │
├─────────────────────────────────────────────────────────────┤
│ GÉRER LES GENRES                                            │
│ [Roman] [Science-Fiction] [Biographie] [+Nouveau genre___]  │
│                                                             │
│ GÉRER LES MEMBRES                                           │
│ [Marie-Andrée ✕] [Paul ✕] [Jacques ✕] [+Nouveau membre__]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Synchronisation

### Synchronisation automatique
L'application sauvegarde automatiquement vers Google Sheets :
- Quand vous ajoutez un livre
- Quand vous modifiez un livre
- Quand vous supprimez un livre
- Quand vous ajoutez un avis

**Indicateurs dans l'en-tête :**
- ☁️ **Sauvegarde...** (jaune) : Synchronisation en cours
- ✅ **Sauvegardé** (vert) : Synchronisation réussie
- ⚠️ **Erreur Synchro** (rouge) : Problème de connexion

### Actualiser manuellement
Cliquez sur le bouton **🔄** dans l'en-tête pour :
- Récupérer les dernières données de Google Sheets
- Voir les modifications faites par d'autres membres

---

## Résumé des actions rapides

| Action | Comment faire |
|--------|---------------|
| **Changer de profil** | Menu "Membre Actif" (barre latérale) |
| **Proposer un livre** | Bouton "+ Proposer un livre" |
| **Modifier mon livre** | Survoler → Bouton crayon ✏️ |
| **Supprimer mon livre** | Modifier → "Supprimer ce livre" |
| **Ajouter un avis** | Détails livre → "+ Ajouter un avis" |
| **Chercher** | Champ recherche (barre latérale) |
| **Filtrer** | Menus déroulants (Genre/Membre/Année) |
| **Changer la vue** | Bouton 📄/🔲 (en-tête) |
| **Actualiser** | Bouton 🔄 (en-tête) |

---

## Aide et support

En cas de problème :
1. Cliquez sur 🔄 pour actualiser les données
2. Rafraîchissez la page (F5 ou Cmd+R)
3. Vérifiez votre connexion Internet

**Mot de passe admin** : `club-lecture-2024`

---

*Guide créé le 23 janvier 2026*
