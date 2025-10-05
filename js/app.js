// Inicializar barra de noticias
function initializeNewsTicker() {
    const newsMessages = [
        "🌎 Bienvenido al mapa mundi interactivo.",
        "📰 Última hora: Nuevas investigaciones sobre el cambio climático.",
        "✈️ Aumentan los vuelos internacionales entre América y Europa.",
        "⚽ Noticias deportivas: Sudamérica domina en el mundial.",
        "💡 Curiosidad: El desierto del Sahara es más grande que Brasil."
    ];

    const ticker = document.getElementById("ticker-content");

    function updateTickerContent() {
        ticker.textContent = newsMessages.join("   ✦   ");
    }

    updateTickerContent();

    ticker.addEventListener("animationiteration", () => {
        const first = newsMessages.shift();
        newsMessages.push(first);
        updateTickerContent();
    });
    
    Utils.updateProgress(10);
}

// Inicializar la aplicación
async function initializeApp() {
    initializeGlobe();
    initializeNewsTicker();
    
    // Cargar datos en paralelo
    await Promise.allSettled([
        loadCountriesData(),
        loadPointsData()
    ]);
    
    // Completar progreso
    Utils.updateProgress(100);
    console.log('Aplicación inicializada correctamente');
}

// Iniciar cuando el DOM esté listo ewe
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}