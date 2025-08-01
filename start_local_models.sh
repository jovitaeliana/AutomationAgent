#!/bin/bash
# Startup script for local model server

echo "🚀 Starting Local Model Server..."

# Activate virtual environment
source venv/bin/activate

# Check if Mistral model exists (used for all model types)
echo "📁 Checking for Mistral model file..."

if [ -f "./models/mistral.gguf" ]; then
    echo "✅ Mistral model found (used for all model types)"
    echo "📊 All model requests will use Mistral to save space"
else
    echo "⚠️  Mistral model not found in ./models/ directory"
    echo "Please copy your mistral.gguf file to the models directory:"
    echo "  - mistral.gguf"
    echo ""
    echo "Note: All model types (Llama, TinyLlama, OpenHermes) will use Mistral to save space."
    exit 1
fi

# Start the server
python local_model_server.py
