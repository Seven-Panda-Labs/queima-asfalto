# Changelog

[Português](change-log.md) | [English](change-log.en.md) | [Español](change-log.es.md) | [Deutsch](change-log.de.md) | [Français](change-log.fr.md) | [العربية](change-log.ar.md)

---

## [1.26.0] - 2026-08-30

### Ajouté

- **Choisis les disciplines que tu veux voir :** dans Réglages > App, tu peux désactiver les distances que tu ne cours pas. Elles disparaissent des filtres et des sélecteurs. Rien n'est perdu : les courses, objectifs et records déjà enregistrés dans une discipline désactivée restent visibles.

---

## [1.25.0] - 2026-08-30

### Modifié

- **La page Résultats devient la page Analyse :** elle ne répète plus la liste des événements. Elle répond à trois questions, choisies en haut : comment va cette saison, comment elle se compare aux précédentes, et ce qui a changé depuis toujours. La route est passée à `/analise`, et les anciens liens fonctionnent toujours.
- **Courbe de forme :** chaque course est convertie en son équivalent sur ta distance la plus courue, si bien qu'un 5K et un marathon se comparent sur une même ligne. Elle estime aussi tes temps sur les autres distances, d'après ta meilleure marque des 12 derniers mois.
- **Nouvelles lectures :** place dans le peloton au fil du temps, progression de chaque record, km cumulés face aux saisons précédentes, mois forts et faibles de l'année, et une grille de régularité par courses ou par kilomètres.
- **Allure moyenne de l'année corrigée :** elle est désormais pondérée par la distance. Auparavant un 5K pesait autant qu'un marathon.

---

## [1.24.0] - 2026-08-29

### Modifié

- **Le résultat d'une course se modifie sur la page de l'événement :** la page séparée disparaît. Le temps, la position et le lien vers les résultats officiels sont désormais au même endroit, à côté des chiffres.

---

## [1.23.0] - 2026-08-29

### Modifié

- **Le catalogue parkrun se met à jour tout seul :** les nouvelles courses parkrun apparaissent quelques jours après leur ouverture, sans attendre une mise à jour de l'application. La liste n'est plus non plus téléchargée lorsqu'elle est déjà à jour, ce qui allège le démarrage.

---

## [1.22.0] - 2026-08-28

### Modifié

- **Le reste de l'app rejoint l'Accueil :** les objectifs se regroupent par état, les atteints en tête, les filtres et les sélecteurs de vue sont identiques sur toutes les pages, et la page d'un événement s'ouvre sur le nom de la course et son résultat.

---

## [1.21.0] - 2026-08-28

### Modifié

- **Accueil redessiné :** le prochain événement en avant avec son compte à rebours, les chiffres de l'année dans une seule bande, désormais avec les kilomètres parcourus, et une place à part pour les réussites, les objectifs en cours et les records personnels.

---

## [1.20.0] - 2026-08-25

### Ajouté

- **Nouvelle langue, arabe (première version) :** l'application, les notes de version, l'avis sur les résultats officiels, la politique de confidentialité, les e-mails de compte et les rappels push sont désormais disponibles en arabe, avec une mise en page de droite à gauche (RTL). Choisis-le dans Paramètres → Langue.

---

## [1.19.0] - 2026-08-25

### Ajouté

- **Nouvelle langue, français :** l'application, les notes de version, l'avis sur les résultats officiels, la politique de confidentialité, les e-mails de compte et les rappels push sont désormais disponibles en français. Choisis-le dans Paramètres → Langue.

---

## [1.18.0] - 2026-08-17

### Modifié

- **Résultats officiels :** recherche automatique des résultats Parkrun temporairement désactivée : Parkrun bloque les requêtes automatisées provenant d'infrastructures cloud connues. Les résultats peuvent toujours être saisis manuellement.

---

## [1.17.0] - 2026-08-13

### Ajouté

- **Nouveau sélecteur d'emojis :** recherche et accès à tous les emojis Unicode, en remplacement de l'ancienne liste sélectionnée.

---

## [1.16.1] - 2026-08-13

### Ajouté

- **Plus d'emojis :** plus de 50 nouvelles options ajoutées au sélecteur d'emojis des événements et objectifs : animaux, fleurs, nourriture, thèmes d'Halloween et drapeaux d'Asie, d'Amérique du Sud et d'Afrique du Nord.

### Corrigé

- **Statut d'événement :** un événement avec un résultat officiel ne peut plus se retrouver marqué « Manqué ». Il y avait une condition de concurrence entre la transition automatique vers « Manqué » et l'enregistrement du résultat. Si la transition automatique gagnait, le statut était faux alors que le résultat avait bien été enregistré.

---

