#!/bin/bash

# Setup script for Ubuntu with GPU support for local LLM models
# This script sets up the environment for running local models with GPU acceleration

set -e  # Exit on any error

echo "🚀 Setting up Local LLM Environment with GPU Support"
echo "=================================================="

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo "⚠️  Warning: This script is designed for Ubuntu. Proceed with caution on other distributions."
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+ if not available
echo "🐍 Checking Python installation..."
if ! command -v python3.11 &> /dev/null; then
    echo "Installing Python 3.11..."
    sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
else
    echo "✅ Python 3.11+ is already installed"
fi

# Install NVIDIA drivers and CUDA if not present
echo "🎮 Checking NVIDIA GPU setup..."
if ! command -v nvidia-smi &> /dev/null; then
    echo "Installing NVIDIA drivers..."
    sudo apt install -y nvidia-driver-535 nvidia-dkms-535
    echo "⚠️  NVIDIA drivers installed. Please reboot and run this script again."
    exit 1
else
    echo "✅ NVIDIA drivers are installed"
    nvidia-smi
fi

# Install CUDA Toolkit
echo "🔧 Checking CUDA installation..."
if ! command -v nvcc &> /dev/null; then
    echo "Installing CUDA Toolkit..."
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.0-1_all.deb
    sudo dpkg -i cuda-keyring_1.0-1_all.deb
    sudo apt update
    sudo apt install -y cuda-toolkit-12-2
    echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
    source ~/.bashrc
else
    echo "✅ CUDA is already installed"
fi

# Install build essentials and development tools
echo "🔨 Installing build tools..."
sudo apt update && sudo apt install -y build-essential cmake python3-dev git wget curl

# Create virtual environment
echo "🌐 Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3.11 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📈 Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install PyTorch with CUDA support
echo "🔥 Installing PyTorch with CUDA support..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install base requirements first
echo "📚 Installing base requirements..."
pip install -r requirements.txt

# Install llama-cpp-python with CUDA support (using new GGML_CUDA flag)
echo "🦙 Installing llama-cpp-python with CUDA support..."
CMAKE_ARGS="-DGGML_CUDA=on" pip install llama-cpp-python --force-reinstall --no-cache-dir --upgrade --no-binary llama-cpp-python

# Fix numpy compatibility issues
echo "🔧 Fixing numpy compatibility..."
pip install numpy==2.2.0 --force-reinstall --no-cache-dir

# Create models directory
echo "📁 Creating models directory..."
mkdir -p models
echo "✅ Models directory created at ./models"

# Create local model server script
echo "🖥️  Creating local model server..."
cat > local_model_server.py << 'EOF'
#!/usr/bin/env python3
"""
Local Model Server for RAG Agents
Provides API endpoints for local GGUF models with GPU acceleration
"""

import os
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from llama_cpp import Llama
import torch

app = FastAPI(title="Local Model Server", version="1.0.0")

# Model configurations - Using only Mistral to save space
MODELS = {
    "mistral": {
        "path": "./models/llama.gguf",
        "name": "Mistral-7B-Instruct",
        "context_length": 4096
    },
    # All other models redirect to Mistral to save space
    "llama": {
        "path": "./models/llama.gguf",
        "name": "Mistral-7B-Instruct",
        "context_length": 4096
    },
    "tinyllama": {
        "path": "./models/llama.gguf",
        "name": "Mistral-7B-Instruct",
        "context_length": 4096
    },
    "openhermes": {
        "path": "./models/llama.gguf",
        "name": "Mistral-7B-Instruct",
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
    
    # Check if CUDA is available
    n_gpu_layers = -1 if torch.cuda.is_available() else 0
    
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
EOF

chmod +x local_model_server.py

# Create startup script
echo "🎬 Creating startup script..."
cat > start_local_models.sh << 'EOF'
#!/bin/bash
# Startup script for local model server

echo "🚀 Starting Local Model Server..."

# Activate virtual environment
source venv/bin/activate

# Check if models exist
echo "📁 Checking for model files..."
models_found=0

if [ -f "./models/llama.gguf" ]; then
    echo "✅ Llama model found (used for all model types)"
    models_found=1
else
    echo "⚠️  Mistral model not found in ./models/ directory"
    echo "Please copy your llama.gguf file to the models directory:"
    echo "  - llama.gguf"
    echo ""
    echo "Note: All model types (Mistral, TinyLlama, OpenHermes) will use Llama to save space."
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
echo "1. Copy your Llama model file to the ./models/ directory:"
echo "   - llama.gguf (used for all model types to save space)"
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
echo "⚠️  If you installed NVIDIA drivers for the first time, please reboot your system."
