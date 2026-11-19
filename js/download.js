const downloadBtn = document.getElementById("download-btn");
let deferredPrompt = null;

const isAndroid = /Android/i.test(navigator.userAgent);

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    downloadBtn.style.display = "flex";
});

if (isAndroid && !window.matchMedia('(display-mode: standalone)').matches) {
    downloadBtn.style.display = "flex";
}

downloadBtn.addEventListener("click", async () => {
    if (isAndroid) {
        const link = document.createElement("a");
        link.href = "./AnimeWatched.apk";
        link.download = "AnimeWatched.apk";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }

    if (!deferredPrompt) {
        alert("L'app è già installata oppure il browser non supporta l'installazione.");
        return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
});
