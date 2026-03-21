/**
 * Module Prospection : Validation souple pour les nouveaux prospects.
 */
class ProspectionModule {
    getTableName() { return 'prospects'; }

    getConflictFields() {
        return ['full_name'];
    }

    /**
     * @param {Object} row 
     */
    mapFields(row) {
        return {
            full_name: row["Nom complet"] || row["Nom"] || "",
            email: row["Email"] || row["E-mail"] || "",
            phone: row["Téléphone"] || row["Mobile"] || "",
            phone2: row["Téléphone 2"] || "",
            activity: row["Secteur d'activité"] || row["Activité"] || "",
            address: row["Adresse"] || "",
            neighborhood: row["Quartier"] || row["Zone"] || "",
            status: "NOUVEAU",
            assigned_manager: row["Gestionnaire"] || row["Conseiller"] || ""
        };
    }

    /**
     * @param {Object} data 
     */
    validate(data) {
        let errors = [];
        if (!data.full_name) errors.push("Le nom complet est obligatoire.");
        // Téléphone facultatif
        return errors;
    }

    /**
     * Prépare l'objet pour l'insertion dans Supabase.
     */
    prepareForSupabase(data, userId) {
        return {
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone,
            phone2: data.phone2,
            activity: data.activity,
            address: data.address,
            neighborhood: data.neighborhood,
            status: 'NOUVEAU',
            manager_id: userId
        };
    }

    /**
     * Indique si un échéancier est requis.
     */
    requiresSchedule() {
        return false;
    }

    /**
     * Retourne les champs pour le téléchargement du modèle.
     */
    static getTemplateFields() {
        return {
            "Nom complet": "ALBERT TRAORE",
            "Téléphone": "+225 01020304",
            "Email": "albert.traore@example.com",
            "Secteur d'activité": "Agriculture",
            "Téléphone 2": "",
            "Adresse": "Bouaké",
            "Quartier": "Air France",
            "Gestionnaire": "agent@example.com"
        };
    }
}
// Version Info: 2.0.5
console.log("ProspectionModule.js loaded v2.0.5");
