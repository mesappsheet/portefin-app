const SB_URL = "https://lkuwgggwdtbzjgplwylr.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdXdnZ2d3ZHRiempncGx3eWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDgxMDQsImV4cCI6MjA4OTA4NDEwNH0.YPqCCqhhVvu9iJXqwUP57A-u8mBFf4nARtSyGmCxfgo";
window.supabase = window.supabase.createClient(SB_URL, SB_KEY);

/* ═══════════════════════════════════════════
   SERVICE WORKER REGISTRATION (PWA)
   ═══════════════════════════════════════════ */
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
}

/* ═══════════════════════════════════════════
   PWA INSTALL PROMPT
   ═══════════════════════════════════════════ */
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById("pwa-install-banner");
    if (banner && !localStorage.getItem("pwa-install-dismissed")) {
        banner.classList.remove("hidden");
        banner.classList.add("flex");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const installBtn = document.getElementById("pwa-install-btn");
    const dismissBtn = document.getElementById("pwa-install-dismiss");
    const banner = document.getElementById("pwa-install-banner");

    if (installBtn) {
        installBtn.addEventListener("click", async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (banner) { banner.classList.add("hidden"); banner.classList.remove("flex"); }
        });
    }
    if (dismissBtn && banner) {
        dismissBtn.addEventListener("click", () => {
            banner.classList.add("hidden");
            banner.classList.remove("flex");
            localStorage.setItem("pwa-install-dismissed", "1");
        });
    }
});

window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    const banner = document.getElementById("pwa-install-banner");
    if (banner) { banner.classList.add("hidden"); banner.classList.remove("flex"); }
});

/* ═══════════════════════════════════════════
   ANDROID DETECTION
   ═══════════════════════════════════════════ */
function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

/* ═══════════════════════════════════════════
   AUTHENTICATION
   ═══════════════════════════════════════════ */
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

    // Update both desktop sidebar and mobile drawer
    document.querySelectorAll(".size-10.rounded-full").forEach(avatarEl => {
        if (avatarUrl) {
            avatarEl.innerHTML = `<img src="${avatarUrl}" alt="${name}" class="size-10 rounded-full object-cover"/>`;
            avatarEl.className = "size-10 rounded-full overflow-hidden";
        } else {
            avatarEl.textContent = initials;
        }
        const container = avatarEl.closest(".flex.items-center.gap-3");
        if (container) {
            const nameEl = container.querySelector(".text-sm.font-semibold");
            const roleEl = container.querySelector(".text-xs.text-slate-500");
            if (nameEl) nameEl.textContent = name;
            if (roleEl) roleEl.textContent = user.email || "";
        }
    });
}

function addLogoutButton() {
    // Add to desktop sidebar
    const sidebarFooter = document.querySelector("#app-root aside .p-4.border-t");
    if (sidebarFooter && !sidebarFooter.querySelector("#btn-logout")) {
        sidebarFooter.appendChild(createLogoutBtn("btn-logout"));
    }
    // Add to mobile drawer
    const mobileFooter = document.querySelector("#mobile-drawer .p-4.border-t");
    if (mobileFooter && !mobileFooter.querySelector("#btn-logout-mobile")) {
        mobileFooter.appendChild(createLogoutBtn("btn-logout-mobile"));
    }
}

function createLogoutBtn(id) {
    const btn = document.createElement("button");
    btn.id = id;
    btn.className = "mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium";
    btn.innerHTML = `<span class="material-symbols-outlined text-base">logout</span> Se déconnecter`;
    btn.addEventListener("click", async () => {
        await window.supabase.auth.signOut();
        window.location.href = "login.html";
    });
    return btn;
}

