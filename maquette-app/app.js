const SB_URL = "https://lkuwgggwdtbzjgplwylr.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdXdnZ2d3ZHRiempncGx3eWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDgxMDQsImV4cCI6MjA4OTA4NDEwNH0.YPqCCqhhVvu9iJXqwUP57A-u8mBFf4nARtSyGmCxfgo";
window.supabase = window.supabase.createClient(SB_URL, SB_KEY);

/**
 * Authentification : redirige vers login.html si aucune session active.
 * Met à jour la sidebar avec les infos de l'utilisateur connecté.
 */
async function initAuth() {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
        return false;
    }
    updateUserSidebar(session.user);
    return true;
}

function updateUserSidebar(user) {
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email?.split("@")[0] || "Utilisateur";
    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const avatarUrl = meta.avatar_url || meta.picture || null;

    const avatarEl = document.querySelector(".size-10.rounded-full");
    const nameEl = avatarEl?.nextElementSibling?.querySelector(".text-sm.font-semibold");
    const roleEl = avatarEl?.nextElementSibling?.querySelector(".text-xs.text-slate-500");

    if (avatarEl) {
        if (avatarUrl) {
            avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${name}" class="size-10 rounded-full object-cover"/>`;
            avatarEl.className = "size-10 rounded-full overflow-hidden";
        } else {
            avatarEl.textContent = initials;
        }
    }
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = user.email || "";
}

// Bouton de déconnexion (injecté dans la sidebar après init)
function addLogoutButton() {
    const sidebarFooter = document.querySelector("#app-root aside .p-4.border-t");
    if (!sidebarFooter || sidebarFooter.querySelector("#btn-logout")) return;
    const btn = document.createElement("button");
    btn.id = "btn-logout";
    btn.className = "mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium";
    btn.innerHTML = `<span class="material-symbols-outlined text-base">logout</span> Se déconnecter`;
    btn.addEventListener("click", async () => {
        await window.supabase.auth.signOut();
        window.location.href = "login.html";
    });
    sidebarFooter.appendChild(btn);
}

/**
 * Logique de navigation pour la maquette fonctionnelle.
 * Cette version utilise 'fetch' pour charger dynamiquement les fichiers HTML
 * et injecter leur contenu dans le conteneur principal.
 */

const CONFIG = {
    modules: {
        dashboard: {
            label: "Tableau de Bord",
            basePath: "../TABLEAU DE BORD/",
            screens: [
                { id: "01", name: "01 - Centre de controle vue ensemble.html", label: "Centre de Contrôle" },
                { id: "02", name: "02 - Parametres generaux vues.html", label: "Paramètres Généraux" },
                { id: "03", name: "03 - Configuration vue dashboard.html", label: "Configuration" },
                { id: "04", name: "04 - Personnalisation des vues.html", label: "Personnalisation" },
                { id: "05", name: "5-Parametre champs et badges.html", label: "Champs & Badges" }
            ]
        },
        prospection: {
            label: "Prospection",
            basePath: "../Module PROSPECTIONS/",
            screens: [
                { id: "01", name: "01 - Liste et details prospection.html", label: "Liste & Détails" },
                { id: "02", name: "02 - Formulaire ajout prospect.html", label: "Ajout Prospect", isModal: true },
                { id: "03", name: "03 - Parametres generaux prospection.html", label: "Paramètres" },
                { id: "04", name: "04 - Champs et badges prospection.html", label: "Champs & Badges" },
                { id: "05", name: "05 - Personnalisation affichage prospection.html", label: "Affichage" },
                { id: "06", name: "06 - Gestion modeles prospection.html", label: "Modèles Prospection" },
                { id: "07", name: "07 - Personnalisation champs et badges.html", label: "Custom Champs" },
                { id: "08", name: "08 - Gestion modeles communication.html", label: "Modèles Com." }
            ]
        },
        credits: {
            label: "Crédits",
            basePath: "../module CREDITS/",
            screens: [
                { id: "01", name: "01 - Liste clients.html", label: "Portefeuille Clients" },
                { id: "02", name: "02 - Echeancier credit.html", label: "Échéancier" },
                { id: "03", name: "03 - Progression remboursements.html", label: "Remboursements" },
                { id: "04", name: "04 - Credits soldes.html", label: "Suivi Soldés" },
                { id: "05", name: "05 - Fin echeance.html", label: "Fin Échéance" },
                { id: "06", name: "06 - Communications credits.html", label: "Communications" },
                { id: "07", name: "07 - Modal report echeance.html", label: "Report Échéance", isModal: true },
                { id: "08", name: "08 - Modal nouveau dossier client.html", label: "Nouveau Dossier", isModal: true }
            ]
        },
        settings: {
            label: "Paramètres",
            basePath: "../TABLEAU DE BORD/", // Réutilise certains écrans de config
            screens: [
                 { id: "01", name: "04 - Parametres generaux vues.html", label: "Paramètres Généraux" }
            ]
        }
    }
};

