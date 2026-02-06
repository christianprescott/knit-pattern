from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from http import HTTPStatus
import httpx
import os
from typing import List, Dict, Any
from functools import reduce

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
                    "tools": [{
                        "name": "pattern_names",
                        "description": "Suggest names for the submitted pattern",
                        "input_schema": {
                            "type": "object",
                            "properties": {
                                "names": {
                                    "type": "array",
                                    "items": { "type": "string" },
                                    "description": "List of suggested names",
                                }
                            },
                            "required": ["names"],
                        }
                    }],
                    "tool_choice": { "type": "tool", "name": "pattern_names" }
                },
            )
            response.raise_for_status()
            tool_uses = filter(lambda m: m.get("type") == "tool_use", response.json().get("content"))
            tool_inputs = map(lambda m: m.get("input").get("names"), tool_uses)
            flat = reduce(lambda x, y: x + y, tool_inputs)
            return list(flat)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=HTTPStatus.BAD_GATEWAY)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.mount("/", StaticFiles(directory="./assets", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