/* ═══════════════════════════════════════════
   NAVIGATION CONFIG
   ═══════════════════════════════════════════ */
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
            basePath: "../TABLEAU DE BORD/",
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
    closeModalBtn: document.getElementById("close-modal"),
    // Mobile elements
    mobileDrawer: document.getElementById("mobile-drawer"),
    mobileDrawerOverlay: document.getElementById("mobile-drawer-overlay"),
    mobileNav: document.getElementById("mobile-nav"),
    mobileSubScreens: document.getElementById("mobile-sub-screens"),
    btnOpenDrawer: document.getElementById("btn-open-drawer"),
    btnCloseDrawer: document.getElementById("btn-close-drawer"),
    bottomTabBar: document.getElementById("bottom-tab-bar")
};

/* ═══════════════════════════════════════════
   INITIALISATION
   ═══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
    // Add Android class to body for CSS targeting
    if (isAndroid()) {
        document.body.classList.add("android-device");
    }

    const authenticated = await initAuth();
    if (!authenticated) return;

    initNavigation();
    initMobileDrawer();
    initBottomTabs();
    loadScreen(currentModule, currentScreen);
    addLogoutButton();

    dom.closeModalBtn.addEventListener("click", closeModal);
    dom.modalOverlay.addEventListener("click", (e) => {
        if (e.target === dom.modalOverlay) closeModal();
    });
});

/* ═══════════════════════════════════════════
   MOBILE DRAWER
   ═══════════════════════════════════════════ */
function initMobileDrawer() {
    if (!dom.btnOpenDrawer) return;

    dom.btnOpenDrawer.addEventListener("click", openDrawer);
    dom.btnCloseDrawer.addEventListener("click", closeDrawer);
    dom.mobileDrawerOverlay.addEventListener("click", closeDrawer);

    // Mobile nav buttons
    dom.mobileNav.querySelectorAll("button[data-module]").forEach(btn => {
        btn.addEventListener("click", () => {
            const module = btn.getAttribute("data-module");
            if (module) {
                switchModule(module);
                closeDrawer();
            }
        });
    });

    // Swipe to close
    let startX = 0;
    dom.mobileDrawer.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });
    dom.mobileDrawer.addEventListener("touchend", (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (diff > 60) closeDrawer();
    }, { passive: true });
}

function openDrawer() {
    dom.mobileDrawer.classList.add("open");
    dom.mobileDrawerOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeDrawer() {
    dom.mobileDrawer.classList.remove("open");
    dom.mobileDrawerOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

/* ═══════════════════════════════════════════
   BOTTOM TAB BAR
   ═══════════════════════════════════════════ */
function initBottomTabs() {
    if (!dom.bottomTabBar) return;

    dom.bottomTabBar.querySelectorAll("button[data-module]").forEach(btn => {
        btn.addEventListener("click", () => {
            const module = btn.getAttribute("data-module");
            if (module) switchModule(module);
        });
    });
}

function updateBottomTabs(moduleKey) {
    if (!dom.bottomTabBar) return;
    dom.bottomTabBar.querySelectorAll(".bottom-tab").forEach(btn => {
        const isActive = btn.getAttribute("data-module") === moduleKey;
        btn.classList.toggle("active-tab", isActive);
        if (!isActive) btn.classList.add("text-slate-400");
        else btn.classList.remove("text-slate-400");
    });
}

/* ═══════════════════════════════════════════
   DESKTOP SIDEBAR NAVIGATION
   ═══════════════════════════════════════════ */
function initNavigation() {
    dom.mainNav.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const module = btn.getAttribute("data-module");
            if (module) switchModule(module);
        });
    });
}

function switchModule(moduleKey) {
    if (currentModule === moduleKey) return;

    currentModule = moduleKey;
    currentScreen = "01";

    // Update desktop sidebar
    updateNavUI(dom.mainNav, moduleKey);
    // Update mobile drawer
    updateNavUI(dom.mobileNav, moduleKey);
    // Update bottom tabs
    updateBottomTabs(moduleKey);

    loadScreen(currentModule, currentScreen);
}

