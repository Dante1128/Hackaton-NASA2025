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
    
    AppState.globe = Globe()(document.getElementById('globeViz'))
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        
        // Configuraciones de polígonos optimizadas
        .polygonSideColor(() => 'rgba(0, 100, 0, 0.1)')
        .polygonStrokeColor(() => '#111')
        .polygonCapCurvatureResolution(CONFIG.polygonResolution)
        .polygonLabel(({ properties: d }) => `
            <b>${d.ADMIN || d.name}</b>
        `)
        .onPolygonHover(Utils.debounce(hoverD => 
            AppState.globe.polygonAltitude(hoverD ? CONFIG.hoverAltitude : GlobeUpdaters.updateAltitude()), 100))
        .onPolygonClick(({ properties: d }) => selectCountry(d.ADMIN || d.name))
        .polygonsTransitionDuration(200)
        
        // Configuraciones de puntos optimizadas - ACTUALIZADO
        .pointColor(() => '#fa5050ff')
        .pointAltitude(0.01)
        .pointRadius(0.15)
        .pointLabel(d => `
            <div style="padding: 10px; max-width: 250px;">
                <b>${d.name}</b><br>
                País: ${d.country?.name || 'N/A'}<br>
                Sensor: ${d.sensorName || 'N/A'}<br>
                <em>Click para ver clima actual</em>
            </div>
        `)
        .onPointClick(d => {
            console.log('Point clicked:', d); // Para debug
            if (d.lat && d.lng) {
                AppState.globe.pointOfView({ 
                    lat: d.lat, 
                    lng: d.lng, 
                    altitude: 0.3
                }, 800);
            }
            showPointDetails(d);
        })
        .pointsTransitionDuration(200);

    Utils.updateProgress(20);
}

// Seleccionar país
function selectCountry(name) {
    AppState.selectedCountry = name;
    
    AppState.globe
        .polygonCapColor(GlobeUpdaters.updateColors())
        .polygonAltitude(GlobeUpdaters.updateAltitude());

    // Actualizar lista
    Object.values(AppState.liMap).forEach(li => li.classList.remove('selected'));
    if (AppState.liMap[name]) AppState.liMap[name].classList.add('selected');

    // Centrar vista
    const selectedFeat = AppState.countriesData.find(f => 
        (f.properties.ADMIN || f.properties.name) === name);
        
    if (selectedFeat) {
        const centroid = Utils.getCentroid(selectedFeat.geometry);
        AppState.globe.pointOfView({ 
            lat: centroid.lat, 
            lng: centroid.lng, 
            altitude: CONFIG.pointOfViewAltitude 
        }, 800);
    }
}

// FUNCIÓN ACTUALIZADA: Mostrar detalles del punto con clima
async function showPointDetails(point) {
    console.log('Showing details for point:', point); // Debug
    
    // Mostrar mensaje de carga inmediatamente
    const loadingContent = `
        <div style="padding: 20px; text-align: center;">
            <div class="loading" style="margin: 0 auto;"></div>
            <p>Cargando datos del clima...</p>
        </div>
    `;
    showModal(loadingContent);

    try {
        const weatherInfo = await WeatherService.getWeatherSummary(point.lat, point.lng);
        const currentWeather = await WeatherService.getCurrentWeather(point.lat, point.lng);
        const weatherIcon = WeatherService.getWeatherIcon(currentWeather);
        
        const details = `
            <div style="padding: 20px; max-width: 350px;">
                <h3 style="margin-top: 0; color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                    ${weatherIcon} ${point.name}
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <p><strong>📍 País:</strong> ${point.country?.name || 'N/A'}</p>
                    <p><strong>🔧 Sensor:</strong> ${point.sensorName || 'N/A'}</p>
                    <p><strong>🌐 Coordenadas:</strong> ${point.lat?.toFixed(4)}, ${point.lng?.toFixed(4)}</p>
                </div>
                
                <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="margin-top: 0; color: #1565c0;">🌤 Clima Actual</h4>
                    <div style="font-size: 14px;">
                        ${weatherInfo.replace(/\|/g, '<br>')}
                    </div>
                </div>
                
                <button onclick="showDetailedWeather(${point.lat}, ${point.lng}, '${point.name}')" 
                        style="width: 100%; background: #007bff; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.3s;">
                    📅 Ver Pronóstico 5 Días
                </button>
                
                <div style="margin-top: 10px; font-size: 11px; color: #666; text-align: center;">
                    Datos en tiempo real de Open-Meteo
                </div>
            </div>
        `;
        
        // Reemplazar el modal de carga con el contenido real
        const modal = document.getElementById('weather-modal');
        if (modal) {
            modal.innerHTML = details + `
                <button onclick="this.parentElement.remove()" 
                        style="position: absolute; top: 10px; right: 10px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px;">
                    ×
                </button>
            `;
        }
        
    } catch (error) {
        console.error('Error loading weather data:', error);
        const errorContent = `
            <div style="padding: 20px; text-align: center;">
                <div style="color: #dc3545; font-size: 48px;">⚠</div>
                <h3>Error al cargar datos</h3>
                <p>No se pudieron cargar los datos del clima.</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Cerrar
                </button>
            </div>
        `;
        
        const modal = document.getElementById('weather-modal');
        if (modal) {
            modal.innerHTML = errorContent;
        }
    }
}

