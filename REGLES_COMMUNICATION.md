# Règles de Fonctionnement des Boutons Messages (WhatsApp & SMS)

Ce document détaille la logique implémentée pour la gestion des communications dans l'application Portfolio Management.

## 1. Cartographie Écran ➔ Catégorie
Le système détecte l'écran actuel (`currentScreen`) et lui associe une catégorie de modèles définie dans la table `communication_models` de Supabase.

| Écran ID | Nom de l'Écran | Catégorie de Modèle |
| :--- | :--- | :--- |
| `prospection_list` | Liste des Prospects | **Prospection** |
| `credits_clients` | Liste des Dossiers Client | **Crédit** |
| `credits_progress` | Suivi des Remboursements | **Suivi** |
| `credits_end_term` | Fin d'échéance | **Échéance** |
| `credits_settled` | Dossiers Soldés | **Soldé** |

## 2. Logique de Sélection du Modèle
Lors du clic sur le bouton WhatsApp ou SMS :
1.  Le code récupère la catégorie associée à l'écran actif.
2.  Il interroge Supabase pour trouver le **premier modèle** qui remplit ces conditions :
    *   `active` = `true` 
    *   `type` = `WhatsApp` (ou `SMS`)
    *   `category` = La catégorie détectée (ex: "Suivi")

> [!IMPORTANT]
> Si aucun modèle n'est coché comme **Actif** pour cette catégorie précise, une alerte s'affichera pour inviter l'utilisateur à l'activer dans les paramètres.

## 3. Remplacement des Variables (Tags)
Le système remplace dynamiquement les balises suivantes dans le corps du message :

| Balise | Donnée Source | Exemple de résultat |
| :--- | :--- | :--- |
| `{{Nom}}` ou `{{Nom du Client}}` | Nom complet du client/prospect | Jean Kouassi |
| `{{Montant}}` ou `{{Capital}}` | Montant du crédit | 5 000 000 |
| `{{Date}}` ou `{{Date d'Échéance}}` | Date de fin d'échéance | 12/10/2023 |
| `{{ID}}` ou `{{Id_Dossier}}` | 8 premiers caractères de l'ID | A1B2C3D4 |
| `{{Activité}}` | Secteur d'activité (Prospects) | Commerce |

## 4. Flux d'Action (Workflow)
1.  **Clic** : L'utilisateur clique sur l'icône WhatsApp/SMS.
2.  **Préparation** : Le script récupère les données du dossier (ID, Téléphone, Nom).
3.  **Fetch** : Récupération du modèle actif depuis Supabase.
4.  **Fusion** : Remplacement des balises par les données réelles.
5.  **Confirmation** : Une boîte de dialogue s'affiche avec un **aperçu du message**.
6.  **Envoi** :
    *   **WhatsApp** : Ouvre `https://wa.me/` avec le texte pré-rempli.
    *   **SMS** : Ouvre l'application de messagerie par défaut du système (`sms:`).

---
*Dernière mise à jour : 20 Mars 2026*
