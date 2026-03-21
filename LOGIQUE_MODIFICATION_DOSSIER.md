# Logique de Modification de Dossier

Ce document détaille les règles métier et les procédures techniques appliquées lors de la modification d'un dossier de crédit existant.

---

## 1. Accès à la Modification
- **Interface :** La modification est accessible depuis l'écran "Détails du Crédit".
*   **Bouton :** Une icône "Édition" (pinceau/crayon) dans l'en-tête de la fiche client.
*   **Mode :** L'ouverture du formulaire "Nouveau Dossier" en mode édition pré-remplit tous les champs avec les données actuelles du dossier (`amount`, `start_date`, `end_date`, `type`, etc.).

---

## 2. Règles de Gestion des Données

### A. Informations Client
- Les modifications sur le nom, le téléphone ou l'activité sont répercutées dans la table `clients`.
- Si le dossier est lié à un prospect converti, le lien `client_id` est maintenu pour l'historique.

### B. Paramètres du Crédit
- **Montant :** Toute modification du montant total du crédit est autorisée tant que le dossier n'est pas "Soldé".
- **Dates (Début/Fin) :** La modification des dates entraîne une notification suggérant de régénérer l'échéancier pour rester cohérent avec la nouvelle période.

---

## 3. Impact sur l'Échéancier (Régénération Totale)

Lorsqu'un dossier est modifié, le système applique la règle de **remise à zéro** :

1.  **Réinitialisation complète :** Dès que les paramètres du dossier (montant, durée, mensualité) changent, l'échéantier existant est considéré comme obsolète.
2.  **Suppression des anciens états :** Toutes les échéances précédentes (qu'elles soient marquées comme **"Payé"**, **"En attente"** ou **"Reporté"**) sont supprimées du système pour ce dossier précis.
3.  **Recalcul immédiat :** Un nouvel échéancier est généré automatiquement sur la base des nouvelles conditions de crédit, repartant de l'échéance N°01.
4.  **Justification :** Cette approche garantit qu'aucune donnée asymétrique (anciens paiements sur un nouveau montant) ne pollue la comptabilité après une renégociation de dossier.

---

## 4. Flux de Sécurité et Expérience Utilisateur (UI/UX)

Pour éviter toute perte de données accidentelle et garantir un processus propre, la modification suit un protocole de sécurité en plusieurs étapes :

### Étape 1 : Alerte et Choix de l'Utilisateur
- Dès le clic sur **"Modifier"**, une boîte de dialogue contextuelle s'affiche.
- **Message :** *"⚠️ Attention : Modifier ce dossier supprimera TOUT son historique actuel (Échéances, Paiements, Notes, Documents). Voulez-vous continuer ?"*
- Si l'utilisateur refuse, l'opération est immédiatement interrompue.

### Étape 2 : Verrouillage (Formulaire Grisé)
- Si l'utilisateur accepte, le formulaire de saisie s'ouvre, mais **tous les champs sont grisés** (attribut `disabled`).
- Un indicateur visuel (ex: *"⌛ Suppression des anciennes données en cours..."*) informe l'utilisateur que le système travaille en arrière-plan.

### Étape 3 : Nettoyage Réel (Supabase)
- Le système supprime d'abord les dépendances (échéances, notes, documents).
- Il supprime ensuite le crédit et la fiche client.
- **Cette phase est irréversible.**

### Étape 4 : Déverrouillage et Pré-remplissage
- Une fois la suppression confirmée par la base de données, un second message s'affiche : *"✅ Données nettoyées. Vous pouvez maintenant modifier les informations."*
- **Libération :** Le formulaire devient disponible (champs dégrisés).
- Les anciennes valeurs sont injectées dans les champs pour permettre une correction rapide avant un nouvel enregistrement propre.

---

## 5. Flux Technique Final
1.  `Confirm 1` ➔ `Open Modal` ➔ `Disable Inputs`
2.  `CASCADE DELETE` (Repayments ➔ Notes ➔ Docs ➔ Credit ➔ Client)
3.  `Confirm 2` ➔ `Inject Values` ➔ `Enable Inputs`
4.  `User Save` ➔ `INSERT NEW DOSSIER`

---

*Dernière mise à jour : 18 Mars 2026*
