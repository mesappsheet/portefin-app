# Instructions pour les Agents IA (Antigravity, Claude, etc.) — Projet PorteFin

## Règle n°1 : Processus d'implémentation et de validation (CRITIQUE)

Pour chaque demande de modification ou d'ajout de fonctionnalité, l'agent IA doit impérativement respecter les étapes suivantes :

### 1. Avant d'agir (Conception et approbation)
L'agent IA doit reformuler le besoin et planifier l'action :
- **Étape 1 — Reformulation** : Résumer le besoin en 2-3 phrases.
- **Étape 2 — Plan d'action** : Lister les fichiers touchés et les changements.
- **Étape 3 — Demande de démarrage** : Demander explicitement l'accord ("OK") de l'utilisateur avant de toucher au code.

### 2. Après l'implémentation (Demande de confirmation)
Une fois les modifications implémentées et prêtes à être testées, l'agent doit demander la confirmation finale de l'utilisateur :
- **Action requise** : Poser la question exacte : *"Est-ce que c'est bon ?"*

### 3. Clôture et sauvegarde en mémoire (Mise à jour des fichiers MD)
Si l'utilisateur valide et répond **"Oui"**, **"C'est bon"**, ou **"OK"** :
- **Action requise** : Mettre à jour immédiatement ce fichier (`CLAUDE.md`) ainsi que [MOBILE_FOCUS.md](file:///c:/MES%20PROJETS/Maquette%20Prospects%20et%20CREDIT/MOBILE_FOCUS.md) dans le registre des fonctionnalités actives.
- **Contenu à inscrire** : Les règles détaillées, la logique métier, et les fichiers modifiés pour cette nouvelle fonctionnalité.
- **Objectif** : Que tout agent futur lise et respecte ce registre **avant** toute modification ultérieure afin d'empêcher formellement la suppression involontaire ou la régression de ces fonctionnalités.

---

## Règle n°2 : Focus exclusif sur l'application mobile (PWA)

Ce projet se concentre désormais uniquement sur le développement mobile :

- **Fichier principal** : `maquette-app/index.html` (Mobile PWA)
- **Client Supabase** : `sb`
- **Navigation** : `navTo('nom')`
- **Rendu HTML** : Fonctions `viewXxx()` / `innerHTML` direct
- **Modales** : `openConfirm()` / overlays fullscreen
- **Toast/notifications** : `toast()`

### Obligation de non-régression
Toutes les modifications doivent être testées et adaptées pour le format mobile / PWA. Il n'est plus nécessaire de reporter ou de maintenir les modifications sur `MAQUETTE_COMPLETE.html` (PC).

### Règle sur les données
Faire des requêtes directes sur les tables via le client Supabase `sb` (`repayments`, `credits`, etc.) plutôt que de s'appuyer sur des vues calculées.

---

## Règle n°3 : Pas de surprise

- Ne jamais modifier un fichier sans l'avoir lu au préalable
- Ne jamais supposer la structure du code — toujours vérifier
- Si une modification risque de casser quelque chose, le signaler avant de l'appliquer
- Toujours committer et pusher après chaque feature complète

---

## Contexte technique du projet

- **Stack** : HTML/CSS/JS vanilla + Tailwind CDN + Supabase (PostgreSQL)
- **Déploiement** : Netlify (branche `main` → production automatique)
- **Architecture PC** : `SCREENS` object (template literals injectés via `loadScreen()`) + `CONFIG` object + `switchModule()`
- **Architecture mobile** : fonctions `viewXxx()` appelées par `navTo()`, écrans fullscreen via `display:flex/none`
- **Icônes** : Material Symbols Outlined (Google Fonts CDN)

---

## Style de réponse attendu

- Réponses courtes et directes
- Pas de récapitulatif après chaque action ("voilà ce que j'ai fait…") — l'utilisateur voit le diff
- Utiliser des tableaux ou listes pour les plans d'action
- En cas de doute sur l'intention, poser une seule question précise

---

## Registre des fonctionnalités actives (À maintenir et préserver de toute régression)

- **Synchronisation & Import Google Contacts (PWA)** : Synchronisation automatique de toutes les coordonnées (téléphones 1 à 6, nom, e-mail, adresse) avec Google Contacts lors de chaque création ou modification de Prospect ou Client. Pour garantir une correspondance parfaite sans accumulation de numéros obsolètes, le script Google Apps Script détecte les doublons par Nom complet ou par Numéro, supprime l'ancienne fiche contact et en recrée une propre. L'opération affiche à chaque fois une modale de rapport interactive (`showGoogleContactSyncReportModal`) indiquant le statut et listant tous les numéros enregistrés, avec un bouton de lien direct vers la fiche de contact Google. L'import depuis Google Contacts via recherche s'affiche par-dessus le formulaire principal (z-index `250000`). Modifié le 2026-06-21.
- **Choix de modification Prospect/Client (PWA)** : Lors du clic sur "Modifier" depuis l'application mobile, affichage d'un modal proposant deux options : (1) *Modifier les informations* (conserve l'historique et l'ID) et (2) *Réinitialiser le dossier/prospect* (destructif : supprime l'enregistrement Supabase ainsi que l'historique lié (échéancier, notes, tâches), puis ré-ouvre le formulaire pré-rempli avec les anciennes informations et le texte des notes/observations pour repartir à zéro sous un nouvel ID). L'action de modification dans le menu contextuel du prospect (`prosMenu`) appelle `handleEditProspectChoiceMobile(pid)` et celle des clients appelle `handleEditCreditChoiceMobile(cid)`. Implémenté pour les clients et prospects le 2026-06-20.
- **Sélecteur de code pays pour téléphone (PWA)** : Implémentation d'un sélecteur d'indicatif pays pour tous les 12 champs de téléphone (6 dans Prospect, 6 dans Client/Crédit) dans `maquette-app/index.html`. L'indicatif par défaut est le Bénin (`🇧🇯`, `+229`) et pré-remplit automatiquement le premier champ de téléphone avec `01`. Lors du choix de l'indicatif Bénin, `01` s'injecte si le champ est vide ou s'il commence autrement. Si l'utilisateur choisit un autre pays et que le champ contient `01`, celui-ci est vidé. La sauvegarde concatène l'indicatif via `getPhoneValPWA` (retire le `0` initial sauf s'il s'agit de `01` avec `+229`). Le chargement via `setPhoneValPWA` extrait le bon indicatif et pré-remplit l'affichage. Le modal de sélection a un z-index de 300000. Implémenté le 2026-06-20.
- **Synchronisation automatique & Mise à jour des Tâches (Google Tasks & Agenda) (PWA)** : Enregistrement de tâche (création ou modification) dans Supabase qui déclenche automatiquement `syncTaskToGoogleMobile` en arrière-plan. Le titre de la tâche synchronisée est formaté comme `[Client / Prospect lié] - [Titre de la tâche]`. La détection de doublons s'effectue par titre : Google Tasks est mis à jour (`Tasks.Tasks.update`) avec un format d'échéance strict à minuit (`T00:00:00Z`), et Google Agenda supprime l'ancien événement pour le recréer à jour. Un rapport s'affiche dans une modale (`#google-task-sync-report-modal`, z-index `350000 !important`) avec badges colorés et liens d'accès direct vers Agenda et Tasks. Un bouton manuel `cloud_sync` (bleu) est également présent à côté de la corbeille en modification. Implémenté le 2026-06-20.
- **Sélection multi-numéros pour les communications (PWA)** : Si un Prospect ou un Client possède plusieurs numéros de téléphone (champs `phone` ou `phone1` à `phone6` renseignés), toute action d'appel, d'envoi de message WhatsApp ou de SMS déclenche l'apparition d'un modal de sélection (`showPhoneSelectionModal` géré par `actionWithPhoneSelection`) pour que l'utilisateur choisisse le numéro cible. S'il n'y a qu'un seul numéro, l'action se lance directement. Implémenté le 2026-06-20.
- **Affichage Avis / Observations dans la liste des Prospects (PWA)** : Affichage direct du champ notes/observations (champ `notes` ou `observations` de la table `prospects`) sous le numéro de téléphone et l'adresse de chaque carte prospect (`prosRow`) si le champ n'est pas vide, matérialisé par l'icône `sticky_note_2`. Modifié le 2026-06-20.
- **Résolution des actions du menu Remboursements (PWA)** : Correction du dysfonctionnement du bouton "Modifier dossier" (et des boutons de communication Appel, WhatsApp, SMS) sur l'écran des remboursements (`repMenu`). La requête de chargement `loadRepayments()` a été mise à jour pour récupérer toutes les colonnes requises de la table `credits` et de son `client` lié, et peuple `_credCache` au chargement. De plus, `openCreditDetail(id)` vérifie désormais la présence des statistiques de remboursements (`!c.reps`) pour invalider le cache incomplet provenant de la liste REMB et forcer un rechargement propre depuis Supabase afin d'éviter tout plantage à l'ouverture de l'écran des détails. Modifié le 2026-06-20.
- **Synchronisation Bidirectionnelle & Bouton de Synchronisation Globale des Tâches (PWA & Google Tasks & Agenda)** : Synchronisation bidirectionnelle de l'état de complétion (terminée ou non) des tâches, avec suivi strict par ID unique Supabase stocké sous la forme `[ID: <id>]` dans les notes de Google Tasks et la description de Google Agenda. Ce suivi évite tout doublon même en cas de déplacement ou changement de date de la tâche (recherche d'échéance par ID sur l'Agenda via une recherche textuelle). Cocher/décoche une tâche dans la PWA synchronise l'état : coche/décoche dans Google Tasks et ajoute/retire le préfixe `✓ ` au titre de l'événement Google Agenda. La synchronisation globale via le bouton `cloud_sync` compare par ID unique, résout les conflits en fonction du timestamp le plus récent (`updated_at` vs `updated`), n'exporte vers Google que les tâches locales actives/non-terminées, et affiche une modale de rapport détaillée (`showGlobalTaskSyncReportModal`) avec des boutons d'ouverture directe des applications natives Google Tasks et Google Agenda sur Android. Implémenté le 2026-06-20.
- **Sélection multiple (appui long) & Menu déroulant de statut de tâche (PWA)** : Un appui long (600ms) sur n'importe quelle carte de tâche (terminée ou non) active le mode de sélection multiple pour suppression en masse. Le bouton de statut (quand actif) et le bouton de sélection (quand en mode sélection) s'affichent sous forme de **cercle simple vide** sans icône intérieure pour éviter l'effet de double-cercle (dessiné à la couleur de priorité pour `todo` et en gris pour la sélection). En sélection, le cercle sélectionné se remplit en orange (`#f27f0d`) et la carte s'illuminent. Une barre flottante premium (glassmorphic) apparaît en bas avec options "Tout sélectionner/Désélectionner tout" et "Supprimer" (confirmation groupée unique). Lorsque le mode sélection est inactif, cliquer sur le cercle simple d'une tâche ouvre un mini-menu flottant avec les options *À faire*, *En cours* et *Terminée*. Si **En cours** est sélectionné, le cercle simple devient **rouge** (`#ef4444`). Si **Terminée** est sélectionné, la tâche disparaît immédiatement de la vue active pour aller dans les tâches terminées en bas. Implémenté le 2026-06-21.
- **Export Excel des Prospects filtrés (PWA)** : Ajout d'un bouton **« Exporter en Excel »** dans l'écran Prospects de l'application mobile. L'export tient compte de tous les filtres actifs (recherche texte, filtre de statut, filtre avancé par activité et par dates) grâce à la variable globale `_filteredProspectsMobile` mise à jour à chaque appel de `loadProspects()`. Le fichier Excel généré (via la bibliothèque `xlsx-js-style@1.2.0` depuis jsDelivr CDN) contient : titre fusionné A1:H1, sous-titre A2:H2, en-têtes orange thématique (#F27F0D), données en zèbre blanc/slate avec bordures fines. Colonnes : N°, Date de création, Nom & Prénom, Téléphone, Activité, Adresse, Avis du prospect, Observations. La fonction d'export s'appelle `exportProspectsToExcelMobile()` et est accessible via (1) l'icône download verte dans la toolbar principale et (2) le lien texte vert « Exporter en Excel » dans la barre de comptage des prospects. Implémenté le 2026-06-21.
