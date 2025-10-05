// Funciones para actualizar el globo
const GlobeUpdaters = {
    updateColors: () => feat =>
        feat.properties.ADMIN === AppState.selectedCountry ? '#ff0000' : 'rgba(0, 0, 255, 0.15)',

    updateAltitude: () => feat =>
        feat.properties.ADMIN === AppState.selectedCountry ? CONFIG.selectedAltitude : CONFIG.defaultAltitude
};
// Inicializar el globo
function initializeGlobe() {
    Utils.updateProgress(10);

    // Asegurarse de que Bolivia está en pointsData
    if (!AppState.pointsData.find(p => p.name === 'Bolivia')) {
        AppState.pointsData.push({
            lat: -16.2902,
            lng: -63.5887,
            size: 0.8,
            color: 'green', // color seguro
            name: 'Bolivia',
            altitude: 0.02,
            sensorName: 'Principal Sensor',
            country: { name: 'Bolivia' }
        });
    }

    // Inicializar globo
    AppState.globe = Globe()(document.getElementById('globeViz'))
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')

        // POLÍGONOS
        .polygonSideColor(() => 'rgba(0, 100, 0, 0.1)')
        .polygonStrokeColor(() => '#111')
        .polygonCapCurvatureResolution(CONFIG.polygonResolution)
        .polygonLabel(({ properties: d }) => `<b>${d.ADMIN || d.name}</b>`)
        .polygonCapColor(GlobeUpdaters.updateColors())
        .polygonAltitude(GlobeUpdaters.updateAltitude())
        .onPolygonHover(Utils.debounce(hoverD =>
            AppState.globe.polygonAltitude(hoverD ? CONFIG.hoverAltitude : GlobeUpdaters.updateAltitude()), 100))
        .onPolygonClick(({ properties: d }) => selectCountry(d.ADMIN || d.name))
        .polygonsTransitionDuration(200)

        // PUNTOS
        .pointsData([]) // inicial vacío
        .pointLat('lat')
        .pointLng('lng')
        .pointColor(d => d.color || 'green')
        .pointAltitude(d => d.altitude || 0.02)
        .pointRadius('size')
        .pointLabel(d => `
            <div style="padding: 10px; max-width: 250px;">
                <b>${d.name}</b><br>
                País: ${d.country?.name || 'N/A'}<br>
                Sensor: ${d.sensorName || 'N/A'}<br>
                <em>Click para ver clima actual</em>
            </div>
        `)
        .onPointClick(d => {
            if (d.lat && d.lng) {
                AppState.globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 0.3 }, 800);
            }
            showPointDetails(d);
        })
        .pointsTransitionDuration(200);

    // Ahora sí agregamos los puntos **después de que el globo esté listo**
    setTimeout(() => {
        AppState.globe.pointsData(AppState.pointsData);
    }, 100); // pequeño delay asegura que el globo cargó

    Utils.updateProgress(20);

    // Centrar sobre Bolivia
    AppState.globe.pointOfView({ lat: -16.2902, lng: -63.5887, altitude: 0.5 }, 1000);
}
