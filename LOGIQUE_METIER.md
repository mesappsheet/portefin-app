# Logique Métier de l'Application (Suivi & Documentation)

Ce document centralise toutes les règles de gestion et la logique métier implémentées au fur et à mesure dans l'application.

---

## 1. Gestion des Crédits

### A. Crédits Soldés (Règles d'affichage)
- **Par défaut :** L'écran affiche l'intégralité des dossiers soldés (`all`) sans restriction de date.
- **Filtres de période :** 
    - **Ce jour :** Affiche les dossiers dont la date de fin (`end_date`) est la date actuelle.
    - **Cette semaine :** Dossiers soldés sur les 7 derniers jours glissants.
    - **Ce mois :** Dossiers soldés depuis le 1er jour du mois en cours.
    - **Période personnalisée :** Recherche entre deux dates spécifiques saisies par l'utilisateur.
- **Recherche :** Recherche temps réel (avec délai de 300ms) basée sur le nom du client (insensible à la casse).
- **Statistiques :** Le compteur "Total" s'adapte dynamiquement selon le filtre appliqué pour indiquer précisément le nombre de dossiers trouvés.

### B. Fin d'Échéance (Règles d'affichage)
- **Filtre par défaut :** Affiche les crédits arrivant à échéance dans la **semaine en cours** (`week`).
- **Filtres disponibles :** Jour, Semaine, Mois, Période personnalisée.
- **Statut "Échu" :** Un badge rouge "Échu" apparaît automatiquement si la date d'échéance est dépassée par rapport à la date du jour.
- **Pagination :** Affichage par lots de 5 dossiers pour garantir la fluidité de l'interface.

### C. États et Statuts Interactifs (Badges)
- **Badge Santé (Sain / Souffrance) :** Un clic sur le badge permet de basculer l'état de santé du crédit. 
    - **Sain :** Indicateur vert.
    - **Souffrance :** Indicateur ambre/rouge.
    - Toute modification est immédiatement enregistrée dans Supabase.
- **Badge Statut (En cours / Soldé) :** 
    - Un clic sur "En cours" permet de clôturer manuellement le dossier.
    - **Action :** Le statut passe à "Soldé".
    - **Conséquence :** Le dossier est retiré de la liste active pour apparaître dans l'onglet des crédits soldés.

### D. Logique d'Anticipation et de Solde Complet
Lorsqu'un dossier est marqué comme **"Soldé"** manuellement via le badge de statut :
1.  **Anticipation automatique :** Toutes les échéances liées à ce dossier qui sont encore en statut **"En attente"** (non payées) sont automatiquement basculées en statut **"Payé"**.
2.  **Raison métier :** On considère que si le dossier est soldé, le client a réglé l'intégralité de sa dette (même par anticipation).
3.  **Nettoyage Système :** Ce mécanisme garantit que les échéances futures du client n'apparaissent plus dans les listes de remboursements à venir.

---

## 2. Design et Expérience Utilisateur (UX)

### A. Système de Filtres Premium
- **Dropdowns :** Utilisation de menus déroulants (`select`) stylisés avec arrondis larges (`rounded-xl`) et ombres portées (`shadow-sm`).
- **Interaction :**
    - Halo de focus bleu lors de la sélection.
    - Icône de synchronisation orange (`sync`) pour actualiser manuellement les données si nécessaire.
    - Les champs de "Période personnalisée" sont regroupés dans un conteneur dédié (`bg-slate-50`) pour une meilleure clarté visuelle.
- **Badges Actionnables :** Les badges de santé et de statut changent d'apparence au survol pour indiquer qu'ils sont cliquables.

---

## 3. Communication Client & Modèles Dynamiques

### A. Modèles de Communication (Templates)
- **Modèles Actifs :** Si un modèle est marqué comme **"ACTIF"**, son contenu (sujet et corps du message) est sélectionné par défaut lors de l'ouverture du canal de communication concerné (WhatsApp, SMS).
- **Édition Intuitive :** Le panneau d'édition des modèles propose des "Tags Dynamiques" cliquables qui s'insèrent automatiquement dans le corps du message à la position du curseur.

### 3.B. Remplacement Dynamique des Balises (Tags)
Le système remplace en temps réel les balises par les données de la base Supabase :
- **{{Nom du Client}}** / **{{Nom du Prospect}}** / **{{Nom}}** : Nom complet du client ou prospect.
- **{{Montant}}** : Montant du crédit (formaté ex: 1 500 000 FCFA).
- **{{Date_Echeance}}** / **{{Date}}** / **{{Date RDV}}** : Date d'échéance, date du jour ou de rendez-vous.
- **{{Activite}}** / **{{Secteur}}** : Secteur d'activité du client ou prospect.
- **{{ID}}** / **{{Id_Dossier}}** : Identifiant unique du dossier ou prospect.
- **{{Adresse}}** / **{{Ville}}** / **{{Quartier}}** : Localisation du client ou prospect.
- **{{Statut}}** / **{{Statut_Dossier}}** : État actuel du dossier ou du prospect.
- **{{Email}}** : Adresse e-mail de contact.
- **{{Telephone}}** / **{{Téléphone}}** : Numéro de téléphone de contact.
- **{{Type_Credit}}** : Type de financement (Immobilier, Prêt Pro, etc.).
- **{{Nom_Agent}}** : (Optionnel) Nom du conseiller connecté.

**Logiciel de sélection :**
Dans l'interface de gestion des modèles, chaque tag est un bouton cliquable qui l'insère directement à la position du curseur dans le corps du message.

**Utilisation des modèles :**
Lors de l'envoi d'un message via WhatsApp ou SMS, le système récupère automatiquement le modèle marqué comme "ACTIF" pour le canal concerné.

- **Canaux :** 
    - **WhatsApp :** Ouverture automatique de l'application avec le message personnalisé pré-rempli.
    - **Appel :** Lien `tel:` direct pour une mise en relation immédiate.

---

## 4. Gestion de la Prospection

### A. Recherche et Filtrage Premium
- **Recherche Debounced :** Le moteur de recherche attend 300ms après la saisie pour lancer la requête Supabase, évitant ainsi des appels inutiles et garantissant la fluidité.
- **Champs de recherche :** La recherche s'effectue simultanément sur le **Nom**, l'**Activité** et le **Numéro** du prospect.
- **Filtres de Statut :** Possibilité de filtrer instantanément par "Nouveau", "En cours" ou "Qualifié".
- **Design :** Barre de recherche avec icône dynamique et halo de focus bleu (`ring-4 ring-primary/10`).

### B. Conversion en Client
- **Action :** Un bouton dédié permet de basculer un prospect vers le module Crédits.
- **Automatisation :** Les informations saisies lors de la prospection (Nom, Tél, Activité, Adresse) sont automatiquement transmises au formulaire de "Nouveau Dossier".

---

## 5. Gestion des Remboursements (Encaisssements)

### A. Toggle de Paiement Interactif
- **Fonctionnement :** Dans la liste des remboursements, chaque ligne dispose d'un bouton switch interactif.
- **Action "Payer" :** 
    - Un clic bascule l'échéance à **"Payé"**.
    - La **date effective de paiement** est automatiquement enregistrée à la date du jour.
- **Action "Annuler" :** Un second clic permet de remettre l'échéance en statut **"En attente"** (avec suppression de la date de paiement effective).
- **Synchronisation :** Dès qu'une modification est faite, les statistiques de progression (barre de pourcentage, ratio payé/total) sont recalculées et mises à jour en temps réel sur l'écran.

---

*Ce document doit être mis à jour après chaque modification majeure de la logique applicative.*