## [1.16.0] - 2026-08-03

### Ajouté

- **Sauvegarde avec photos et vidéos :** le `.zip` de sauvegarde inclut désormais les fichiers photo et vidéo, pas seulement leurs métadonnées. Tu peux désactiver l'option avant l'export ; au-delà de 300 Mo, la sauvegarde ne conserve que les données.
- **Restauration des photos et vidéos :** avec les fichiers dans le `.zip`, les photos et vidéos reviennent même en mode « tout remplacer » et lors d'une restauration dans un autre compte. Auparavant elles ne survivaient que si elles étaient encore dans le compte.

---

## [1.15.1] - 2026-08-03

### Corrigé

- **Sécurité :** les règles Firestore traitent désormais les champs d'approbation de compte comme immuables côté client. Un compte en attente ou refusé pouvait auparavant supprimer son propre `accountStatus` en une seule écriture et obtenir un accès complet.
- **Paramètres :** sur les instances avec approbation de compte activée, l'enregistrement de la langue, des préférences de notification et du profil de résultats fonctionne de nouveau. Toute écriture était refusée une fois le compte approuvé.

---

## [1.15.0] - 2026-08-03

### Ajouté

- **Sauvegarde complète :** exporte toutes tes données en JSON dans un fichier `.zip` (événements, objectifs, objectifs de performance, bucket list, métadonnées des photos et vidéos, préférences et partages).
- **Restaurer une sauvegarde :** importe un `.zip` de sauvegarde pour récupérer tes données, en conservant les identifiants de document d'origine. Tu peux fusionner avec tes données actuelles ou tout remplacer.

---

## [1.14.2] - 2026-08-02

### Corrigé

