from fastapi import FastAPI, HTTPException, Request
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

# Limit request body size
MAX_REQUEST_SIZE = 1024 * 1024  # 1MB
@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            raise HTTPException(
                status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                detail=f"Request body too large: {int(content_length) / 1024 / 1024:.1f}MB (max {MAX_REQUEST_SIZE / 1024 / 1024}MB)"
            )
    return await call_next(request)

API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY not configured")

prompt = """
This image depicts a knitting pattern. Look at this pattern and suggest 2-4 names for it based on what you see visually.
The image appears as a grid of cells but the presence of the cells and borders should be minimized in your visualization. Avoid descriptors like "grid", "tiles", "squares", or similar.
Imagine the pattern having a more organic appearance when knitted.
Consider the colors, repetition, and overall aesthetic. The names should describe any simple shapes if present, then be creative or evocative. Names must be three words or less.
Respond with the names array only, no other content.
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
