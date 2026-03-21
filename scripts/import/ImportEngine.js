/**
 * Moteur d'import générique
 * Fournit des méthodes statiques pour traiter les fichiers et sauvegarder les données.
 */
class ImportEngine {
    /**
     * Lit un fichier Excel et retourne les résultats validés.
     * @param {File} file 
     * @param {Object} module Le plugin métier (CreditModule ou ProspectionModule)
     */
    static async processFile(file, module) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                    
                    const results = rawRows.map((row, index) => {
                        const mappedData = module.mapFields(row);
                        const errors = module.validate(mappedData);
                        const warnings = module.getWarnings ? module.getWarnings(mappedData) : [];
                        
                        let schedule = null;
                        if (errors.length === 0 && module.requiresSchedule()) {
                            schedule = module.generateSchedule(mappedData);
                        }

                        return {
                            rowNumber: index + 2,
                            data: mappedData,
                            errors: errors,
                            warnings: warnings,
                            isValid: errors.length === 0,
                            schedule: schedule
                        };
                    });
                    
                    resolve(results);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Sauvegarde les données validées dans Supabase avec gestion de doublons.
     */
    static async saveToSupabase(validRows, module, supabase, userId) {
        let stats = {
            inserted: 0,
            updated: 0,
            failed: 0,
            details: []
        };

        const tableName = module.getTableName();
        const conflictFields = module.getConflictFields();

        for (const row of validRows) {
            try {
                const payload = module.prepareForSupabase(row.data, userId);

                // 1. Explicit Check for Existing Record (Robustness)
                // This allows us to report "Duplicate detected - Keeping most recent data"
                let checkQuery = supabase.from(tableName).select('id').maybeSingle();
                conflictFields.forEach(f => {
                    if (payload[f]) checkQuery = checkQuery.eq(f, payload[f]);
                });
                
                const { data: existing } = await checkQuery;
                const isUpdate = !!existing;

                // 2. Perform Upsert
                // This will create or update, effectively keeping the data from the Excel file
                const { data, error } = await supabase
                    .from(tableName)
                    .upsert([payload], { onConflict: conflictFields.join(',') })
                    .select();

                if (error) throw error;
                if (!data || data.length === 0) throw new Error("Erreur lors de la sauvegarde du dossier.");
                
                const record = data[0];
                
                if (isUpdate) stats.updated++;
                else stats.inserted++;

                // 3. Handle specific module logic (like repayment schedules for credits)
                if (module.requiresSchedule() && row.schedule) {
                    // Always clear previous pending schedule for this folder to avoid overlaps
                    await supabase
                        .from('repayments')
                        .delete()
                        .eq('credit_id', record.id)
                        .eq('is_paid', false);

                    // Insert the new schedule generated from the current data
                    const scheduleToInsert = row.schedule.map(s => ({
                        credit_id: record.id,
                        installment_number: s.installment_number,
                        scheduled_date: s.scheduled_date,
                        amount: null,
                        status: 'En attente',
                        is_paid: false
                    }));

                    const { error: sError } = await supabase
                        .from('repayments')
                        .insert(scheduleToInsert);
                    
                    if (sError) console.error("Error inserting schedule for record", record.id, sError);
                }

                stats.details.push({
                    name: row.data.client_name || row.data.full_name || "Dossier #" + (record.id.substring(0,8)),
                    status: isUpdate ? 'DOUBLON (Données récentes conservées)' : 'SUCCÈS (Nouveau dossier)',
                    type: isUpdate ? 'warning' : 'success'
                });

            } catch (err) {
                console.error("Row save error:", err);
                stats.failed++;
                stats.details.push({
                    name: row.data.client_name || row.data.full_name || "Ligne",
                    status: 'ERREUR: ' + (err.message || 'Problème de base de données'),
                    type: 'error'
                });
            }
        }

        return { 
            success: true, 
            inserted: stats.inserted, 
            updated: stats.updated, 
            failed: stats.failed,
            report: stats.details
        };
    }

    /**
     * Télécharge un modèle Excel vide basé sur le module.
     */
    static downloadTemplate(module) {
        const fields = module.constructor.getTemplateFields();
        const worksheet = XLSX.utils.json_to_sheet([fields]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modele d'import");
        XLSX.writeFile(workbook, `Modele_Import_${module.getTableName()}_v3.xlsx`);
    }
}