- **Résultats officiels :** MikaTiming choisit la bonne colonne de classement général (la disposition varie selon l'événement).
- **Résultats officiels :** nombre de finishers MikaTiming sans filtre de sexe (en-tête de liste).

---

## [1.14.1] - 2026-08-01

### Corrigé

- **Résultats officiels :** connecteur MikaTiming (recherche multi-événements et temps nets) ; plus de mémoire pour la fonction de recherche.

---

## [1.14.0] - 2026-07-30

### Ajouté

- **Auto-hébergement :** approbation manuelle optionnelle des nouveaux comptes : écrans en attente/refusé, e-mail admin avec liens approuver/refuser (Resend), notification de l'utilisateur, règles Firestore/Storage et fonctions Auth bloquantes ; voir `docs/configuration.md` et `docs/self-hosting.md`.

---

## [1.13.0] - 2026-07-23

### Ajouté

- **Souvenirs :** visionneuse pour afficher photos et vidéos en plein écran, avec navigation par flèches, clavier et balayage sur mobile.

---

## [1.12.1] - 2026-07-23

### Modifié

- Plusieurs mises à jour de performance et de sécurité.

---

## [1.12.0] - 2026-07-23

### Ajouté

- **Langues :** prise en charge de l'espagnol (es-ES) et de l'allemand : interface, libellés d'emojis, rappels push, changelog, politique de confidentialité et avis sur les résultats officiels.
- **Paramètres :** sélecteur de langue avec Português, English, Español et Deutsch.

### Modifié

- Les clés de traduction manquantes retombent sur l'anglais ; détection de la langue du navigateur pour `pt`, `en`, `es` et `de`.

---

## [1.11.0] - 2026-07-20

### Ajouté

- **Confidentialité :** lien vers la politique de confidentialité dans le pied de page de l'application.

### Corrigé

- **Confidentialité :** la page utilise la même mise en page, le même thème et la même navigation que le reste de l'application.

### Modifié

- Intervalle minimum entre deux recherches de résultats officiels porté à **10 secondes**, avec compte à rebours sur le bouton.

---

## [1.10.0] - 2026-07-19

### Ajouté

- **Parkrun :** création d'événement dédiée avec recherche dans le catalogue mondial, favoris et pays dans l'autocomplétion.
- **Parkrun :** favoris dans le profil de résultats ; les événements choisis sont ajoutés automatiquement aux favoris.

### Corrigé

- **Parkrun :** changer la sélection dans l'autocomplétion met de nouveau à jour le lieu et la carte.

### Modifié

- **Parkrun :** import de résultats plus fiable, avec le bon événement enregistré sur la fiche.

---

## [1.9.2] - 2026-07-19

### Ajouté

- **Google Analytics** intégré à l'application.

### Corrigé

- **Parkrun :** import des résultats officiels en échec dans certains environnements.

### Modifié

- Intervalle minimum entre deux recherches de résultats officiels réduit à **5 secondes**, avec compte à rebours sur le bouton.

---

## [1.9.1] - 2026-07-19

### Corrigé

- **MyRaceResult :** recherche dans les événements à plusieurs catégories (ex. Mittsommerlauf).

### Modifié

- **MyRaceResult :** prise en charge des résultats intégrés aux pages d'événement et du classement général par temps.

---

## [1.9.0] - 2026-07-09

### Ajouté

- Connecteur **mika:timing** (Marathon de Chicago, Marathon de Londres, etc.).

### Modifié

- Liste des plateformes prises en charge dans les Paramètres triée par ordre alphabétique.

---

## [1.8.0] - 2026-07-09

### Ajouté

- Connecteur **Tímataka** (timataka.net / timataka.is).

---

## [1.7.0] - 2026-07-09

### Ajouté

- **Notifications push** avec rappels même quand l'application est fermée.

### Modifié

- Paramètres de notification mis à jour ; langue de l'application utilisée pour les messages distants.

---

## [1.6.0] - 2026-07-08

### Ajouté

- Connecteur **Wiclax** (résultats de course en direct).

---

## [1.5.1] - 2026-07-08

### Ajouté

- Page **Nouveautés** (`/novidades`) avec l'historique des versions ; lien depuis la version en pied de page.
- Crédit **Seven Panda Labs** dans le pied de page.

---

## [1.5.0] - 2026-07-08

### Ajouté

- Connecteur **VCRunning** (Valencia Ciudad del Running).
- Changelog versionné en portugais et en anglais.

---

## [1.4.0] - 2026-07-08

### Ajouté

- Améliorations UX pour les événements **Parkrun** : configuration de l'identifiant Parkrunner et formulaire simplifié.

---

## [1.3.2] - 2026-07-07

### Ajouté

- Plus de messages de chargement dans la voix de la marque.

---

## [1.3.1] - 2026-07-07

### Ajouté

- Voix de la marque dans les états vides, les messages de chargement et de succès.
- Documentation de la voix dans [docs/voice.md](docs/voice.md).

### Corrigé

- Départage des records personnels par le temps quand l'allure et la distance sont identiques.

---

## [1.3.0] - 2026-07-06

### Modifié

- Paramètres réorganisés ; le partage a été déplacé dans les Paramètres.

---

## [1.2.0] - 2026-07-06

### Ajouté

- Résultats partagés sur la page Résultats, avec des séparateurs par ami.

### Corrigé

- Dates dans les données partagées reçues des amis.

---

## [1.1.0] - 2026-07-06

### Ajouté

- Vues partagées dans les sections Événements et Objectifs.

---

## [1.0.2] - 2026-07-06

### Corrigé

- E-mail du propriétaire visible sur les invitations de partage reçues.

---

## [1.0.1] - 2026-07-06

### Ajouté

- Modification des permissions de partage et avis d'invitation en attente.

---

## [1.0.0] - 2026-07-06

Jalon : partage de données entre amis.

### Ajouté

- Partage d'événements, d'objectifs et de résultats avec invitations par e-mail.
- Permissions configurables par domaine (événements, objectifs, résultats, objectifs de performance).

---

## [0.22.0] - 2026-07-06

### Ajouté

- Fondations du partage avec des amis.

---

## [0.21.0] - 2026-07-06

### Ajouté

- Mode sombre avec préférence système.

---

## [0.20.0] - 2026-07-05

### Ajouté

- Connecteur **Ultimate Sport Service**.

---

## [0.19.1] - 2026-07-05

### Corrigé

- **RunCzech :** temps puce au lieu du temps officiel (gun time).

---

## [0.19.0] - 2026-07-05

### Ajouté

- Connecteur **RunCzech**.

---

## [0.18.1] - 2026-07-05

### Corrigé

- **NSF Berlin :** tableaux à colonnes variables.

---

## [0.18.0] - 2026-07-05

### Ajouté

- Connecteur **NSF Berlin**.

---

## [0.17.2] - 2026-07-05

### Corrigé

- **ZielZeit :** temps net au lieu du temps brut.

---

## [0.17.1] - 2026-07-05

### Corrigé

- **EQ Timing :** classement général basé sur les finishers de l'étape.

---

## [0.17.0] - 2026-07-05

### Ajouté

- Connecteur **EQ Timing**.

---

## [0.16.0] - 2026-07-05

### Ajouté

- Connecteur **ZielZeit**.

---

## [0.15.0] - 2026-07-05

### Ajouté

- Connecteur **Strassenlauf.org**.

---

## [0.14.1] - 2026-07-05

### Corrigé

- **MyRacePartner :** recherche plus robuste.

---

## [0.14.0] - 2026-07-05

### Ajouté

- Connecteur **MyRacePartner**.

---

## [0.13.1] - 2026-07-05

### Corrigé

- **MaxFunSports :** nombre de finishers dans les URL intégrées.

---

## [0.13.0] - 2026-07-05

### Ajouté

- Connecteur **MaxFunSports**.

---

## [0.12.2] - 2026-07-05

### Corrigé

- **SCC Events :** compétition SCC Läufer incluse dans la recherche.

---

## [0.12.1] - 2026-07-05

### Corrigé

- **SCC Events :** détection d'URL élargie.

---

## [0.12.0] - 2026-07-05

### Ajouté

- Connecteur **SCC Events**.

---

## [0.11.1] - 2026-07-05

### Corrigé

- **MyRaceResult :** recherche dans les catégories exclues de la liste principale.

---

## [0.11.0] - 2026-07-05

### Ajouté

- Connecteur **MyRaceResult**.

### Corrigé

- **Parkrun**, **Davengo** et **Sporthive :** diverses améliorations de l'import des résultats.

---

## [0.9.0] - 2026-07-04

Jalon : résultats officiels automatiques.

### Ajouté

- Import des résultats officiels pour **Sporthive**, **Davengo** et **Parkrun**.
- Icône de résultat vérifié dans les listes.
- Nombre de finishers pour Parkrun et Davengo.

### Corrigé

- Analyse du tableau de résultats Parkrun.

---

## [0.8.0] - 2026-07-04

### Corrigé

- La carte ne recouvre plus les boîtes de dialogue.

### Modifié

- Ordre des éléments de la navigation principale.

---

## [0.7.0] - 2026-07-04

### Ajouté

- Carte sur la bucket list et la page Résultats.
- Plus d'emojis disponibles.

---

## [0.6.2] - 2026-07-02

### Ajouté

- Légende des états dans la vue carte.

---

## [0.6.1] - 2026-07-02

### Corrigé

- Alertes de sécurité des dépendances.

---

## [0.6.0] - 2026-06-30

### Ajouté

- Autocomplétion de lieu et carte sur la bucket list.

---

## [0.5.4] - 2026-06-30

### Ajouté

- Aperçu de la carte dans le formulaire d'événement.

---

## [0.5.3] - 2026-06-30

### Corrigé

- Regroupement des marqueurs sur la carte.

---

## [0.5.2] - 2026-06-30

### Corrigé

- Recherche de lieu redondante après la sélection d'une suggestion.

---

## [0.5.1] - 2026-06-30

### Ajouté

- Autocomplétion de lieu et géocodage.
- Carte sur le détail de l'événement.

---

## [0.5.0] - 2026-06-29

Jalon : mode carte.

### Ajouté

- Coordonnées sur les événements et vue **Liste | Carte** sur la page Événements.
- Panneau pour les événements sans lieu défini.

---

## [0.4.3] - 2026-06-29

### Corrigé

- Photos et vidéos d'événement en production.

---

## [0.4.2] - 2026-06-29

### Corrigé

- Permissions d'accès aux photos et vidéos.

---

## [0.4.1] - 2026-06-29

### Corrigé

- Chargement des souvenirs (photos/vidéos).

---

## [0.4.0] - 2026-06-29

Jalon : photos et vidéos d'événement.

### Ajouté

- Envoi de photos et vidéos sur le détail de l'événement (jusqu'à 10 fichiers ; vidéo de 2 min max).
- Galerie de souvenirs par événement.

