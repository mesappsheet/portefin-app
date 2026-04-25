# Gestionnaire de Tâches - Logique Métier & Fonctionnalités

Ce document centralise toute la logique métier, la structure de données et les fonctionnalités liées au module de gestion des tâches de l'application.

## 1. Architecture de Base de Données (Supabase)

Le gestionnaire de tâches s'appuie sur une structure robuste pour limiter les calculs côté client (front-end) :

### A. Table Brute : `tasks`
Cette table stocke les informations essentielles saisies par l'utilisateur.
- **Identité** : `id`, `title`, `notes`
- **Liaison** : `entity_id` (UUID du client ou prospect), `entity_type` ('client', 'prospect', 'free')
- **Planification** : `due_date`, `priority` (low, normal, high, urgent), `status` (todo, in_progress, done)
- **Composition** : `subtasks` (Format JSONB listant les étapes de la tâche)

### B. Vue Enrichie : `vw_tasks`
Au lieu d'interroger la table brute, l'application lit cette vue côté serveur. Elle génère automatiquement et en temps réel des "colonnes virtuelles" pour éviter toute erreur de décalage :
- **`subtasks_count`** : Nombre total de sous-tâches identifiées dans le JSON.
- **`subtasks_done_count`** : Nombre de sous-tâches cochées (`true`).
- **`progress_percent`** : Ratio calculé automatiquement (0 à 100%). Forcé à 100% si le statut général de la tâche passe à `done`.
- **`diff_days`** : Écart en jours entre `due_date` et la date du jour (négatif si en retard).
- **`is_overdue`** : Booléen (`true`/`false`) qui signale rapidement un retard avéré.

---

## 2. Fonctionnalités de l'Application Client (JavaScript)

### A. Affichage et Métriques du tableau de bord (`viewTasksMobile`)
1. **Compteurs Dynamiques** : Calcule le nombre de tâches "À faire", "En cours", "Terminées" et "En retard" en fonction des données de la vue `vw_tasks`.
2. **Filtrage Rapide** : Onglets permettant de basculer l'affichage du listing instantanément.
3. **Barre de progression** : Dans les cartes (`taskCardMobile`), les sous-tâches pilotent visuellement une jauge grâce à la variable `progress_percent`. 
4. **Indicateurs d'échéance** : Affiche automatiquement "Aujourd'hui", "Demain" ou "En retard (X j)" grâce à `diff_days`.

### B. Manipulation des Tâches (`saveTaskMobile`, `quickToggleTaskMobile`)
- **Mode Optimiste (Quick Toggle)** : Permet de basculer une tâche au statut "Terminé" (et inversement) depuis la vue liste grâce à une petite icône circulaire, avec un retour visuel instantané.
- **Liaison Intelligente** : (`searchTaskEntityMob`) Lors de la création, l'utilisateur tape le nom d'un contact. L'application recherche en parallèle dans les tables `clients` et `prospects` (dans Supabase) pour rattacher la tâche à la bonne entité.

### C. Sous-tâches (Subtasks)
Gérées via `renderSubtasksMob` et `addSubtaskMob`, elles permettent d'ajouter des checklists. En base, tout est compressé et formaté de manière transparente en un Array JSON :
```json
[
  { "id": "1", "text": "Appeler la banque", "done": true },
  { "id": "2", "text": "Rassembler papiers", "done": false }
]
```

### D. Confort Utilisateur
- **Export Google Agenda** : (`exportTaskToGCalMobile`) Génère une URL pré-remplie pour ouvrir l'application Google Agenda. Le titre, les sous-tâches formatées avec des puces (✓ et ○), les notes globales et la date d'échéance y sont injectées automatiquement.
