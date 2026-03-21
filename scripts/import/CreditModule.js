/**
 * Module Crédit : Règles ajustées pour l'import simplifié.
 */
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
            start_date: row["Date de Déblocage"] ? new Date(row["Date de Déblocage"]) : new Date(),
            end_date: row["Fin Échéance"] ? new Date(row["Fin Échéance"]) : null,
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
            start_date: data.start_date.toISOString().split('T')[0],
            end_date: data.end_date.toISOString().split('T')[0],
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
        let startDate = new Date(data.start_date);
        let endDate = new Date(data.end_date);
        
        // On commence à M+1
        let currentDueDate = new Date(startDate);
        let monthCount = 1;

        while (true) {
            currentDueDate.setMonth(currentDueDate.getMonth() + 1);
            
            // Si on a dépassé la date de fin de plus de 15 jours, on arrête
            if (currentDueDate > new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000)) break;
            
            let adjustedDate = new Date(currentDueDate);
            const dayOfWeek = adjustedDate.getDay();
            if (dayOfWeek === 6) adjustedDate.setDate(adjustedDate.getDate() + 2); // Samedi -> Lundi
            else if (dayOfWeek === 0) adjustedDate.setDate(adjustedDate.getDate() + 1); // Dimanche -> Lundi

            schedule.push({
                installment_number: monthCount,
                scheduled_date: adjustedDate.toISOString().split('T')[0],
                amount: null, // Pas de montant affiché
                status: "En attente"
            });

            monthCount++;
            // Sécurité pour éviter les boucles infinies ou échéanciers trop longs (> 10 ans)
            if (monthCount > 120 || adjustedDate >= endDate) break;
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