let currentModule = "dashboard";
let currentScreen = "01";

const dom = {
    viewContainer: document.getElementById("view-container"),
    mainNav: document.getElementById("main-nav"),
    subScreensList: document.getElementById("sub-screens-list"),
    modalOverlay: document.getElementById("modal-overlay"),
    modalContent: document.getElementById("modal-content"),
    closeModalBtn: document.getElementById("close-modal")
};

/**
 * Initialisation
 */
document.addEventListener("DOMContentLoaded", async () => {
    const authenticated = await initAuth();
    if (!authenticated) return; // redirigé vers login.html

    initNavigation();
    loadScreen(currentModule, currentScreen);
    addLogoutButton();

    dom.closeModalBtn.addEventListener("click", closeModal);
    dom.modalOverlay.addEventListener("click", (e) => {
        if (e.target === dom.modalOverlay) closeModal();
    });
});

/**
 * Configure les écouteurs de la barre latérale
 */
function initNavigation() {
    dom.mainNav.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const module = btn.getAttribute("data-module");
            if (module) switchModule(module);
        });
    });
}

/**
 * Change de module et charge le premier écran
 */
function switchModule(moduleKey) {
    if (currentModule === moduleKey) return;
    
    currentModule = moduleKey;
    currentScreen = "01";

    // Mise à jour de l'UI de la barre latérale
    dom.mainNav.querySelectorAll("button").forEach(btn => {
        if (btn.getAttribute("data-module") === moduleKey) {
            btn.classList.add("active-nav");
            btn.classList.remove("text-slate-600", "dark:text-slate-400");
        } else {
            btn.classList.remove("active-nav");
            btn.classList.add("text-slate-600", "dark:text-slate-400");
        }
    });

    loadScreen(currentModule, currentScreen);
}

/**
 * Met à jour la liste des écrans secondaires dans la sidebar
 */
function updateSubScreens(moduleKey) {
    const screens = CONFIG.modules[moduleKey].screens;
    dom.subScreensList.innerHTML = "";

    screens.forEach(s => {
        const btn = document.createElement("button");
        btn.className = `w-full text-left px-3 py-1.5 text-[11px] rounded transition-colors flex items-center gap-2 ${
            s.id === currentScreen ? "bg-slate-100 dark:bg-slate-800 text-primary font-bold" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`;
        
        const icon = s.isModal ? "open_in_new" : "chevron_right";
        btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">${icon}</span> ${s.label}`;
        
        btn.addEventListener("click", () => {
            if (s.isModal) {
                openModal(moduleKey, s.id);
            } else {
                currentScreen = s.id;
                loadScreen(moduleKey, s.id);
            }
        });
        dom.subScreensList.appendChild(btn);
    });
}

/**
 * Charge un écran HTML spécifique
 */
