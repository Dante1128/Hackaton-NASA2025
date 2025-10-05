from dotenv import dotenv_values
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
import requests

# Importación necesaria para el manejo de CORS
from fastapi.middleware.cors import CORSMiddleware 

# --- Configuración y Constantes ---
config = dotenv_values(".env")  # lee las variables desde el archivo .env
BASE_URL = "https://newsapi.org/v2/everything"
# La clave debe leerse dentro del scope principal
NEWS_API_KEY = config.get("NEWS_API_KEY") 

app = FastAPI()

# --- Configuración CORS ---
# ⚠️ ADVERTENCIA: En desarrollo, permitimos todos los orígenes ("*"). 
# Esto incluye tu frontend local (ej: http://localhost:3000, http://127.0.0.1:5500).
# En un entorno de producción, DEBES especificar la URL de tu frontend.
origins = [
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Orígenes permitidos (necesario para el frontend local)
    allow_credentials=True,      # Permite cookies, autenticación, etc.
    allow_methods=["*"],         # Permite métodos HTTP (GET, POST, etc.)
    allow_headers=["*"],         # Permite todos los encabezados
)

# --- Modelos Pydantic ---
class GenerateRequest(BaseModel):
    """Modelo para la solicitud de generación de contenido (Gemini)."""
    prompt: str

# --- Endpoint Gemini ---
@app.post("/generate")
async def generate(req: GenerateRequest):
    """
    Endpoint para generar contenido utilizando la API de Gemini.
    """
    if "GOOGLE_API_KEY" not in config:
        raise HTTPException(status_code=500, detail="Falta GOOGLE_API_KEY en el archivo .env")

    client = genai.Client(api_key=config["GOOGLE_API_KEY"])
    
    try:
        response = await client.aio.models.generate_content(
            model=config.get("DEFAULT_MODEL", "gemini-2.5-flash"),
            contents=req.prompt
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en la llamada a la API de Gemini: {e}"
        )


# --- Endpoint Noticias (NewsAPI) ---
@app.get("/news/climate")
def get_climate_news():
    """
    Obtiene noticias sobre el cambio climático usando la API de NewsAPI.
    """
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="Falta NEWS_API_KEY en el archivo .env")

    params = {
        "q": "cambio climatico",  
        "language": "es",          
        "sortBy": "publishedAt",   
        "pageSize": 15,             
        "apiKey": NEWS_API_KEY
    }

    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status() # Lanza error si el status code no es 2xx
        
        data = response.json()
    
        # extraer solo los datos útiles
        results = [
            {
                "titulo": article["title"],
                "descripcion": article["description"],
                "fuente": article["source"]["name"],
                "url": article["url"],
                "urlToImage": article.get("urlToImage"), # Usamos .get por si falta
                "fecha": article["publishedAt"]
            }
            for article in data.get("articles", [])
        ]
    
        return {"total": len(results), "noticias": results}
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error de red o API al obtener noticias: {e}"
        )
