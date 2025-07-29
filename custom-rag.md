# Custom RAG Configuration Test

## Features Implemented

### 1. Agent Type Selection
- Added dropdown to select between "Search Agent" and "Custom RAG Model"
- State management for `agentType` with proper initialization

### 2. Document Upload
- File upload component supporting PDF, TXT, DOCX, JSON, CSV files
- Multiple file selection capability
- File list display with size information
- Remove individual files functionality

### 3. RAG Model Selection
- Dropdown with 4 model options:
  - Mistral-7B-Instruct (default)
  - Llama-3-8B-Instruct
  - TinyLlama-1.1B-Chat
  - OpenHermes-2.5-Mistral
- Dynamic descriptions showing model specifications and use cases

### 4. Chunking Configuration
- Chunking Strategy: SimpleNodeParser, FixedSize, SlidingWindow, Semantic
- Chunk Unit: Sentences, Paragraphs, Pages
- Chunk Size: 256, 512, 1024, custom (tokens)
- Chunk Overlap: 0, 50, 100, custom (tokens)

### 5. Embedding Model Selection
- 3 embedding model options:
  - BAAI/bge-small-en (default)
  - BAAI/bge-base-en-v1.5
  - intfloat/e5-small-v2
- Dynamic descriptions with dimensions and best use cases

### 6. Top K Results
- Slider from 1-20 results
- Real-time value display

### 7. Configuration Persistence
- Save configuration to database
- Load existing configurations
- Merge with existing agent configurations
- Support in AgentSelectionModal

## Testing Steps

1. Navigate to Agent Creation Page
2. Drag an Agent node to the canvas
3. Click on the agent node to open configuration panel
4. Select "Custom RAG Model" from Agent Type dropdown
5. Upload test documents
6. Configure RAG settings:
   - Select model
   - Set chunking parameters
   - Choose embedding model
   - Adjust top K results
7. Add system prompt and limitations
8. Save configuration
9. Test loading saved configuration

## Configuration Structure

```json
{
  "type": "agent",
  "agent": {
    "preset": "customRag",
    "customRag": {
      "model": "Mistral-7B-Instruct",
      "chunkingStrategy": "SimpleNodeParser",
      "chunkSize": 512,
      "chunkOverlap": 50,
      "chunkUnit": "Sentences",
      "embeddingModel": "BAAI/bge-small-en",
      "topKResults": 10,
      "documents": [
        {
          "name": "document.pdf",
          "size": 1024000,
          "type": "application/pdf",
          "lastModified": 1640995200000
        }
      ]
    },
    "systemPrompt": "You are a helpful assistant...",
    "limitations": "Do not provide medical advice..."
  }
}
```

## Next Steps

1. Implement actual document processing and storage
2. Add validation for required fields
3. Implement RAG pipeline integration
4. Add progress indicators for document processing
5. Add document preview functionality