function updateNavUI(navEl, moduleKey) {
    if (!navEl) return;
    navEl.querySelectorAll("button[data-module]").forEach(btn => {
        if (btn.getAttribute("data-module") === moduleKey) {
            btn.classList.add("active-nav");
            btn.classList.remove("text-slate-600", "dark:text-slate-400");
        } else {
            btn.classList.remove("active-nav");
            btn.classList.add("text-slate-600", "dark:text-slate-400");
        }
    });
}

/* ═══════════════════════════════════════════
   SUB-SCREENS LIST
   ═══════════════════════════════════════════ */
function updateSubScreens(moduleKey) {
    const screens = CONFIG.modules[moduleKey].screens;

    // Update both desktop and mobile sub-screen lists
    [dom.subScreensList, dom.mobileSubScreens].forEach(container => {
        if (!container) return;
        container.innerHTML = "";

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
                closeDrawer();
            });
            container.appendChild(btn);
        });
    });
}

/* ═══════════════════════════════════════════
   SCREEN LOADING
   ═══════════════════════════════════════════ */
async function loadScreen(moduleKey, screenId) {
    const config = CONFIG.modules[moduleKey];
    const screen = config.screens.find(s => s.id === screenId);
    if (!screen) return;

    dom.viewContainer.classList.add("view-loading");

    try {
        const encodedPath = config.basePath
            .split('/')
            .map(seg => (seg === '..' || seg === '') ? seg : encodeURIComponent(seg))
            .join('/');
        const url = encodedPath + encodeURIComponent(screen.name);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Échec du chargement : ${response.statusText}`);

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const mainContent = doc.querySelector("main");
        if (mainContent) {
            dom.viewContainer.innerHTML = mainContent.innerHTML;

            // Re-inject scripts
            mainContent.querySelectorAll("script").forEach(oldScript => {
                const newScript = document.createElement("script");
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                dom.viewContainer.appendChild(newScript);
            });

            hookInternalButtons();
            applyMobileResponsiveFixes();
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
                <button onclick="location.reload()" class="px-4 py-2 bg-primary text-white rounded-lg">Réessayer</button>
            </div>
        `;
    } finally {
        dom.viewContainer.classList.remove("view-loading");
        updateSubScreens(moduleKey);
    }
}

/* ═══════════════════════════════════════════
   MOBILE RESPONSIVE FIXES (post-injection)
   ═══════════════════════════════════════════ */
