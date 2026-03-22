/**
 * Module Crédit : Règles ajustées pour l'import simplifié.
 */
/**
 * Convertit un objet Date en chaîne AAAA-MM-JJ en heure locale (évite le décalage UTC).
 */
function toLocalDateStr(date) {
    if (!date || isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Interprète une date au format J-MM-AAAA, JJ-MM-AAAA, J/MM/AAAA, ou AAAA-MM-JJ.
 * Retourne un objet Date valide, ou null.
 */
function parseImportDate(value) {
    if (!value) return null;

    // Si c'est déjà un objet Date (Excel sériel converti par SheetJS)
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

    const str = String(value).trim();

    // Format JJ-MM-AAAA ou J-MM-AAAA (séparateur - ou /)
    const dmyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return isNaN(date.getTime()) ? null : date;
    }

    // Format ISO AAAA-MM-JJ
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        const date = new Date(Number(y), Number(m) - 1, Number(d));
        return isNaN(date.getTime()) ? null : date;
    }

    return null;
}

class CreditModule {
    getTableName() { return 'credits'; }

    getConflictFields() {
        return ['client_name', 'amount', 'start_date'];
    }

    /**
     * Définit le mapping entre les colonnes Excel et les champs métier.
     */
    mapFields(row) {
        return {
            client_name: row["Nom du Client"] || row["Nom"] || "",
            amount: parseFloat(row["Montant Total"] || row["Montant"] || 0),
            start_date: parseImportDate(row["Date de Déblocage"]) || new Date(),
            end_date: parseImportDate(row["Fin Échéance"]),
            address: row["Adresse domicile"] || "",
            loan_type: row["Type de Prêt"] || "Consommation",
            phone: row["Téléphone"] || row["Mobile"] || "",
            activity: row["Secteur d'activité"] || row["Activité"] || "",
            email: row["Email"] || ""
        };
    }

    /**
     * Valide les données métier d'un crédit.
     */
    validate(data) {
        let errors = [];
        if (!data.client_name) errors.push("Le nom du client est obligatoire.");
        if (isNaN(data.amount) || data.amount <= 0) errors.push("Le montant total est invalide.");
        if (isNaN(data.start_date.getTime())) errors.push("La date de déblocage est invalide.");
        if (!data.end_date || isNaN(data.end_date.getTime())) errors.push("La date de fin d'échéance est obligatoire.");
        if (data.start_date >= data.end_date) errors.push("La date de fin doit être après la date de début.");
        // Téléphone facultatif
        return errors;
    }

    /**
     * Prépare l'objet pour l'insertion dans Supabase (table credits).
     */
    prepareForSupabase(data, userId) {
        return {
            client_name: data.client_name,
            amount: data.amount,
            start_date: toLocalDateStr(data.start_date),
            end_date: toLocalDateStr(data.end_date),
            status: 'EN COURS',
            health: 'SAIN',
            manager_id: userId,
            type: data.loan_type || 'Consommation',
            phone: data.phone,
            activity: data.activity,
            email: data.email || null,
            address: data.address || null
        };
    }

    requiresSchedule() {
        return true;
    }

    /**
     * Génère l'échéancier basé sur l'intervalle de dates.
     * Pas de montant par mensualité comme demandé.
     */
    generateSchedule(data) {
        let schedule = [];
        const start = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        
        // Mémoriser le jour cible (ex: le 02 du mois) pour rester stable sur toute la durée
        const targetDay = start.getDate();
        const startMonth = start.getMonth();
        const startYear = start.getFullYear();
        
        let monthCount = 1;

        while (true) {
            // Création stable du mois suivant : Année, Mois + Offset, Jour
            let currentDueDate = new Date(startYear, startMonth + monthCount, targetDay);
            
            // Sécurité pour les mois courts (ex: Jan 31 -> Fév 31 devient Mars 03 en JS)
            // On ramène au dernier jour du mois si débordement.
            if (currentDueDate.getDate() !== targetDay) {
                currentDueDate.setDate(0); 
            }
            
            // Si on a dépassé la date de fin de plus de 15 jours, on arrête
            if (currentDueDate > new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)) break;
            
            // Appliquer la règle anti-weekend sur une COPIE pour ne pas déshabituer le calcul du mois suivant
            let adjustedDate = (typeof window !== 'undefined' && window.skipWeekend)
                ? window.skipWeekend(new Date(currentDueDate))
                : (() => {
                    const d = new Date(currentDueDate);
                    const day = d.getDay();
                    if (day === 6) d.setDate(d.getDate() + 2); // Samedi -> Lundi
                    else if (day === 0) d.setDate(d.getDate() + 1); // Dimanche -> Lundi
                    return d;
                })();

            schedule.push({
                installment_number: monthCount,
                scheduled_date: toLocalDateStr(adjustedDate),
                amount: null,
                status: "En attente"
            });

            // Condition d'arrêt
            if (monthCount > 120 || currentDueDate >= endDate) break;
            
            monthCount++;
        }
        return schedule;
    }

    /**
     * Retourne les champs pour le téléchargement du modèle Excel.
     * Version 2.0.5 - Colonnes ajustées selon demande.
     */
    static getTemplateFields() {
        return {
            "Nom du Client": "JEAN KOUASSI",
            "Téléphone": "+225 07070707",
            "Email": "jean.kouassi@example.com",
            "Secteur d'activité": "Commerce",
            "Montant Total": 1000000,
            "Date de Déblocage": "2024-03-01",
            "Fin Échéance": "2024-09-01",
            "Adresse domicile": "Abidjan, Cocody",
            "Type de Prêt": "Consommation"
        };
    }
}
// Version Info: 2.0.5
console.log("CreditModule.js loaded v2.0.5");
