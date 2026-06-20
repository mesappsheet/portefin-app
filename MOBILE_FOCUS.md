# Directives de Développement : Focus Mobile Uniquement

> [!IMPORTANT]
> **RÈGLE CRITIQUE POUR TOUS LES AGENTS IA :**
> À partir de maintenant, tout le développement, les modifications et l'ajout de nouvelles fonctionnalités doivent se faire **uniquement sur l'application mobile (PWA)**.

## Fichier cible principal
Toutes les modifications du frontend de l'application doivent être apportées uniquement à :
- **`maquette-app/index.html`** (Mobile PWA)

## Changement de règles par rapport à l'ancien fonctionnement (CLAUDE.md)
1. **Plus de parité PC/Mobile** : Il n'est plus nécessaire de reporter les modifications sur `MAQUETTE_COMPLETE.html` (PC). 
2. **Priorité absolue à l'expérience Mobile** : L'interface, les scripts et les appels API doivent être optimisés pour le format PWA / Smartphone.
3. **Persistance des données** : Les requêtes Supabase doivent continuer à utiliser le client mobile `sb`.

## Processus de validation et de suivi

### 1. Avant d'agir : Approbation obligatoire ("OK")
Avant toute modification de code ou ajout de fonctionnalité, l'agent IA doit expliquer ce qu'il a compris (reformulation) et demander l'accord explicite (le "OK" de l'utilisateur) avant de modifier un quelconque fichier.

### 2. Après implémentation : Demande de confirmation
Une fois les modifications appliquées et prêtes à être testées, l'agent IA doit demander la confirmation finale de l'utilisateur :
- **Action requise** : Poser la question exacte : *"Est-ce que c'est bon ?"*

### 3. Validation finale : Mise à jour obligatoire du registre (Mémoire anti-régression)
Si l'utilisateur confirme avec un **"Oui"**, **"C'est bon"**, ou **"OK"**, l'agent IA doit impérativement consigner la nouvelle fonctionnalité, ses règles détaillées, et sa logique de fonctionnement dans la section **"Registre des fonctionnalités actives"** ci-dessous ainsi que dans [CLAUDE.md](file:///c:/MES%20PROJETS/Maquette%20Prospects%20et%20CREDIT/CLAUDE.md).
- **Obligation** : Tout agent IA intervenant sur le projet par la suite doit impérativement lire ce registre de règles **avant** toute modification ultérieure afin d'empêcher formellement la suppression involontaire ou la régression de ces fonctionnalités.

## Registre des fonctionnalités actives (À maintenir et préserver de toute régression)
- **Synchronisation & Import Google Contacts (PWA)** : Bouton "Google" (bleu avec icône de synchronisation) pour exporter vers Google Contacts. Bouton "Importer Google" dans les formulaires de création/modification de Prospect/Client (s'ouvre dans un modal de recherche au premier plan avec un z-index de `250000 !important` spécifié en CSS pour forcer l'affichage par-dessus le formulaire `#modal-overlay` de z-index `100000`, interroge l'action "search" de la Web App Apps Script via l'API Google People, et pré-remplit le nom, l'email, l'adresse et les téléphones 1 à 6). Implémenté et modifié le 2026-06-20.
- **Choix de modification Prospect/Client (PWA)** : Lors du clic sur "Modifier" depuis l'application mobile, affichage d'un modal proposant deux options : (1) *Modifier les informations* (conserve l'historique et l'ID) et (2) *Réinitialiser le dossier/prospect* (destructif : supprime l'enregistrement Supabase ainsi que l'historique lié (échéancier, notes, tâches), puis ré-ouvre le formulaire pré-rempli avec les anciennes informations et le texte des notes/observations pour repartir à zéro sous un nouvel ID). Implémenté pour les clients et prospects le 2026-06-20.
- **Sélecteur de code pays pour téléphone (PWA)** : Implémentation d'un sélecteur d'indicatif pays pour tous les 12 champs de téléphone (6 dans Prospect, 6 dans Client/Crédit) dans `maquette-app/index.html`. L'indicatif par défaut est le Bénin (`🇧🇯`, `+229`) et pré-remplit automatiquement le premier champ de téléphone avec `01`. Lors du choix de l'indicatif Bénin, `01` s'injecte si le champ est vide ou s'il commence autrement. Si l'utilisateur choisit un autre pays et que le champ contient `01`, celui-ci est vidé. La sauvegarde concatène l'indicatif via `getPhoneValPWA` (retire le `0` initial sauf s'il s'agit de `01` avec `+229`). Le chargement via `setPhoneValPWA` extrait le bon indicatif et pré-remplit l'affichage. Le modal de sélection a un z-index de 300000. Implémenté le 2026-06-20.
