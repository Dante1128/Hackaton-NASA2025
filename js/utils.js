// Estado de la aplicación
const AppState = {
    selectedCountry: null,
    countriesData: [],
    liMap: {},
    pointsData: [],
    globe: null,
    loadingProgress: 0
};

// Configuración optimizada para rendimiento
const CONFIG = {
    geoJsonUrl: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson',
    pointsDataUrl: '../prueba.json',
    defaultAltitude: 0.01,
    selectedAltitude: 0.04,
    hoverAltitude: 0.05,
    pointOfViewAltitude: 1.2,
    
    // Configuraciones de rendimiento
    enableBumpMap: false,
    enableShadows: false,
    enableAtmosphere: false,
    polygonResolution: 2,
    pointDensity: 0.8
};

// Utilidades
const Utils = {
    // Función de debounce para optimizar eventos
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Obtener el centroide de un polígono (versión optimizada)
    getCentroid(geometry) {
        if (!geometry || !geometry.coordinates) return { lat: 0, lng: 0 };
        
        let lats = 0, lngs = 0, count = 0;
        const coords = geometry.type === 'Polygon' ? 
            geometry.coordinates[0] : 
            geometry.coordinates.flat(2);
        
        // Muestrear cada 3 puntos para mejor rendimiento
        for (let i = 0; i < coords.length; i += 3) {
            const [lng, lat] = coords[i];
            lats += lat;
            lngs += lng;
            count++;
        }
        
        return count > 0 ? { 
            lat: lats / count, 
            lng: lngs / count 
        } : { lat: 0, lng: 0 };
    },

    // Manejo de errores consistente
    handleError(context, error) {
        console.error(`Error en ${context}:`, error);
    },

    // Actualizar progreso de carga
    updateProgress(increment) {
        AppState.loadingProgress = Math.min(100, AppState.loadingProgress + increment);
        document.getElementById('progress-fill').style.width = AppState.loadingProgress + '%';
        
        if (AppState.loadingProgress >= 100) {
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
            }, 500);
        }
    }
};