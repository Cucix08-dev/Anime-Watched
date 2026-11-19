import { getAnimeGenerator } from "./js/animelist.js";

const appMain = document.getElementById("app-main");
const liAnime = document.getElementById("anime-page");
const liUtente = document.getElementById("lista-utente-page");
const titlePage = document.getElementById("title-page");
const searchBar = document.getElementById("search-bar");

let currentRenderId = 0;
let isDarkMode = true;

let userList = JSON.parse(localStorage.getItem("userList")) || [];

function addingOrRemoving(button, animeData) {
    const index = userList.findIndex(item => item.title.romaji === animeData.title.romaji);

    if (index === -1) {
        userList.push(animeData);
        button.textContent = "-";
    } else {
        userList.splice(index, 1);
        button.textContent = "+";
    }

    localStorage.setItem("userList", JSON.stringify(userList));
}

/* FUNZIONE PER CREARE LA CARD ANIME */
function creaCardAnime(anime) {
    const isOnList = userList.some(item => item.title.romaji === anime.title.romaji);

    const container = document.createElement("div");
    container.className = "container anime";
    if (isDarkMode) container.classList.add("dark");

    container.innerHTML = `
        <img src="${anime.coverImage.large}" alt="${anime.title.romaji}">
        <h2>${anime.title.romaji}</h2>
        <div style="
            width: 100%;
            display: flex;
            justify-content: space-around;
            align-items: center;
        ">
            <button style="
                background-color: var(--theme-background);
                border: solid 2px var(--theme-other);
                color: var(--theme-other);
                font-size: clamp(1rem, 2vw, 1.3rem);
                width: 20%;
                aspect-ratio: 3/2;
                border-radius: 20px;
                cursor: pointer;
            ">${isOnList ? "-" : "+"}</button>
        </div>
    `;

    const btn = container.querySelector("button");
    btn.addEventListener("click", () => {
        addingOrRemoving(btn, anime);
        
        if (liUtente.classList.contains("selected")) {
            container.remove();
            if (userList.length === 0) {
                appMain.innerHTML = "<p style='text-align:center;'>Nessun anime nella tua lista.</p>";
            }
        }
    });

    appMain.appendChild(container);
    applicaFiltroRicerca();
}

/* ANIME ALGORITHM */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function mostraAnime(renderId) {
    const generator = getAnimeGenerator();

    for await (const anime of generator) {
        if (renderId !== currentRenderId) return; // Si arresta all'istante al cambio scheda
        creaCardAnime(anime);
        await sleep(50);
    }
}

/* MOSTRA LISTA UTENTE */
async function mostraListaUtente(renderId) {
    userList = JSON.parse(localStorage.getItem("userList")) || [];

    if (userList.length === 0) {
        appMain.innerHTML = "<p style='text-align:center;'>Nessun anime nella tua lista.</p>";
        return;
    }

    for (const anime of userList) {
        if (renderId !== currentRenderId) return; // Si arresta all'istante al cambio scheda
        creaCardAnime(anime);
        await sleep(50);
    }
}

/* SEARCH BAR */
function applicaFiltroRicerca() {
    const ricerca = searchBar.value.toLowerCase().trim();

    document.querySelectorAll(".container.anime").forEach(container => {
        const titolo = container.querySelector("h2").textContent.toLowerCase();
        const trovato = ricerca.split(/\s+/).filter(Boolean).every(parola => titolo.includes(parola));
        container.style.display = trovato || !ricerca ? "" : "none";
    });
}

searchBar.addEventListener("input", applicaFiltroRicerca);

/* THEME APPLICATION */
function applicaTema() {
    document.querySelectorAll('*').forEach(el => {
        el.classList.toggle('dark', isDarkMode);
    });
}

/* START APPLICATION */
function avviaApp() {
    applicaTema();

    const mediaQueryMobile = window.matchMedia("(max-width: 700px)");

    function aggiornaTitoloResponsive(e) {
        if (!titlePage) return;

        const textNode = Array.from(titlePage.childNodes).find(
            node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ""
        );

        const nuovoTesto = e.matches ? "AW" : "Anime Watched";

        if (textNode) {
            textNode.textContent = " " + nuovoTesto;
        } else {
            titlePage.appendChild(document.createTextNode(" " + nuovoTesto));
        }
    }

// Ascolta in tempo reale il cambio di larghezza dello schermo
mediaQueryMobile.addEventListener("change", aggiornaTitoloResponsive);


    liAnime.addEventListener("click", () => {
        if (liAnime.classList.contains("selected")) return;

        currentRenderId++; 
        appMain.innerHTML = "";

        liAnime.classList.replace("not-selected", "selected");
        liUtente.classList.replace("selected", "not-selected");

        mostraAnime(currentRenderId);
    });

    liUtente.addEventListener("click", () => {
        if (liUtente.classList.contains("selected")) return;

        currentRenderId++; 
        appMain.innerHTML = "";

        liUtente.classList.replace("not-selected", "selected");
        liAnime.classList.replace("selected", "not-selected");

        mostraListaUtente(currentRenderId);
    });

    currentRenderId++;
    mostraAnime(currentRenderId);
}

avviaApp();