function applyMobileResponsiveFixes() {
    if (window.innerWidth >= 1024) return;

    const android = isAndroid();

    // Hide internal sidebars (they're redundant - the app shell has its own)
    dom.viewContainer.querySelectorAll("aside").forEach(aside => {
        aside.style.display = "none";
    });

    // Hide internal resizers
    dom.viewContainer.querySelectorAll(".resizer-v").forEach(r => {
        r.style.display = "none";
    });

    // Make fixed-width sections full-width on mobile
    dom.viewContainer.querySelectorAll("section").forEach(sec => {
        const cls = sec.className || "";
        if (cls.includes("w-[") || cls.includes("list-sidebar") || sec.id === "list-sidebar") {
            sec.style.width = "100%";
            sec.style.maxWidth = "100%";
            sec.style.borderRight = "none";
            sec.style.position = "relative";

            if (android) {
                // Android: liste et détails sur une même vue scrollable, pas de collapsible
                sec.style.maxHeight = "none";
                sec.style.overflow = "visible";
                sec.style.borderBottom = "2px solid rgba(148,163,184,0.15)";
                sec.style.transition = "none";
                // Remove any existing toggle bar
                const existingToggle = sec.querySelector(".mobile-list-toggle");
                if (existingToggle) existingToggle.remove();
            } else {
                // iOS / autres: comportement collapsible existant
                sec.style.borderBottom = "1px solid rgba(148,163,184,0.2)";
                sec.style.transition = "max-height 0.3s ease";
                sec.style.overflow = "hidden";
                sec.style.maxHeight = window.innerWidth < 480 ? "35vh" : "45vh";
                sec.dataset.expanded = "true";

                if (!sec.querySelector(".mobile-list-toggle")) {
                    const toggleBar = document.createElement("div");
                    toggleBar.className = "mobile-list-toggle";
                    toggleBar.style.cssText = "display:flex;align-items:center;justify-content:center;padding:6px 0;cursor:pointer;background:linear-gradient(to bottom,transparent,rgba(148,163,184,0.08));border-top:1px solid rgba(148,163,184,0.15);gap:4px;position:sticky;bottom:0;z-index:5;";
                    toggleBar.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;color:#64748b;transition:transform 0.3s">expand_less</span><span style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Réduire la liste</span>';
                    sec.appendChild(toggleBar);

                    const icon = toggleBar.querySelector(".material-symbols-outlined");
                    const label = toggleBar.querySelector("span:last-child");

                    toggleBar.addEventListener("click", () => {
                        const isExpanded = sec.dataset.expanded === "true";
                        if (isExpanded) {
                            sec.style.maxHeight = "36px";
                            sec.dataset.expanded = "false";
                            icon.textContent = "expand_more";
                            icon.style.transform = "";
                            label.textContent = "Afficher la liste";
                            toggleBar.style.borderTop = "none";
                            toggleBar.style.background = "rgba(148,163,184,0.06)";
                        } else {
                            sec.style.maxHeight = window.innerWidth < 480 ? "35vh" : "45vh";
                            sec.dataset.expanded = "true";
                            icon.textContent = "expand_less";
                            label.textContent = "Réduire la liste";
                            toggleBar.style.borderTop = "1px solid rgba(148,163,184,0.15)";
                            toggleBar.style.background = "linear-gradient(to bottom,transparent,rgba(148,163,184,0.08))";
                        }
                    });

                    let touchStartY = 0;
                    sec.addEventListener("touchstart", (e) => {
                        touchStartY = e.touches[0].clientY;
                    }, { passive: true });
                    sec.addEventListener("touchend", (e) => {
                        const diffY = e.changedTouches[0].clientY - touchStartY;
                        if (diffY < -60 && sec.dataset.expanded === "false") {
                            toggleBar.click();
                        } else if (diffY > 60 && sec.dataset.expanded === "true") {
                            toggleBar.click();
                        }
                    }, { passive: true });
                }
            }
        }
    });

    // Make flex master-detail layouts stack vertically
    const masterDetailContainers = dom.viewContainer.querySelectorAll(".flex-1.flex.overflow-hidden");
    masterDetailContainers.forEach(container => {
        if (container.children.length > 1) {
            container.style.flexDirection = "column";
            if (android) {
                // Android: allow full scroll of both list + details together
                container.style.overflow = "auto";
                container.style.height = "auto";
                container.style.minHeight = "0";
            }
        }
    });

    // Make grid-cols-6 responsive
    dom.viewContainer.querySelectorAll("[class*='grid-cols-6']").forEach(grid => {
        grid.style.gridTemplateColumns = window.innerWidth < 480
            ? "repeat(2, 1fr)"
            : "repeat(3, 1fr)";
    });
}

// Re-apply on resize
let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        applyMobileResponsiveFixes();
    }, 150);
});

/* ═══════════════════════════════════════════
   MODALS
   ═══════════════════════════════════════════ */
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

        const content = doc.querySelector(".modal-content") || doc.querySelector("main") || doc.body;
        dom.modalContent.innerHTML = content.innerHTML;

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

/* ═══════════════════════════════════════════
   GLOBAL NAV HELPER + INTERNAL BUTTON HOOKS
   ═══════════════════════════════════════════ */
window.naviguerVers = function(moduleKey, screenId) {
    closeModal();
    currentModule = moduleKey;
    currentScreen = screenId;
    updateNavUI(dom.mainNav, moduleKey);
    updateNavUI(dom.mobileNav, moduleKey);
    updateBottomTabs(moduleKey);
    setTimeout(function() { loadScreen(moduleKey, screenId); }, 150);
};

function hookInternalButtons() {
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
}
