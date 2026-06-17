/**
 * Google Apps Script - Synchronisation Google Contacts pour PorteFin
 * 
 * Instructions de déploiement :
 * 1. Ouvrez https://script.google.com/
 * 2. Créez un nouveau projet nommé "PorteFin Contacts Sync"
 * 3. Collez ce code dans le fichier "Code.gs"
 * 4. Cliquez sur "Déployer" (bouton bleu en haut à droite) > "Nouveau déploiement"
 * 5. Sélectionnez le type : "Application Web"
 * 6. Configurez comme suit :
 *    - Description : Synchronisation de contacts PorteFin
 *    - Exécuter en tant que : "Moi" (votre adresse email)
 *    - Qui a accès : "Tout le monde" (indispensable pour l'appel API)
 * 7. Cliquez sur "Déployer", validez les autorisations d'accès à vos contacts Google.
 * 8. Copiez l'URL de l'application Web fournie (se terminant par /exec) et collez-la dans les paramètres de PorteFin.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const fullName = data.fullName || '';
    const phone = data.phone || '';
    const phone2 = data.phone2 || '';
    const email = data.email || '';
    const address = data.address || '';
    const notes = data.notes || '';

    if (!fullName) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'error', 
        message: 'Le nom complet (fullName) est obligatoire.' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Séparation simplifiée du prénom et du nom
    const nameParts = fullName.trim().split(/\s+/);
    const givenName = nameParts[0];
    const familyName = nameParts.slice(1).join(' ');

    // Création du contact via ContactsApp
    const contact = ContactsApp.createContact(givenName, familyName, email);

    if (phone) {
      contact.addPhone(ContactsApp.Field.MAIN_PHONE, phone);
    }
    if (phone2) {
      contact.addPhone(ContactsApp.Field.MOBILE_PHONE, phone2);
    }
    if (address) {
      contact.addAddress(ContactsApp.Field.HOME_ADDRESS, address);
    }
    if (notes) {
      contact.setNotes(notes);
    }

    // Ajouter un libellé/groupe "PorteFin Prospects" pour mieux les organiser
    let group = ContactsApp.getContactGroup('PorteFin Prospects');
    if (!group) {
      group = ContactsApp.createContactGroup('PorteFin Prospects');
    }
    contact.addToGroup(group);

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      contactId: contact.getId() 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Optionnel : Permet de tester que la Web App est fonctionnelle via navigateur
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'active', 
    message: 'Le service de synchronisation de contacts PorteFin est fonctionnel.' 
  })).setMimeType(ContentService.MimeType.JSON);
}