// FUNCIÓN ACTUALIZADA: Mostrar modal
function showModal(content) {
    // Remover modal existente
    const existingModal = document.getElementById('weather-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'weather-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = content;
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
    `;
    overlay.id = 'modal-overlay';
    
    // Remover overlay existente
    const existingOverlay = document.getElementById('modal-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer click en el overlay
    overlay.addEventListener('click', () => {
        modal.remove();
        overlay.remove();
    });
    
    // Prevenir que el click en el modal cierre el overlay
    modal.addEventListener('click', (e) => e.stopPropagation());
}

// FUNCIÓN ACTUALIZADA: Mostrar pronóstico detallado
async function showDetailedWeather(lat, lng, locationName = 'Ubicación') {
    console.log('Loading detailed weather for:', lat, lng); // Debug
    
    const loadingContent = `
        <div style="padding: 30px; text-align: center;">
            <div class="loading" style="margin: 0 auto;"></div>
            <p>Cargando pronóstico extendido...</p>
        </div>
    `;
    showModal(loadingContent);

    try {
        const [current, forecast] = await Promise.all([
            WeatherService.getCurrentWeather(lat, lng),
            WeatherService.getForecast(lat, lng, 5)
        ]);
        
        if (!current || !forecast) {
            throw new Error('No se pudieron cargar los datos del clima');
        }
        
        let forecastHTML = `
            <div style="padding: 25px; max-width: 500px;">
                <h3 style="margin-top: 0; color: #007bff; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                    📅 Pronóstico 5 Días - ${locationName}
                </h3>
                
                <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin-top: 0;">🌡 Condiciones Actuales</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                        <div>Temperature: ${current.temperature}${current.units.temperature_2m}</div>
                        <div>Humedad: ${current.humidity}%</div>
                        <div>Viento: ${current.windSpeed} ${current.units.wind_speed_10m}</div>
                        <div>Precipitación: ${current.precipitation}${current.units.precipitation}</div>
                    </div>
                </div>
                
                <h4 style="color: #333;">Pronóstico Diario:</h4>
                <div style="max-height: 400px; overflow-y: auto;">
        `;
        
        forecast.forecast.forEach((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            
            const icon = WeatherService.getWeatherIcon({
                temperature: (day.temperatureMax + day.temperatureMin) / 2,
                precipitation: day.precipitation,
                cloudCover: day.cloudCover || 50
            });
            
            forecastHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                    <div style="flex: 1;">
                        <strong>${dayName}</strong><br>
                        <small style="color: #666;">${dateStr}</small>
                    </div>
                    <div style="flex: 1; text-align: center; font-size: 24px;">
                        ${icon}
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <strong>${day.temperatureMax}°</strong> / ${day.temperatureMin}°<br>
                        <small style="color: #666;">💧 ${day.precipitation}mm</small>
                    </div>
                </div>
            `;
        });
        
        forecastHTML += `
                </div>
                <div style="margin-top: 20px; padding: 10px; background: #e8f5e8; border-radius: 5px; font-size: 12px; text-align: center;">
                    📍 Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>
                    🌐 Datos proporcionados por <a href="https://open-meteo.com/" target="_blank" style="color: #007bff;">Open-Meteo</a>
                </div>
            </div>
        `;
        
        // Reemplazar el modal de carga
        const modal = document.getElementById('weather-modal');
        if (modal) {
            modal.innerHTML = forecastHTML + `
                <button onclick="this.parentElement.remove(); document.getElementById('modal-overlay').remove();" 
                        style="position: absolute; top: 10px; right: 10px; background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 16px;">
                    ×
                </button>
            `;
        }
        
    } catch (error) {
        console.error('Error loading detailed weather:', error);
        const errorContent = `
            <div style="padding: 30px; text-align: center;">
                <div style="color: #dc3545; font-size: 48px;">❌</div>
                <h3>Error al cargar pronóstico</h3>
                <p>No se pudieron cargar los datos del pronóstico extendido.</p>
                <button onclick="this.parentElement.parentElement.remove(); document.getElementById('modal-overlay').remove();" 
                        style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Cerrar
                </button>
            </div>
        `;
        
        const modal = document.getElementById('weather-modal');
        if (modal) {
            modal.innerHTML = errorContent;
        }
    }
}