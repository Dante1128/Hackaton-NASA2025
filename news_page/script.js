// La URL de tu endpoint de FastAPI
        const API_URL = 'http://127.0.0.1:8000/news/climate'; 
        const newsContainer = document.getElementById('newsContainer');
        const loadingIndicator = document.getElementById('loading');

        // URL de marcador de posición (fallback) si la noticia no tiene imagen
        const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/374151/ffffff?text=Sin+Imagen';

        /**
         * Función para obtener y mostrar las noticias desde el backend de FastAPI.
         */
        async function fetchClimateNews() {
            newsContainer.innerHTML = '';
            loadingIndicator.classList.remove('hidden');

            try {
                // Hacemos la solicitud fetch a tu API de FastAPI
                const response = await fetch(API_URL);

                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();
                loadingIndicator.classList.add('hidden');
                
                // CORRECCIÓN: Tu backend devuelve 'noticias', no 'articulos'.
                const articles = data.noticias;

                if (articles && articles.length > 0) {
                    articles.forEach(article => {
                        const articleElement = document.createElement('div');
                        articleElement.className = 'bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col md:flex-row gap-4';
                        
                        const date = new Date(article.fecha).toLocaleDateString('es-ES', { 
                            year: 'numeric', month: 'long', day: 'numeric' 
                        });
                        
                        // Determina la URL de la imagen, usando el fallback si no hay 'urlToImage'
                        const imageUrl = article.urlToImage || PLACEHOLDER_IMAGE;


                        articleElement.innerHTML = `
                            <img src="${imageUrl}" 
                                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';"
                                 class="w-full md:w-48 h-32 object-cover rounded-lg flex-shrink-0" 
                                 alt="Imagen de la noticia: ${article.titulo || 'Sin título'}">
                            
                            <div class="flex-grow">
                                <h2 class="text-xl font-semibold text-gray-800 mb-1">
                                    <a href="${article.url}" target="_blank" class="hover:text-blue-600">${article.titulo}</a>
                                </h2>
                                <p class="text-xs text-gray-500 mb-2">
                                    Fuente: <span class="font-medium">${article.fuente}</span> | Publicado: ${date}
                                </p>
                                <p class="text-gray-600 text-sm">${article.descripcion || 'Descripción no disponible.'}</p>
                            </div>
                        `;
                        newsContainer.appendChild(articleElement);
                    });
                } else {
                    newsContainer.innerHTML = '<p class="text-lg text-yellow-600">No se encontraron noticias de clima.</p>';
                }

            } catch (error) {
                loadingIndicator.classList.add('hidden');
                newsContainer.innerHTML = `<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p class="font-bold">Error de Conexión</p>
                    <p>No se pudo conectar al servidor de FastAPI en ${API_URL}. Asegúrate de que tu backend esté corriendo y la clave NEWS_API_KEY sea válida. Detalle: ${error.message}</p>
                </div>`;
                console.error("Error al obtener noticias:", error);
            }
        }

        // Cargar las noticias automáticamente cuando la página termine de cargar
        window.addEventListener('DOMContentLoaded', fetchClimateNews);