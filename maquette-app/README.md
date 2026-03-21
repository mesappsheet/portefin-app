# Maquette Fonctionnelle - Guide d'utilisation

Cette application combine les 21 fichiers HTML de conception en une seule interface interactive.

## Comment lancer la maquette ?

Pour des raisons de sécurité, les navigateurs (Chrome, Edge) bloquent le chargement de fichiers locaux via `fetch`. Vous devez donc lancer la maquette via un mini-serveur local.

### Option 1 : Utiliser "Live Server" (VS Code)
Si vous utilisez VS Code, faites un clic droit sur `index.html` et choisissez **"Open with Live Server"**.

### Option 2 : Utiliser Terminal / Node.js
Ouvrez un terminal dans ce dossier et tapez :
```bash
npx serve .
```

### Option 3 : Utiliser Python
```bash
python -m http.server 8000
```
Puis allez sur `http://localhost:8000`

## Fonctionnalités incluses
- **Navigation latérale** : Passez d'un module à l'autre (Dashboard, Prospection, Crédits).
- **Sélecteur d'écrans** : Dans la barre latérale, la liste de tous les fichiers HTML du module s'affiche pour vous permettre de naviguer dans les détails.
- **Support des Modales** : Les formulaires d'ajout s'ouvrent au-dessus de la page actuelle.
- **Interactivité de base** : Les cartes du dashboard "Prospection" et "Crédits" vous redirigent automatiquement vers les bons modules.

## Structure
- `index.html` : La coque (Shell) de l'application.
- `app.js` : Le moteur qui charge les maquettes et gère l'interactivité.
