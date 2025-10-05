from dotenv import dotenv_values
from fastapi import FastAPI
from pydantic import BaseModel
from google import genai

config = dotenv_values(".env")  # lee las variables desde el archivo .env

app = FastAPI()

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
