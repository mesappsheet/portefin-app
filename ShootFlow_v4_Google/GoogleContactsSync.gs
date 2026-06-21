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
      const dueDateStr = data.dueDate; // format YYYY-MM-DD ou autre
      const dueTimeStr = data.dueTime; // format HH:MM
      const id = data.id || '';
      const status = data.status || '';

      let results = { calendar: 'Non créé', tasks: 'Non créée' };

      // Helper to format due date for Tasks API (RFC 3339 YYYY-MM-DDT00:00:00Z)
      const formattedTasksDue = (function(dStr) {
        if (!dStr) return null;
        var cleaned = dStr.trim();
        if (!cleaned) return null;

        // format DD/MM/YYYY
        if (cleaned.indexOf('/') !== -1) {
          var parts = cleaned.split('/');
          if (parts.length === 3) {
            var day = parts[0];
            var month = parts[1];
            var year = parts[2];
            if (day.length === 1) day = '0' + day;
            if (month.length === 1) month = '0' + month;
            return year + '-' + month + '-' + day + 'T00:00:00Z';
          }
        }

        // format YYYY-MM-DD
        if (cleaned.indexOf('-') !== -1) {
          var parts = cleaned.split('-');
          if (parts.length === 3) {
            var year = parts[0];
            var month = parts[1];
            var day = parts[2].split('T')[0];
            if (day.length === 1) day = '0' + day;
            if (month.length === 1) month = '0' + month;
            return year + '-' + month + '-' + day + 'T00:00:00Z';
          }
        }

        try {
          var d = new Date(cleaned);
          if (!isNaN(d.getTime())) {
            var year = d.getUTCFullYear();
            var month = d.getUTCMonth() + 1;
            var day = d.getUTCDate();
            if (month < 10) month = '0' + month;
            if (day < 10) day = '0' + day;
            return year + '-' + month + '-' + day + 'T00:00:00Z';
          }
        } catch(e) {}
        return null;
      })(dueDateStr);

      // Helper to parse target date details for Calendar
      const calDetails = (function(dStr, tStr) {
        var res = { date: new Date(), isAllDay: true, endDate: null, isValid: false };
        if (!dStr) return res;
        var cleaned = dStr.trim();
        if (!cleaned) return res;

        var year, month, day;
        if (cleaned.indexOf('/') !== -1) {
          var parts = cleaned.split('/');
          if (parts.length === 3) {
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            year = parseInt(parts[2], 10);
          }
        } else if (cleaned.indexOf('-') !== -1) {
          var parts = cleaned.split('-');
          if (parts.length === 3) {
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2].split('T')[0], 10);
          }
        }

        if (year && !isNaN(month) && day) {
          res.isValid = true;
          if (tStr && tStr.trim()) {
            var timeParts = tStr.trim().split(':');
            if (timeParts.length >= 2) {
              var hour = parseInt(timeParts[0], 10);
              var min = parseInt(timeParts[1], 10);
              res.date = new Date(year, month, day, hour, min, 0);
              res.endDate = new Date(res.date.getTime() + 60 * 60 * 1000); // 1h
              res.isAllDay = false;
            }
          }
          if (res.isAllDay) {
            res.date = new Date(year, month, day);
          }
        } else {
          try {
            var d = new Date(cleaned);
            if (!isNaN(d.getTime())) {
              res.date = d;
              res.isValid = true;
            }
          } catch(e) {}
        }
        return res;
      })(dueDateStr, dueTimeStr);

      // 1. Google Tasks
      var debugTaskPayload = {};
      try {
        let taskListId = '@default';
        let taskExists = false;
        let existingTask = null;
        
        // Vérification des doublons dans Tasks par ID unique d'abord
        const tasksResponse = Tasks.Tasks.list(taskListId, { showCompleted: true, showHidden: true });
        if (tasksResponse.items) {
          for (let i = 0; i < tasksResponse.items.length; i++) {
            const t = tasksResponse.items[i];
            const hasIdMatch = id && t.notes && t.notes.indexOf('[ID: ' + id + ']') !== -1;
            const hasTitleMatch = t.title === title && t.status !== 'completed';
            if (hasIdMatch || (!id && hasTitleMatch)) {
              taskExists = true;
              existingTask = t;
              break;
            }
          }
        }

        let cleanNotes = notes ? notes.replace(/\s*\[ID:\s*[^\]]+\]/, '') : '';
        let finalNotes = cleanNotes + (id ? '\n\n[ID: ' + id + ']' : '');

        if (!taskExists) {
          let task = { title: title };
          if (finalNotes) task.notes = finalNotes;
          if (formattedTasksDue) task.due = formattedTasksDue;
          if (status === 'done' || status === 'completed') task.status = 'completed';
          debugTaskPayload = task;
          Tasks.Tasks.insert(task, taskListId);
          results.tasks = 'Créée avec succès';
        } else {
          let updatedTask = {
            id: existingTask.id,
            title: title
          };
          if (finalNotes) updatedTask.notes = finalNotes;
          if (formattedTasksDue) updatedTask.due = formattedTasksDue;
          if (status === 'done' || status === 'completed') {
            updatedTask.status = 'completed';
          } else if (status === 'todo' || status === 'in_progress') {
            updatedTask.status = 'needsAction';
            updatedTask.completed = null;
          }
          debugTaskPayload = updatedTask;
          Tasks.Tasks.update(updatedTask, taskListId, existingTask.id);
          results.tasks = 'Mise à jour avec succès';
        }
      } catch (errTasks) {
        results.tasks = 'Erreur: ' + errTasks.toString() + ' (Payload: ' + JSON.stringify(debugTaskPayload) + ')';
        console.warn("Erreur Google Tasks : " + errTasks.toString());
      }

      // 2. Google Agenda (Calendar)
      try {
        const calendar = CalendarApp.getDefaultCalendar();
        let targetDate = calDetails.date;
        let isAllDay = calDetails.isAllDay;
        let endDate = calDetails.endDate;

        let eventExists = false;
        let existingEvent = null;

        // Rechercher l'événement existant par ID unique
        if (id) {
          var startSearch = new Date();
          startSearch.setDate(startSearch.getDate() - 60);
          var endSearch = new Date();
          endSearch.setDate(endSearch.getDate() + 365);
          const foundEvents = calendar.getEvents(startSearch, endSearch, { search: '[ID: ' + id + ']' });
          if (foundEvents && foundEvents.length > 0) {
            eventExists = true;
            existingEvent = foundEvents[0];
          }
        }

        // Fallback par titre si non trouvé par ID
        if (!eventExists && targetDate) {
          const events = calendar.getEventsForDay(targetDate);
          for (let i = 0; i < events.length; i++) {
            if (events[i].getTitle() === title || events[i].getTitle() === '✓ ' + title) {
              eventExists = true;
              existingEvent = events[i];
              break;
            }
          }
        }

        if (eventExists) {
          existingEvent.deleteEvent();
        }

        let cleanNotes = notes ? notes.replace(/\s*\[ID:\s*[^\]]+\]/, '') : '';
        let calDescription = cleanNotes + (id ? '\n\n[ID: ' + id + ']' : '');
        let finalTitle = (status === 'done' || status === 'completed') ? '✓ ' + title : title;

        if (isAllDay) {
          calendar.createAllDayEvent(finalTitle, targetDate, { description: calDescription });
        } else {
          calendar.createEvent(finalTitle, targetDate, endDate, { description: calDescription });
        }
        var dateInfoStr = targetDate ? (' (Le ' + targetDate.toLocaleDateString('fr-FR') + ')') : '';
        results.calendar = (eventExists ? 'Mise à jour avec succès' : 'Créé avec succès') + dateInfoStr;
      } catch (errCal) {
        results.calendar = 'Erreur: ' + errCal.toString();
        console.warn("Erreur Google Agenda : " + errCal.toString());
      }

      return jsonResponse({ status: 'success', results: results });
    }

    // ─── ACTION : TOGGLE STATUS DE TACHE (GOOGLE TASKS & AGENDA) ──
    if (data.action === 'toggle_task_status') {
      const id = data.id;
      const title = data.title;
      const status = data.status || 'needsAction'; // 'completed' ou 'needsAction'
      const taskListId = '@default';
      
      try {
        const tasksResponse = Tasks.Tasks.list(taskListId, { showCompleted: true, showHidden: true });
        let found = false;
        let taskId = null;
        if (tasksResponse.items) {
          for (let i = 0; i < tasksResponse.items.length; i++) {
            const t = tasksResponse.items[i];
            const hasIdMatch = id && t.notes && t.notes.indexOf('[ID: ' + id + ']') !== -1;
            const hasTitleMatch = t.title === title;
            if (hasIdMatch || (!id && hasTitleMatch)) {
              found = true;
              taskId = t.id;
              t.status = status;
              if (status === 'needsAction') {
                t.completed = null; // réactive la tâche
              }
              Tasks.Tasks.update(t, taskListId, taskId);
              break;
            }
          }
        }

        // Mettre à jour également Google Agenda !
        try {
          const calendar = CalendarApp.getDefaultCalendar();
          var startSearch = new Date();
          startSearch.setDate(startSearch.getDate() - 60);
          var endSearch = new Date();
          endSearch.setDate(endSearch.getDate() + 365);
          
          let foundEvent = null;
          if (id) {
            const foundEvents = calendar.getEvents(startSearch, endSearch, { search: '[ID: ' + id + ']' });
            if (foundEvents && foundEvents.length > 0) {
              foundEvent = foundEvents[0];
            }
          }
          if (!foundEvent) {
            const foundEvents = calendar.getEvents(startSearch, endSearch, { search: title });
            if (foundEvents && foundEvents.length > 0) {
              foundEvent = foundEvents.find(ev => ev.getTitle() === title || ev.getTitle() === '✓ ' + title);
            }
          }
          
          if (foundEvent) {
            let currentTitle = foundEvent.getTitle();
            const cleanTitle = currentTitle.replace(/^✓\s*/, '');
            const newTitle = (status === 'completed') ? '✓ ' + cleanTitle : cleanTitle;
            if (currentTitle !== newTitle) {
              foundEvent.setTitle(newTitle);
            }
          }
        } catch (calErr) {
          console.warn("Erreur mise à jour statut Agenda : " + calErr.toString());
        }

        if (found) {
          return jsonResponse({ status: 'success', message: 'Statut de la tâche mis à jour.', taskId: taskId });
        } else {
          if (status === 'completed') {
            let task = { 
              title: title, 
              status: 'completed',
              notes: (id ? '\n\n[ID: ' + id + ']' : '')
            };
            Tasks.Tasks.insert(task, taskListId);
            return jsonResponse({ status: 'success', message: 'Tâche créée et complétée.' });
          }
          return jsonResponse({ status: 'error', message: 'Tâche introuvable dans Google Tasks.' });
        }
      } catch (err) {
        return jsonResponse({ status: 'error', message: err.toString() });
      }
    }

    // ─── ACTION : LISTER LES TACHES (GOOGLE TASKS) ────────────
    if (data.action === 'list_tasks') {
      const taskListId = '@default';
      try {
        let tasks = [];
        let nextPageToken = null;
        do {
          const options = { showCompleted: true, showHidden: true, maxResults: 100 };
          if (nextPageToken) {
            options.pageToken = nextPageToken;
          }
          const response = Tasks.Tasks.list(taskListId, options);
          if (response.items) {
            tasks = tasks.concat(response.items);
          }
          nextPageToken = response.nextPageToken;
        } while (nextPageToken);

        const items = tasks.map(t => {
          let supabaseId = null;
          if (t.notes) {
            const m = t.notes.match(/\[ID:\s*([^\]]+)\]/);
            if (m) {
              supabaseId = m[1].trim();
            }
          }
          return {
            title: t.title,
            status: t.status, // 'completed' ou 'needsAction'
            updated: t.updated,
            supabase_id: supabaseId
          };
        });
        return jsonResponse({ status: 'success', tasks: items });
      } catch (err) {
        return jsonResponse({ status: 'error', message: err.toString() });
      }
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

    // ── Détection doublon par nom ou par numéro ────────────
    let existingResourceName = null;
    const phonesToCheck = [phone, phone2, phone3, phone4, phone5, phone6].filter(p => p && p.trim() !== '');

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
          // 1. Vérification par nom
          const names = person.names || [];
          const hasNameMatch = names.some(n => {
            const display = (n.displayName || '').toLowerCase().trim();
            const given = (n.givenName || '').toLowerCase().trim();
            const family = (n.familyName || '').toLowerCase().trim();
            const targetFull = fullName.toLowerCase().trim();
            return display === targetFull || (given && family && (given + ' ' + family) === targetFull);
          });
          if (hasNameMatch) return true;

          // 2. Vérification par numéro de téléphone
          const numbers = person.phoneNumbers || [];
          return numbers.some(n => phonesToCheck.some(p => {
            const normN = normalizePhoneForCompare(n.value);
            const normP = normalizePhoneForCompare(p);
            return normN && normN === normP;
          }));
        });
        if (foundPerson) {
          existingResourceName = foundPerson.resourceName;
          break;
        }
        pageToken = response.nextPageToken;
      } while (pageToken);
    } catch (err) {
      console.warn('Recherche de doublon impossible : ' + err.toString());
    }

    // ── Créer ou remplacer ─────────────────────────────────
    let resultContact;
    let isUpdate = false;

    if (existingResourceName) {
      try {
        People.People.deleteContact(existingResourceName);
      } catch (delErr) {
        console.warn("Erreur lors de la suppression de l'ancien contact : " + delErr.toString());
      }
      isUpdate = true;
    }

    resultContact = People.People.createContact(contact);

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
