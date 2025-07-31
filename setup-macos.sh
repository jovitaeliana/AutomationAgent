#!/bin/bash

# Setup script for macOS with Metal support for local LLM models
# This script sets up the environment for running local models with Metal acceleration

set -e  # Exit on any error

echo "🚀 Setting up Local LLM Environment with Metal Support"
echo "===================================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  Error: This script is designed for macOS only."
    exit 1
fi

# Install Xcode Command Line Tools if not present
echo "🔧 Checking Xcode Command Line Tools..."
if ! xcode-select -p &>/dev/null; then
  echo "Installing Xcode Command Line Tools..."
  xcode-select --install
  echo "Please rerun this script after Xcode tools installation completes."
  exit 1
else
    echo "✅ Xcode Command Line Tools are already installed"
fi

# Install cmake if not present
echo "🔨 Checking cmake installation..."
if ! command -v cmake &>/dev/null; then
  if ! command -v brew &>/dev/null; then
    echo "Homebrew not found. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  echo "Installing cmake via Homebrew..."
  brew install cmake
else
    echo "✅ cmake is already installed"
fi

# Check Python installation
echo "🐍 Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "Installing Python via Homebrew..."
    brew install python
else
    echo "✅ Python is already installed"
fi

# Create virtual environment
echo "🌐 Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📈 Upgrading pip and tools..."
pip3 install --upgrade pip setuptools wheel
pip3 install -r requirements.txt

# Install llama-cpp-python with Metal support for Apple Silicon
echo "🦙 Installing llama-cpp-python with Metal support..."
echo "   Note: Using Metal backend for Apple Silicon acceleration"
CMAKE_ARGS="-DLLAMA_METAL=ON" pip3 install llama-cpp-python --force-reinstall --no-cache-dir --upgrade --no-binary llama-cpp-python

# Fix numpy compatibility issues
echo "🔧 Fixing numpy compatibility..."
pip3 install numpy==2.2.0 --force-reinstall --no-cache-dir

# Create models directory
echo "📁 Creating models directory..."
mkdir -p models
echo "✅ Models directory created at ./models"

# Create local model server script
echo "🖥️  Creating local model server..."
cat > local_model_server.py << 'EOF'
#!/usr/bin/env python3
"""
Local Model Server for RAG Agents (macOS Metal)
Provides API endpoints for local GGUF models with Metal acceleration
"""

import os
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_cpp import Llama

app = FastAPI(title="Local Model Server (macOS)", version="1.0.0")

# Model configurations
MODELS = {
    "mistral": {
        "path": "./models/mistral.gguf",
        "name": "Mistral-7B-Instruct",
        "context_length": 4096
    },
    "llama": {
        "path": "./models/llama.gguf", 
        "name": "Llama-3-8B-Instruct",
        "context_length": 4096
    },
    "tinyllama": {
        "path": "./models/tinyllama.gguf",
        "name": "TinyLlama-1.1B-Chat", 
        "context_length": 2048
    },
    "openhermes": {
        "path": "./models/openhermes.gguf",
        "name": "OpenHermes-2.5-Mistral",
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
    
    # Use Metal acceleration on Apple Silicon
    n_gpu_layers = -1  # Use all layers on Metal
    
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
    return {"message": "Local Model Server (macOS Metal) is running"}

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
    print("🚀 Starting Local Model Server (macOS Metal)...")
    print("📍 Server will be available at http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

chmod +x local_model_server.py

# Create startup script
echo "🎬 Creating startup script..."
cat > start_local_models.sh << 'EOF'
#!/bin/bash
# Startup script for local model server (macOS)

echo "🚀 Starting Local Model Server (macOS Metal)..."

# Activate virtual environment
source venv/bin/activate

# Check if models exist
echo "📁 Checking for model files..."
models_found=0

if [ -f "./models/mistral.gguf" ]; then
    echo "✅ Mistral model found"
    ((models_found++))
fi

if [ -f "./models/llama.gguf" ]; then
    echo "✅ Llama model found"
    ((models_found++))
fi

if [ -f "./models/tinyllama.gguf" ]; then
    echo "✅ TinyLlama model found"
    ((models_found++))
fi

if [ -f "./models/openhermes.gguf" ]; then
    echo "✅ OpenHermes model found"
    ((models_found++))
fi

if [ $models_found -eq 0 ]; then
    echo "⚠️  No model files found in ./models/ directory"
    echo "Please copy your .gguf files to the models directory:"
    echo "  - mistral.gguf"
    echo "  - llama.gguf" 
    echo "  - tinyllama.gguf"
    echo "  - openhermes.gguf"
    exit 1
fi

echo "📊 Found $models_found model(s)"

# Start the server
python local_model_server.py
EOF

chmod +x start_local_models.sh

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Copy your .gguf model files to the ./models/ directory:"
echo "   - mistral.gguf (your Mistral model)"
echo "   - llama.gguf (your Llama model)"
echo "   - tinyllama.gguf (your TinyLlama model)"
echo "   - openhermes.gguf (your OpenHermes model)"
echo ""
echo "2. Start the local model server:"
echo "   ./start_local_models.sh"
echo ""
echo "3. The server will be available at http://localhost:8000"
echo "   API documentation: http://localhost:8000/docs"
echo ""
echo "🔧 To activate the virtual environment manually:"
echo "   source venv/bin/activate"
echo ""
echo "🍎 This setup uses Metal acceleration for Apple Silicon Macs"
echo "   For Intel Macs, change CMAKE_ARGS to \"-DGGML_CUDA=on\" if you have CUDA"
echo ""