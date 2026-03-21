# Logique Métier & Structure Supabase (V1)

Ce document récapitule la logique métier et la structure de données nécessaire pour migrer la maquette vers une application fonctionnelle avec **Supabase**.

## 1. Schéma de Données (Priorité : Dates & Rôles)

### Table : `profiles` (Utilisateurs & Rôles)
- `id` (uuid, primary key, references auth.users)
- `full_name` (text)
- `role` (text) : 'admin' (voit tout) ou 'manager' (voit ses propres données).

### Table : `prospects`
- `id` (uuid, primary key)
- `assigned_to` (uuid, references profiles.id) : Le gestionnaire en charge.
- `full_name` (text)
- `email` (text)
- `phone` (text)
- `status` (text)
- *Note : Pas de conversion automatique vers Client.*

### Table : `credits` (Dossiers Clients)
Stocke les dossiers de crédit. Un dossier est indépendant des prospects.
- `id` (uuid, primary key)
- `manager_id` (uuid, references profiles.id) : Le gestionnaire qui gère le dossier.
- `client_name` (text)
- `amount` (numeric)
- `start_date` (date)
- `end_term_date` (date)
- `status` (text) : Gestion manuelle (Ex: 'En cours', 'Souffrance').

---

## 2. Visibilité et Rôles (Sécurité RLS)

- **Admin** : Accès complet en lecture/écriture sur toutes les tables (`prospects`, `credits`, `repayments`).
- **Gestionnaire (Manager)** : 
  - Peut voir UNIQUEMENT les prospects qui lui sont assignés (`assigned_to = user_id`).
  - Peut voir UNIQUEMENT les dossiers de crédit qu'il gère (`manager_id = user_id`).

---

## 3. Logique de Calcul de l'Échéancier

### Génération des Dates
1. **Intervalle Strict** : Chaque échéance est calculée exactement **30 jours** après le déblocage des fonds.
2. **Règle des Week-ends** : Si la date tombe un **Samedi** ou un **Dimanche**, l'échéance est due le **Lundi** suivant.

---

## 4. Gestion des Statuts (Manuelle)
- **Action** : L'utilisateur clique sur le statut.
- **Interaction** : Une liste de choix manuelle s'affiche pour changer le statut.

---

## 5. Modifications UI à prévoir
- **Suppression du bouton "Convertir en client"** : La conversion n'est plus un processus automatisé.
- **Filtres de vue** : Ajout d'une logique pour filtrer les données selon l'utilisateur connecté (Admin vs Manager).
