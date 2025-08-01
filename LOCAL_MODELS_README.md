# Local Models Setup for RAG Agents

This guide explains how to set up local GGUF models with GPU acceleration for RAG agents in the AutomationAgent application.

## Overview

RAG agents now use local GGUF models instead of requiring HuggingFace API keys. This provides:
- **Privacy**: All processing happens locally
- **Cost Efficiency**: No API costs
- **Performance**: GPU acceleration for faster inference
- **Offline Capability**: Works without internet connection

## Supported Models

The system supports these 4 local models:
- **Mistral-7B-Instruct** (`mistral.gguf`)
- **Llama-3-8B-Instruct** (`llama.gguf`)
- **TinyLlama-1.1B-Chat** (`tinyllama.gguf`)
- **OpenHermes-2.5-Mistral** (`openhermes.gguf`)

## Quick Setup

### 1. Run the Setup Script
```bash
./setup-ubuntu.sh OR
./setup-macos.sh
```

This script will:
- Install NVIDIA drivers and CUDA toolkit
- Create a Python virtual environment
- Install all required dependencies
- Set up the local model server

### 2. Copy Your Model Files
Copy your `.gguf` model files to the `models/` directory:
```bash
mkdir -p models/
cp /path/to/your/llama.gguf model/
```

### 3. Start the Local Model Server
```bash
./start_local_models.sh
```

The server will be available at `http://localhost:8000`

### 4. Configure RAG Agents
In the agent configuration panel:
1. Select "Custom RAG" preset
2. Choose your preferred local model
3. Configure other RAG settings as needed
4. **No API key required!**

## Manual Setup

If you prefer manual setup:

### Prerequisites
- Ubuntu 20.04+ or compatible Linux distribution
- NVIDIA GPU with CUDA support
- Python 3.10+
- At least 8GB GPU memory (recommended)

### Install Dependencies
```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install build tools and Python development headers
sudo apt update && sudo apt install -y build-essential cmake python3-dev

# Install PyTorch with CUDA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install base requirements first
pip install -r requirements.txt

# Install llama-cpp-python with CUDA support (using new GGML_CUDA flag)
CMAKE_ARGS="-DGGML_CUDA=on" pip install llama-cpp-python --force-reinstall --no-cache-dir --upgrade --no-binary llama-cpp-python

# Fix numpy compatibility issues
pip install numpy==2.2.0 --force-reinstall --no-cache-dir
```

### Start the Server
```bash
source venv/bin/activate
python local_model_server.py
```

## API Endpoints

The local model server provides these endpoints:

- `GET /` - Health check
- `GET /models` - List available models
- `POST /chat` - Generate chat completion
- `GET /docs` - API documentation

## Configuration

### Model Selection
In the RAG agent configuration:
- **mistral**: Best balance of performance and quality
- **llama**: High quality responses, requires more GPU memory
- **tinyllama**: Fastest inference, lower quality
- **openhermes**: Good for conversational tasks

### Performance Tuning
Edit `local_model_server.py` to adjust:
- `n_ctx`: Context length (default: 4096)
- `n_gpu_layers`: Number of layers on GPU (-1 for all)
- `temperature`: Response randomness (0.1-1.0)

## Troubleshooting

### Server Won't Start
1. Check if port 8000 is available:
   ```bash
   lsof -i :8000
   ```

2. Verify CUDA installation:
   ```bash
   nvidia-smi
   nvcc --version
   ```

3. Check model files exist:
   ```bash
   ls -la models/
   ```

### Out of Memory Errors
1. Reduce context length in `local_model_server.py`
2. Use a smaller model (tinyllama)
3. Reduce `n_gpu_layers` parameter

### Slow Performance
1. Ensure CUDA is properly installed
2. Check GPU utilization: `nvidia-smi`
3. Increase `n_gpu_layers` to -1
4. Use a faster model (tinyllama)

## Testing

Test the setup:
```bash
# Test server connection
curl http://localhost:8000/

# Test model availability
curl http://localhost:8000/models

# Test chat completion
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

## Integration with AutomationAgent

1. **Start the local model server** before using RAG agents
2. **Configure RAG agents** to use local models
3. **Test with datasets** - no API keys needed
4. **Monitor performance** through server logs

The application will automatically detect and use the local model server for RAG agents while continuing to use Gemini API for other agent types.

## File Structure

```
AutomationAgent/
├── models/                    # Model files (.gguf)
├── venv/                     # Python virtual environment
├── requirements.txt          # Python dependencies
├── setup-ubuntu.sh          # Setup script
├── start_local_models.sh     # Server startup script
├── local_model_server.py     # Local model server
└── src/services/localModelApi.ts  # Frontend API client
```

## Support

For issues:
1. Check the server logs
2. Verify model files are present
3. Ensure CUDA is working
4. Check the AutomationAgent console for errors

The local model setup provides a complete offline solution for RAG agents with GPU acceleration!

## Removing Proxies
Run sudo nano /etc/apt/apt.conf

Remove the following lines:
Acquire::http::Proxy "http://proxy8.ma.panasonic.com.sg:8080";
Acquire::https::Proxy "https://proxy8.ma.panasonic.com.sg:8080";