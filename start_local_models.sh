#!/bin/bash
# Startup script for local model server

echo "🚀 Starting Local Model Server..."

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
