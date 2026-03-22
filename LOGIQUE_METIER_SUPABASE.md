# Logique Métier & Structure Supabase — PorteFin (V2)

Ce document décrit la logique métier, les règles d'échéancier et la structure Supabase de l'application PorteFin.

---

## 1. Schéma de Données

### Table : `profiles`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | PK, référence `auth.users` |
| `full_name` | text | Nom de l'agent |
| `role` | text | `admin` ou `manager` |

### Table : `prospects`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | PK |
| `manager_id` | uuid | Référence `profiles.id` |
| `full_name` | text | Obligatoire |
| `email` | text | Optionnel |
| `phone` | text | Optionnel |
| `phone2` | text | Optionnel |
| `activity` | text | Secteur d'activité |
| `address` | text | Adresse |
| `neighborhood` | text | Quartier / zone |
| `status` | text | `NOUVEAU`, `CONVERTI`, etc. |
| `created_at` | timestamptz | Auto |

### Table : `credits`
| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | PK |
| `manager_id` | uuid | Référence `profiles.id` |
| `client_id` | uuid | FK optionnel vers `clients.id` (nul si importé) |
| `client_name` | text | Nom texte (importation directe) |
| `amount` | numeric | Montant total du crédit |
| `start_date` | date | Date de déblocage |
| `end_date` | date | Date de fin d'échéance finale |
| `status` | text | `EN COURS`, `SOLDÉ`, `IMPAYÉ` |
| `health` | text | `SAIN`, `SOUFFRANCE` |
| `type` | text | `Consommation`, `Immobilier`, `Professionnel` |
| `phone` | text | Téléphone (crédits importés) |
| `email` | text | Email |
| `address` | text | Adresse |
| `activity` | text | Secteur d'activité |

### Table : `repayments` (Échéancier)
| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | PK |
| `credit_id` | uuid | FK vers `credits.id` |
| `installment_number` | integer | Numéro d'ordre (1, 2, 3…) |
| `scheduled_date` | date | Date d'échéance prévue (jamais un weekend) |
| `amount` | numeric | Montant (peut être null = non défini) |
| `status` | text | `En attente`, `Payé` |
| `is_paid` | boolean | `false` par défaut |
| `actual_payment_date` | date | Date réelle d'encaissement |
| `is_reported` | boolean | `true` si l'échéance a été reportée |
| `report_reason` | text | Motif du report (optionnel) |

---

## 2. Règles Métier de l'Échéancier

### 2.1 Génération automatique des dates

L'échéancier est généré à la création d'un crédit (formulaire ou import). Les règles sont les suivantes :

**Déclencheur :** Toujours à partir de `start_date` (date de déblocage).

**Rythme :** Mensuel — une échéance par mois, le même jour du mois que `start_date`, à partir du mois suivant.

**Exemple :**
- `start_date = 2026-01-22` → Échéances : 22 fév, 22 mars, 22 avr, 24 mai (lundi car 22 = samedi), 22 juin…

**Limite :** Arrêt quand la date dépasse `end_date` (tolérance de +15 jours). Maximum absolu : 120 échéances (10 ans).

### 2.2 Règle anti-weekend (OBLIGATOIRE)

> **Toute date d'échéance tombant un Samedi ou un Dimanche doit être automatiquement reportée au Lundi suivant.**

Cette règle s'applique dans tous les contextes :

| Contexte | Fichier | État |
|----------|---------|------|
| Import Excel (CreditModule) | `scripts/import/CreditModule.js` | ✅ |
| Génération manuelle (formulaire crédit) | `MAQUETTE_COMPLETE.html` — `handleGenerateSchedule()` | ✅ |
| Report manuel d'une échéance | `MAQUETTE_COMPLETE.html` — `handleSaveReport()` | ✅ |

Fonction utilitaire globale disponible dans `MAQUETTE_COMPLETE.html` :
```javascript
function skipWeekend(date) {
    const d = new Date(date);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Samedi → Lundi
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Dimanche → Lundi
    return d;
}
```

### 2.3 Report d'échéance manuel

Un agent peut reporter une échéance à une nouvelle date (ex : jour férié non planifié, annoncé officiellement).

**Règles du report :**
1. La nouvelle date est choisie via un calendrier (input date)
2. Si la date choisie est un **Samedi ou Dimanche**, elle est automatiquement décalée au **Lundi suivant** (règle 2.2)
3. Un avertissement est affiché en temps réel si un weekend est détecté
4. Le champ `is_reported = true` est enregistré dans `repayments`
5. Le motif du report est optionnel (`report_reason`)
6. Une fois reportée, l'échéance affiche un badge **"Reporté"** dans l'échéancier

