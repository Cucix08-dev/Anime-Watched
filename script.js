const appMain = document.getElementById("app-main");
const liAnime = document.getElementById("anime-page");
const liUtente = document.getElementById("lista-utente-page");
const titlePage = document.getElementById("title-page");

// Imposta su true per attivare la dark mode ovunque (puoi anche salvarla in localStorage)
let isDarkMode = true;

// Funzione che aggiunge o rimuove la classe .dark a OGNI elemento della pagina
function applicaTema() {
    const tuttiGliElementi = document.querySelectorAll('*');
    tuttiGliElementi.forEach(el => {
        if (isDarkMode) {
            el.classList.add('dark');
        } else {
            el.classList.remove('dark');
        }
    });
}

function isAppAPK() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isAndroidApp = document.referrer.includes('android-app://');
    const isFileLocal = window.location.protocol === 'file:'; 

    return isStandalone || isAndroidApp || isFileLocal;
}

if (!isAppAPK() && titlePage) {
    titlePage.textContent = 'Anime Watched';
}

async function caricaHTML(pagina) {
    try {
        const risposta = await fetch(`src/${pagina}.html`);
        if (!risposta.ok) throw new Error(`File ${pagina}.html non trovato`);
        return await risposta.text();
    } catch (errore) {
        console.error("Errore nel caricamento del file:", errore);
    }
}

async function avviaApp() {
    applicaTema();

    const [animePageHTML, listaUtentePageHTML] = await Promise.all([
        caricaHTML("animePage"),
        caricaHTML("listaUtentePage")
    ]);

    appMain.innerHTML = animePageHTML;
    applicaTema();

    liAnime.addEventListener("click", () => { 
        appMain.innerHTML = animePageHTML;
        liAnime.classList.replace("not-selected", "selected");
        liUtente.classList.replace("selected", "not-selected");
        applicaTema(); 
    });

    liUtente.addEventListener("click", () => { 
        appMain.innerHTML = listaUtentePageHTML;
        liUtente.classList.replace("not-selected", "selected");
        liAnime.classList.replace("selected", "not-selected");
        applicaTema();
    });
}

avviaApp();
