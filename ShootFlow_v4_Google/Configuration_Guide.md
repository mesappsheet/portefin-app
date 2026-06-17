# Guide de Configuration : ShootFlow v4.0 (Google Native)

Ce guide vous explique comment déployer le workflow ShootFlow v4.0 en utilisant uniquement l'écosystème Google.

## 1. Google Cloud Platform (GCP)
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un nouveau projet (ex: `ShootFlow-Project`).
3. **Activez les APIs :**
   - Vertex AI API
   - Google Drive API
   - Google Sheets API
4. **Permissions :**
   - Assurez-vous que votre compte a le rôle "Vertex AI User".
5. Notez votre **ID de Projet**.

## 2. Google Drive & Sheets
1. Créez un dossier `/A-traiter/` sur votre Drive. Notez son ID (dans l'URL).
2. Créez un dossier `/Livrables/` sur votre Drive. Notez son ID.
3. Créez une Google Sheet nommée `ShootFlow_Log`. Notez son nom ou l'ID du fichier.

## 3. Google Apps Script
1. Ouvrez votre Google Sheet.
2. Menu **Extensions > Apps Script**.
3. Copiez le contenu de `Code.gs` dans l'éditeur.
4. **Configuration :** Modifiez les valeurs dans l'objet `CONFIG` au début du script avec vos IDs.
5. **App.json (Manifest) :**
   Pour utiliser Imagen 3 et Veo, vous devez ajouter les scopes OAuth nécessaires dans `appsscript.json` (Vue > Afficher le fichier manifeste) :
   ```json
   {
     "oauthScopes": [
       "https://www.googleapis.com/auth/cloud-platform",
       "https://www.googleapis.com/auth/drive",
       "https://www.googleapis.com/auth/spreadsheets"
     ]
   }
   ```
6. Enregistrez et cliquez sur "Exécuter" pour la fonction `executeShootFlow`.

## 4. AppSheet (Dashboard)
1. Dans votre Google Sheet, allez dans **Extensions > AppSheet > Créer une application**.
2. Personnalisez la vue pour afficher l'historique des générations.
3. Ajoutez des graphiques pour suivre l'utilisation.

---
**Note :** Google Veo et Imagen 3 peuvent être en accès restreint (Trusted Tester). Si l'API renvoie une erreur 403, vérifiez votre accès au programme "Vertex AI Generative AI" sur GCP.
