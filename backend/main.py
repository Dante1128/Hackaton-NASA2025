from dotenv import dotenv_values
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
import requests

config = dotenv_values(".env")  # lee las variables desde el archivo .env

app = FastAPI()

# Enlace con gemini
class GenerateRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(req: GenerateRequest):
    client = genai.Client(api_key=config["GOOGLE_API_KEY"])
    response = await client.aio.models.generate_content(
        model=config.get("DEFAULT_MODEL", "gemini-2.5-flash"),
        contents=req.prompt
    )
    return {"response": response.text}


# Peticion con la API de noticias
BASE_URL = "https://newsapi.org/v2/everything"
NEWS_API_KEY = config.get("NEWS_API_KEY")


@app.get("/news/climate")
def get_climate_news():
    if not NEWS_API_KEY:
        raise HTTPException(status_code=500, detail="Falta NEWS_API_KEY en el archivo .env")

    params = {
        "q": "cambio climatico",  # palabras clave
        "language": "es",                              # idioma español
        "sortBy": "publishedAt",                       # ordenar por fecha
        "pageSize": 15,                                 # máximo 5 resultados
        "apiKey": NEWS_API_KEY
    }

    response = requests.get(BASE_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Error al obtener las noticias")

    data = response.json()

    # extraer solo los datos útiles
    results = [
        {
            "titulo": article["title"],
            "descripcion": article["description"],
            "fuente": article["source"]["name"],
            "url": article["url"],
            "urlToImage": article["urlToImage"],
            "fecha": article["publishedAt"]
        }
        for article in data.get("articles", [])
    ]

    return {"total": len(results), "noticias": results}