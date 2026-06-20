// ─── HELPER : réponse JSON (CORS-friendly) ───────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── POST : Créer ou mettre à jour un contact ou une tâche ─
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ─── ACTION : CREER UNE TACHE (TASKS + CALENDAR) ──────────
    if (data.action === 'create_task') {
      const title = data.title || 'Nouvelle tâche';
      const notes = data.notes || '';
      const dueDateStr = data.dueDate; // format YYYY-MM-DD
      const dueTimeStr = data.dueTime; // format HH:MM

      let results = { calendar: 'Non créé', tasks: 'Non créée' };

      // 1. Google Tasks
      try {
        let taskListId = '@default';
        let taskExists = false;
        let existingTask = null;
        
        // Vérification des doublons dans Tasks
        const tasksResponse = Tasks.Tasks.list(taskListId);
        if (tasksResponse.items) {
          for (let i = 0; i < tasksResponse.items.length; i++) {
            const t = tasksResponse.items[i];
            if (t.title === title && t.status !== 'completed') {
              taskExists = true;
              existingTask = t;
              break;
            }
          }
        }

        if (!taskExists) {
          let task = { title: title, notes: notes };
          if (dueDateStr) {
            task.due = dueTimeStr ? (dueDateStr + "T" + dueTimeStr + ":00.000Z") : (dueDateStr + "T00:00:00.000Z");
          }
          Tasks.Tasks.insert(task, taskListId);
          results.tasks = 'Créée avec succès';
        } else {
          existingTask.notes = notes;
          if (dueDateStr) {
            existingTask.due = dueTimeStr ? (dueDateStr + "T" + dueTimeStr + ":00.000Z") : (dueDateStr + "T00:00:00.000Z");
          } else {
            existingTask.due = null;
          }
          Tasks.Tasks.update(existingTask, taskListId, existingTask.id);
          results.tasks = 'Mise à jour avec succès';
        }
      } catch (errTasks) {
        results.tasks = 'Erreur: ' + errTasks.toString();
        console.warn("Erreur Google Tasks : " + errTasks.toString());
      }

      // 2. Google Agenda (Calendar)
      try {
        const calendar = CalendarApp.getDefaultCalendar();
        let targetDate = new Date();
        let isAllDay = true;
        let endDate = null;

        if (dueDateStr) {
          if (dueTimeStr) {
            targetDate = new Date(dueDateStr + 'T' + dueTimeStr + ':00');
            endDate = new Date(targetDate.getTime() + 60 * 60 * 1000); // 1h
            isAllDay = false;
          } else {
            const parts = dueDateStr.split('-');
            targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
          }
        }

        // Vérification des doublons dans Calendar (le jour même)
        const events = calendar.getEventsForDay(targetDate);
        let eventExists = false;
        let existingEvent = null;
        for (let i = 0; i < events.length; i++) {
          if (events[i].getTitle() === title) {
            eventExists = true;
            existingEvent = events[i];
            break;
          }
        }

        if (eventExists) {
          existingEvent.deleteEvent();
        }

        if (isAllDay) {
          calendar.createAllDayEvent(title, targetDate, { description: notes });
        } else {
          calendar.createEvent(title, targetDate, endDate, { description: notes });
        }
        results.calendar = eventExists ? 'Mise à jour avec succès' : 'Créé avec succès';
      } catch (errCal) {
        results.calendar = 'Erreur: ' + errCal.toString();
        console.warn("Erreur Google Agenda : " + errCal.toString());
      }

      return jsonResponse({ status: 'success', results: results });
    }

    // ─── ACTION PAR DEFAUT : CONTACTS ─────────────────────────
    const fullName = data.fullName || '';
    const phone  = data.phone  || '';
    const phone2 = data.phone2 || '';
    const phone3 = data.phone3 || '';
    const phone4 = data.phone4 || '';
    const phone5 = data.phone5 || '';
    const phone6 = data.phone6 || '';
    const email   = data.email   || '';
    const address = data.address || '';
    const notes   = data.notes   || '';

    if (!fullName) {
      return jsonResponse({ status: 'error', message: 'Le nom complet (fullName) est obligatoire.' });
    }

    // Séparation prénom / nom
    const nameParts  = fullName.trim().split(/\s+/);
    const givenName  = nameParts[0];
    const familyName = nameParts.slice(1).join(' ');

    // Construction de l'objet contact
    const contact = {
      names: [{ givenName: givenName, familyName: familyName }]
    };

    contact.emailAddresses = email ? [{ value: email, type: 'home' }] : [];

    const phoneNumbers = [];
    [phone, phone2, phone3, phone4, phone5, phone6].forEach((ph, index) => {
      if (ph) phoneNumbers.push({
        value: ph,
        type: index === 0 ? 'mobile' : index === 1 ? 'work' : 'other'
      });
    });
    contact.phoneNumbers = phoneNumbers;

    contact.addresses   = address ? [{ formattedValue: address, type: 'home' }] : [];
    contact.biographies = notes   ? [{ value: notes, contentType: 'TEXT_PLAIN' }] : [];

    // ── Détection doublon par numéro ───────────────────────
    let existingResourceName = null;
    let existingEtag         = null;
    let existingPhones       = [];
    const phonesToCheck = [phone, phone2, phone3, phone4, phone5, phone6].filter(p => p && p.trim() !== '');

    if (phonesToCheck.length > 0) {
      try {
        let pageToken  = null;
        let foundPerson = null;
        do {
          const response   = People.People.Connections.list('people/me', {
            personFields: 'names,phoneNumbers',
            pageSize: 1000,
            pageToken: pageToken
          });
          const connections = response.connections || [];
          foundPerson = connections.find(person => {
            const numbers = person.phoneNumbers || [];
            return numbers.some(n => phonesToCheck.some(p => {
              const normN = normalizePhoneForCompare(n.value);
              const normP = normalizePhoneForCompare(p);
              return normN && normN === normP;
            }));
          });
          if (foundPerson) {
            existingResourceName = foundPerson.resourceName;
            existingEtag         = foundPerson.etag;
            existingPhones       = foundPerson.phoneNumbers || [];
            break;
          }
          pageToken = response.nextPageToken;
        } while (pageToken);
      } catch (err) {
        console.warn('Recherche de doublon impossible : ' + err.toString());
      }
    }

    // ── Créer ou mettre à jour ─────────────────────────────
    let resultContact;
    let isUpdate = false;

    if (existingResourceName) {
      contact.etag = existingEtag;
      
      // Fusionner les numéros pour ne pas écraser les ajouts manuels
      const mergedPhones = existingPhones.slice();
      (contact.phoneNumbers || []).forEach(newPhone => {
        const normNew = normalizePhoneForCompare(newPhone.value);
        if (normNew) {
          const exists = mergedPhones.some(ep => normalizePhoneForCompare(ep.value) === normNew);
          if (!exists) mergedPhones.push(newPhone);
        }
      });
      contact.phoneNumbers = mergedPhones;

      resultContact = People.People.updateContact(contact, existingResourceName, {
        updatePersonFields: 'names,emailAddresses,phoneNumbers,addresses,biographies'
      });
      isUpdate = true;
    } else {
      resultContact = People.People.createContact(contact);
    }

    const resourceName = resultContact.resourceName;
    const contactId    = resourceName.split('/')[1];
    const contactUrl   = 'https://contacts.google.com/person/' + contactId;

    // Ajouter au groupe "PorteFin Prospects"
    try {
      const groupResourceName = getOrCreateGroup('PorteFin Prospects');
      People.ContactGroups.Members.modify(
        { resourceNamesToAdd: [resourceName] },
        groupResourceName
      );
    } catch (groupError) {
      console.warn("Erreur d'ajout au groupe : " + groupError.toString());
    }

    return jsonResponse({ status: 'success', contactId, contactUrl, isUpdate });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ─── GET : Recherche de contacts / ping ──────────────────
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    if (action === 'search') {
      const query = ((e.parameter.query || '').toLowerCase().trim());
      const response    = People.People.Connections.list('people/me', {
        personFields: 'names,phoneNumbers,emailAddresses,addresses',
        pageSize: 1000
      });
      const connections = response.connections || [];
      const results = connections.map(person => {
        const nameObj  = (person.names || [])[0] || {};
        const fullName = nameObj.displayName || '';
        const emails   = (person.emailAddresses || []).map(em => em.value);
        const phones   = (person.phoneNumbers   || []).map(ph => ph.value);
        const addresses= (person.addresses      || []).map(ad => ad.formattedValue);
        return { fullName, email: emails[0] || '', phones, address: addresses[0] || '' };
      }).filter(contact => {
        if (!query) return true;
        return contact.fullName.toLowerCase().indexOf(query) !== -1 ||
               contact.phones.some(p => p.indexOf(query) !== -1);
      });

      return jsonResponse({ status: 'success', contacts: results });
    }

    return jsonResponse({ status: 'active', message: 'Service PorteFin Google Contacts actif.' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ─── Groupe de contacts ───────────────────────────────────
function getOrCreateGroup(groupName) {
  const response = People.ContactGroups.list();
  const groups   = response.contactGroups || [];
  const existing = groups.find(g => g.formattedName === groupName);
  if (existing) return existing.resourceName;
  const newGroup = People.ContactGroups.create({ contactGroup: { name: groupName } });
  return newGroup.resourceName;
}

// ─── Normalisation des numéros de téléphone ──────────────
function normalizePhoneForCompare(num) {
  if (!num) return '';
  var c = num.replace(/\D/g, '');
  if (c.indexOf('00229') === 0 && c.length > 5) c = c.substring(5);
  else if (c.indexOf('229') === 0 && c.length > 3) c = c.substring(3);
  else if (c.indexOf('00225') === 0 && c.length > 5) c = c.substring(5);
  else if (c.indexOf('225') === 0 && c.length > 3) c = c.substring(3);
  if (c.length === 10 && c.indexOf('01') === 0) c = c.substring(2);
  return c;
}