async function loadScreen(moduleKey, screenId) {
    const config = CONFIG.modules[moduleKey];
    const screen = config.screens.find(s => s.id === screenId);
    if (!screen) return;

    dom.viewContainer.classList.add("view-loading");
    
    try {
        // Encode chaque segment du chemin pour supporter les espaces sur Netlify
        const encodedPath = config.basePath
            .split('/')
            .map(seg => (seg === '..' || seg === '') ? seg : encodeURIComponent(seg))
            .join('/');
        const url = encodedPath + encodeURIComponent(screen.name);
        console.log(`Loading screen: ${url}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Échec du chargement : ${response.statusText}`);
        
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Extraction du <main>
        const mainContent = doc.querySelector("main");
        if (mainContent) {
            dom.viewContainer.innerHTML = mainContent.innerHTML;
            
            // Ré-injection des scripts s'il y en a dans le main (souvent nécessaire pour Tailwind ou Charts)
            mainContent.querySelectorAll("script").forEach(oldScript => {
                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                dom.viewContainer.appendChild(newScript);
            });

            // On intercepte les clics internes sur les liens de navigation si possible
            hookInternalButtons();
        } else {
             dom.viewContainer.innerHTML = `<div class="p-8 text-red-500">Erreur: Élément &lt;main&gt; non trouvé dans le fichier : ${screen.name}</div>`;
        }
    } catch (error) {
        console.error(error);
        dom.viewContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full p-8 text-center">
                <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
                <h3 class="text-xl font-bold mb-2">Impossible de charger l'écran</h3>
                <p class="text-slate-500 max-w-sm mb-6">${error.message}</p>
                <button onclick="location.reload()" class="px-4 py-2 bg-primary text-white rounded-lg">Ressayer</button>
            </div>
        `;
    } finally {
        dom.viewContainer.classList.remove("view-loading");
        updateSubScreens(moduleKey);
    }
}

/**
 * Ouvre une modale avec le contenu d'un fichier HTML
 */
async function openModal(moduleKey, screenId) {
    const config = CONFIG.modules[moduleKey];
    const screen = config.screens.find(s => s.id === screenId);
    
    dom.modalContent.innerHTML = '<div class="p-12 flex justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>';
    dom.modalOverlay.classList.add("active");

    try {
        const url = config.basePath + screen.name;
        const response = await fetch(url);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        
        // Pour les modales, on prend souvent tout le body ou le conteneur principal
        const content = doc.querySelector(".modal-content") || doc.querySelector("main") || doc.body;
        dom.modalContent.innerHTML = content.innerHTML;

        // ✅ Ré-injection des scripts (nécessaire car innerHTML ne les exécute pas)
        content.querySelectorAll("script").forEach(oldScript => {
            const newScript = document.createElement("script");
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            dom.modalContent.appendChild(newScript);
        });
        
    } catch (error) {
        dom.modalContent.innerHTML = `<div class="p-12 text-red-500">Erreur : ${error.message}</div>`;
    }
}

function closeModal() {
    dom.modalOverlay.classList.remove("active");
}

// ✅ Exposer une fonction de navigation globale pour les scripts injectés (modales, écrans)
//    Usage depuis un modal : window.naviguerVers('credits', '02')
window.naviguerVers = function(moduleKey, screenId) {
    closeModal();
    currentModule = moduleKey;
    currentScreen = screenId;
    setTimeout(function() { loadScreen(moduleKey, screenId); }, 150);
};

/**
 * Intercepte les clics sur les boutons des maquettes pour les rendre fonctionnels
 * (ex: liens vers Prospection, Crédits, etc.)
 */
function hookInternalButtons() {
    // Boutons "Dashboard / Vue principale" -> Accéder à
    const prospectionCards = dom.viewContainer.querySelectorAll('[id*="prospection"], [href*="prospection"]');
    prospectionCards.forEach(c => {
        c.onclick = (e) => {
            e.preventDefault();
            switchModule("prospection");
        };
    });

    const creditsCards = dom.viewContainer.querySelectorAll('[id*="credits"], [href*="credits"]');
    creditsCards.forEach(c => {
        c.onclick = (e) => {
            e.preventDefault();
            switchModule("credits");
        };
    });

    // Bouton de conversion client
    const convertBtn = dom.viewContainer.querySelector('[class*="CONVERTIR EN CLIENT"]');
    if (convertBtn) {
        convertBtn.onclick = () => alert("Logic de conversion : Le prospect sera transféré dans le module CRÉDITS.");
    }
}