### Corrigé

- La galerie se met à jour immédiatement après l'envoi.

---

## [0.2.0] - 2026-06-28

Jalon : internationalisation.

### Ajouté

- Prise en charge de **pt-PT** et **en-GB**.
- Plusieurs disciplines par élément de la bucket list.
- Vue détaillée d'événement et récupération vers la bucket list.
- États Échoué, Dépassé et Pulvérisé pour les objectifs de performance.
- Jours avant le prochain événement sur le tableau de bord.
- Version de l'application en pied de page.

### Modifié

- État « Programmé » renommé « Planifié ».
- Déconnexion déplacée dans les Paramètres.

### Corrigé

- Contraste et filtres d'état ; légende et tableau dans Résultats.
- Isolation des données par utilisateur.

---

## [0.1.0] - 2026-06-26

Jalon : **MVP**, remplacement du tableur Excel par une PWA.

### Ajouté

- Application web avec connexion Google, données dans le cloud et mode hors ligne.
- Gestion des événements, résultats et objectifs annuels ; tableau de bord avec graphiques.
- Import et export Excel.
- **Bucket list**, calendrier, objectifs de performance et notifications locales.
- Paramètres, records personnels et installation PWA.

### Corrigé

- Connexion et synchronisation hors ligne entre plusieurs onglets.