**Persistance :** Le nouveau `scheduled_date` est mis à jour directement dans la table `repayments`.

### 2.4 Montant des échéances

Par conception, le montant par mensualité (`amount`) est `null` dans la table `repayments`. L'agent saisit ou constate le montant réel à chaque encaissement. Cela reflète la réalité terrain où les remboursements partiels sont courants.

---

## 3. Règles d'Import Excel

### 3.1 Colonnes acceptées

**Crédits (`CreditModule`):**
| Colonne Excel | Champ DB | Obligatoire |
|--------------|----------|-------------|
| `Nom du Client` ou `Nom` | `client_name` | ✅ |
| `Date de Déblocage` | `start_date` | ✅ |
| `Fin Échéance` | `end_date` | ✅ |
| `Montant Total` ou `Montant` | `amount` | ✅ |
| `Téléphone` ou `Mobile` | `phone` | ❌ optionnel |
| `Email` | `email` | ❌ |
| `Secteur d'activité` | `activity` | ❌ |
| `Adresse domicile` | `address` | ❌ |
| `Type de Prêt` | `type` | ❌ (défaut: Consommation) |

**Prospects (`ProspectionModule`):**
| Colonne Excel | Champ DB | Obligatoire |
|--------------|----------|-------------|
| `Nom complet` ou `Nom` | `full_name` | ✅ |
| `Téléphone` ou `Mobile` | `phone` | ❌ |
| `Email` ou `E-mail` | `email` | ❌ |
| `Secteur d'activité` | `activity` | ❌ |
| `Téléphone 2` | `phone2` | ❌ |
| `Adresse` | `address` | ❌ |
| `Quartier` ou `Zone` | `neighborhood` | ❌ |
| `Gestionnaire` | `assigned_manager` | ❌ |

### 3.2 Formats de date acceptés

- `JJ-MM-AAAA` (ex: `22-03-2026`)
- `J-MM-AAAA` (ex: `5-03-2026`)
- `JJ/MM/AAAA` (ex: `22/03/2026`)
- `AAAA-MM-JJ` (format ISO, ex: `2026-03-22`)
- Date sérielle Excel (convertie automatiquement par SheetJS)

> **Important :** Le système utilise l'heure locale (pas UTC) pour éviter le décalage de -1 jour dû au fuseau horaire.

### 3.3 Gestion des doublons

La détection de doublon est basée sur les champs de conflit :
- Crédits : `client_name + amount + start_date`
- Prospects : `full_name`

Si un doublon est détecté, les données sont **mises à jour** (upsert) et un badge `DOUBLON` apparaît dans le rapport d'import.

### 3.4 Génération de l'échéancier à l'import

Pour chaque crédit importé valide :
1. L'échéancier est calculé via `CreditModule.generateSchedule()` — règle anti-weekend incluse
2. Les échéances existantes non payées sont supprimées
3. Le nouvel échéancier est inséré dans `repayments`

---

## 4. Visibilité et Rôles (RLS Supabase)

| Rôle | Prospects | Crédits | Repayments |
|------|-----------|---------|------------|
| **Admin** | Tous | Tous | Tous |
| **Manager** | Les siens (`manager_id`) | Les siens (`manager_id`) | Via ses crédits |

---

## 5. Statuts des Crédits

| Valeur DB | Signification | Source |
|-----------|---------------|--------|
| `EN COURS` | Crédit actif en remboursement | Défaut à la création |
| `SOLDÉ` | Crédit entièrement remboursé | Mise à jour manuelle |
| `IMPAYÉ` | Échéance(s) dépassée(s) | Indicateur calculé |
| `SOUFFRANCE` | Crédit en difficulté (`health = SOUFFRANCE`) | Mise à jour manuelle |

---

## 6. Indicateurs Dashboard

| Indicateur | Source | Règle |
|-----------|--------|-------|
| Remboursements du Jour | `repayments.scheduled_date = today` | Nombre de clients à rembourser ce jour |
| Fins d'Échéance du Mois | `credits.end_date` dans le mois | Statut ≠ SOLDÉ |
| Impayés | `repayments.scheduled_date < today AND is_paid = false` | Dédoublonnage par client |
| En Souffrance | `credits.health = SOUFFRANCE` | Statut ≠ SOLDÉ |
| Crédits Actifs | `credits.status = EN COURS` | Somme des montants |
