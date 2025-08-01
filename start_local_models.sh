#!/bin/bash
# Startup script for local model server

echo "🚀 Starting Local Model Server..."

# Activate virtual environment
source venv/bin/activate

# Check if Mistral model exists (used for all model types)
echo "📁 Checking for Llama model file..."

if [ -f "./models/llama.gguf" ]; then
    echo "✅ Llama model found (used for all model types)"
    echo "📊 All model requests will use Llama to save space"
else
    echo "⚠️  Llama model not found in ./models/ directory"
    echo "Please copy your llama.gguf file to the models directory:"
    echo "  - llama.gguf"
    echo ""
    echo "Note: All model types (Mistral, TinyLlama, OpenHermes) will use Llama to save space."
    exit 1
fi

# Start the server
python local_model_server.py
