// Servicio para Open-Meteo API
const WeatherService = {
    // URLs base de la API
    baseUrls: {
        forecast: 'https://api.open-meteo.com/v1/forecast',
        airQuality: 'https://air-quality-api.open-meteo.com/v1/air-quality',
        historical: 'https://historical-api.open-meteo.com/v1/historical'
    },

    // Variables disponibles en la API
    variables: {
        temperature: 'temperature_2m',
        precipitation: 'precipitation',
        humidity: 'relative_humidity_2m',
        windSpeed: 'wind_speed_10m',
        windDirection: 'wind_direction_10m',
        pressure: 'surface_pressure',
        cloudCover: 'cloud_cover',
        uvIndex: 'uv_index'
    },

    // Obtener datos climáticos actuales
    async getCurrentWeather(lat, lng) {
        try {
            const response = await fetch(
                `${this.baseUrls.forecast}?latitude=${lat}&longitude=${lng}&current=${Object.values(this.variables).join(',')}&timezone=auto`
            );
            
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            return this.formatCurrentWeatherData(data);
        } catch (error) {
            console.error('Error fetching current weather:', error);
            return null;
        }
    },

    // Obtener pronóstico extendido
    async getForecast(lat, lng, days = 7) {
        try {
            const response = await fetch(
                `${this.baseUrls.forecast}?latitude=${lat}&longitude=${lng}&daily=${Object.values(this.variables).join(',')}&timezone=auto&forecast_days=${days}`
            );
            
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            return this.formatForecastData(data);
        } catch (error) {
            console.error('Error fetching forecast:', error);
            return null;
        }
    },

    // Obtener datos históricos (últimos 5 días)
    async getHistoricalWeather(lat, lng, pastDays = 5) {
        try {
            const response = await fetch(
                `${this.baseUrls.forecast}?latitude=${lat}&longitude=${lng}&daily=${Object.values(this.variables).join(',')}&timezone=auto&past_days=${pastDays}`
            );
            
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            return this.formatHistoricalData(data);
        } catch (error) {
            console.error('Error fetching historical weather:', error);
            return null;
        }
    },

    // Formatear datos climáticos actuales
    formatCurrentWeatherData(data) {
        if (!data.current) return null;

        return {
            timestamp: data.current.time,
            temperature: data.current.temperature_2m,
            precipitation: data.current.precipitation,
            humidity: data.current.relative_humidity_2m,
            windSpeed: data.current.wind_speed_10m,
            windDirection: data.current.wind_direction_10m,
            pressure: data.current.surface_pressure,
            cloudCover: data.current.cloud_cover,
            uvIndex: data.current.uv_index,
            units: data.current_units
        };
    },

    // Formatear datos de pronóstico
    formatForecastData(data) {
        if (!data.daily) return null;

        const forecast = [];
        for (let i = 0; i < data.daily.time.length; i++) {
            forecast.push({
                date: data.daily.time[i],
                temperatureMax: data.daily.temperature_2m_max?.[i],
                temperatureMin: data.daily.temperature_2m_min?.[i],
                precipitation: data.daily.precipitation_sum?.[i],
                humidity: data.daily.relative_humidity_2m_max?.[i],
                windSpeed: data.daily.wind_speed_10m_max?.[i],
                uvIndex: data.daily.uv_index_max?.[i]
            });
        }

        return {
            forecast,
            units: data.daily_units
        };
    },

    // Formatear datos históricos
    formatHistoricalData(data) {
        return this.formatForecastData(data); // Mismo formato que forecast
    },

    // Obtener resumen del clima para mostrar en tooltips
    async getWeatherSummary(lat, lng) {
        const current = await this.getCurrentWeather(lat, lng);
        if (!current) return 'Datos no disponibles';

        return `🌡️ ${current.temperature}${current.units.temperature_2m} | 💧 ${current.humidity}% | 💨 ${current.windSpeed}${current.units.wind_speed_10m}`;
    },

    // Obtener icono del clima basado en condiciones
    getWeatherIcon(weatherData) {
        if (!weatherData) return '❓';
        
        const temp = weatherData.temperature;
        const precip = weatherData.precipitation;
        const cloudCover = weatherData.cloudCover;

        if (precip > 5) return '🌧️';
        if (precip > 0.5) return '🌦️';
        if (cloudCover > 70) return '☁️';
        if (cloudCover > 30) return '⛅';
        if (temp > 25) return '☀️';
        if (temp < 0) return '❄️';
        
        return '🌤️';
    }
};