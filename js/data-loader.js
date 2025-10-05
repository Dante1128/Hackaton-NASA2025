// Cargar datos de países
async function loadCountriesData() {
    try {
        const response = await fetch(CONFIG.geoJsonUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        AppState.countriesData = data.features;
        
        // Filtrar países muy pequeños para mejor rendimiento
        const filteredCountries = AppState.countriesData.filter(country => {
            const area = country.properties?.AREA || 0;
            return area > 100;
        });
        
        AppState.globe
            .polygonsData(filteredCountries)
            .polygonCapColor(GlobeUpdaters.updateColors())
            .polygonAltitude(GlobeUpdaters.updateAltitude());

        populateCountryList();
        console.log(`Cargados ${filteredCountries.length} países (filtrados de ${AppState.countriesData.length}).`);
        Utils.updateProgress(30);
    } catch (error) {
        Utils.handleError('loadCountriesData', error);
        document.getElementById('country-list').innerHTML = 
            '<li style="color: red;">Error cargando países</li>';
        Utils.updateProgress(30);
    }
}

// Poblar lista de países
function populateCountryList() {
    const countryList = document.getElementById('country-list');
    const countryNames = AppState.countriesData
        .map(f => f.properties.ADMIN || f.properties.name)
        .filter(name => name && name.length > 2)
        .sort((a, b) => a.localeCompare(b));
    
    countryList.innerHTML = '';
    AppState.liMap = {};
    
    // Renderizar en lotes para no bloquear el UI
    let index = 0;
    const renderBatch = () => {
        const batchSize = 50;
        const batch = countryNames.slice(index, index + batchSize);
        
        batch.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.onclick = () => selectCountry(name);
            countryList.appendChild(li);
            AppState.liMap[name] = li;
        });
        
        index += batchSize;
        if (index < countryNames.length) {
            setTimeout(renderBatch, 0);
        } else {
            Utils.updateProgress(10);
        }
    };
    
    renderBatch();
}

// Cargar datos de puntos
async function loadPointsData() {
    try {
        const response = await fetch(CONFIG.pointsDataUrl);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const jsonData = await response.json();
        const results = jsonData.results || [];
        
        AppState.pointsData = results
            .map(loc => ({
                lat: loc.coordinates?.latitude,
                lng: loc.coordinates?.longitude,
                name: loc.name || 'Sin nombre',
                country: loc.country || { name: 'N/A' },
                sensorName: loc.sensors?.[0]?.parameter?.displayName || 'N/A'
            }))
            .filter(point => point.lat && point.lng)
            .slice(0, Math.floor(results.length * CONFIG.pointDensity));
        
        AppState.globe.pointsData(AppState.pointsData);
        console.log(`Cargados ${AppState.pointsData.length} puntos de datos (${CONFIG.pointDensity * 100}% de densidad).`);
        Utils.updateProgress(20);
    } catch (error) {
        Utils.handleError('loadPointsData', error);
        Utils.updateProgress(20);
    }
}