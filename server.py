from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from http import HTTPStatus
import httpx
import os
import logging
import json
from typing import List, Dict, Any
from functools import reduce

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "WARNING"),
)

app = FastAPI()

API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY not configured")

prompt = """
This image depicts a knitting pattern.
Look at this pattern and suggest 2-4 names for it based on what you see visually.
Consider the shapes, repetition, colors, and overall aesthetic. The names should describe any simple shapes if present, then be creative or evocative. Names should be three words or less.
Respond with the names only, no other content.
"""

class NamesRequest(BaseModel):
    image_data: str

@app.post("/api/names")
async def create_names(request: NamesRequest):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 200,
                    "messages": [{
                        "role": "user",
                        "content": [{
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": request.image_data,
                            }
                        }, {
                            "type": "text",
                            "text": prompt
                        }
                        ]
                    }
                    ],
                    "output_config": {
                        "format": {
                            "type": "json_schema",
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "names": {
                                        "type": "array",
                                        "items": { "type": "string" },
                                        "description": "List of suggested names",
                                    }
                                },
                                "required": ["names"],
                                "additionalProperties": False,
                            }
                        },
                    },
                },
            )
            data = response.raise_for_status().json()
            logging.debug(data)
            tool_uses = filter(lambda m: m.get("type") == "text", data.get("content"))
            tool_inputs = map(lambda m: json.loads(m.get("text")).get("names"), tool_uses)
            return list(reduce(lambda x, y: x + y, tool_inputs))
    except httpx.HTTPStatusError as e:
        logging.error(e.response.text)
        raise HTTPException(status_code=HTTPStatus.BAD_GATEWAY)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.mount("/", StaticFiles(directory="./assets", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = 8080
    do_reload = os.getenv("RELOAD", 'false').lower() in ('true', '1', 't')
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=do_reload)
