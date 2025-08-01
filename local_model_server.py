#!/usr/bin/env python3
"""
Local Model Server for RAG Agents (macOS Metal)
Provides API endpoints for local GGUF models with Metal acceleration
"""

import os
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_cpp import Llama

app = FastAPI(title="Local Model Server", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Model configurations
MODELS = {
    "mistral": {
        "path": "./models/llama.gguf",
        "name": "Llama-3-8B-Instruct",
        "context_length": 4096
    },
    "llama": {
        "path": "./models/llama.gguf",
        "name": "Llama-3-8B-Instruct",
        "context_length": 4096
    },
    "tinyllama": {
        "path": "./models/llama.gguf",
        "name": "Llama-3-8B-Instruct",
        "context_length": 4096
    },
    "openhermes": {
        "path": "./models/llama.gguf",
        "name": "Llama-3-8B-Instruct",
        "context_length": 4096
    }
}

# Global model instances
loaded_models: Dict[str, Llama] = {}

class ChatRequest(BaseModel):
    model: str
    messages: List[Dict[str, str]]
    temperature: float = 0.7
    max_tokens: int = 1024

class ChatResponse(BaseModel):
    model: str
    response: str
    usage: Dict[str, int]

def load_model(model_key: str) -> Llama:
    """Load a model if not already loaded"""
    if model_key in loaded_models:
        return loaded_models[model_key]
    
    if model_key not in MODELS:
        raise HTTPException(status_code=404, detail=f"Model {model_key} not found")
    
    model_config = MODELS[model_key]
    model_path = model_config["path"]
    
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404, 
            detail=f"Model file not found: {model_path}"
        )
    
    n_gpu_layers = 55 
    
    try:
        model = Llama(
            model_path=model_path,
            n_ctx=model_config["context_length"],
            n_gpu_layers=n_gpu_layers,
            verbose=False
        )
        loaded_models[model_key] = model
        return model
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Local Model Server is running"}

@app.options("/")
async def root_options():
    return {"message": "Local Model Server is running"}

@app.get("/models")
async def list_models():
    """List available models"""
    available_models = []
    for key, config in MODELS.items():
        available_models.append({
            "id": key,
            "name": config["name"],
            "available": os.path.exists(config["path"])
        })
    return {"models": available_models}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate chat completion"""
    try:
        model = load_model(request.model)
        
        # Format messages for the model
        prompt = ""
        for message in request.messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "system":
                prompt += f"System: {content}\n"
            elif role == "user":
                prompt += f"User: {content}\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n"
        
        prompt += "Assistant: "
        
        # Generate response
        response = model(
            prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            stop=["User:", "System:"],
            echo=False
        )
        
        generated_text = response["choices"][0]["text"].strip()
        
        return ChatResponse(
            model=request.model,
            response=generated_text,
            usage={
                "prompt_tokens": response["usage"]["prompt_tokens"],
                "completion_tokens": response["usage"]["completion_tokens"],
                "total_tokens": response["usage"]["total_tokens"]
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Local Model Server...")
    print("📍 Server will be available at http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
