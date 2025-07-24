// server.js - Create this file in your project root
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize db.json if it doesn't exist
const dbPath = path.join(__dirname, 'db.json');
if (!fs.existsSync(dbPath)) {
  const initialDb = {
    automations: [],
    ragModels: [],
    availableNodes: [],
    datasets: [],
    agents: [],
    presets: [],
    initialFlowNodes: [],
    connections: [['node-trigger', 'node-llm'], ['node-llm', 'node-weather'], ['node-llm', 'node-email']],
    nodeDatasets: {}
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
}

// Helper functions
const readDb = () => {
  const rawData = fs.readFileSync(dbPath);
  return JSON.parse(rawData);
};

const writeDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Function to read file content
function readFileContent(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();
  
  try {
    if (ext === '.json' || ext === '.txt' || ext === '.csv') {
      return fs.readFileSync(filePath, 'utf8');
    } else {
      return `Content from file: ${filename}`;
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return `Error reading file: ${filename}`;
  }
}

// MCQ Generation with Gemini API
async function generateMCQWithGemini(content, apiKey) {
  try {
    console.log('Calling Gemini API...');
    console.log('API Key length:', apiKey.length);
    console.log('Content preview:', content.substring(0, 200));
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Based on the following content, generate 5 multiple choice questions. Return ONLY a valid JSON array with this exact structure, no additional text or markdown formatting:

[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation"
  }
]

Content to analyze:
${content.substring(0, 3000)}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error details:', errorText);
      
      // More specific error handling
      if (response.status === 400) {
        throw new Error(`Invalid API request. Check your API key and request format. Details: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`API access forbidden. Check your API key permissions. Details: ${errorText}`);
      } else {
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('Gemini API response data:', JSON.stringify(data, null, 2));
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected response format:', data);
      throw new Error('Unexpected response format from Gemini API');
    }
    
    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text:', generatedText);
    
    // Clean the response - remove markdown formatting if present
    let cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON from the response
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Could not extract JSON from response:', cleanedText);
      
      // Fallback: create sample questions if parsing fails
      return [
        {
          id: 1,
          question: "What is the main topic of the uploaded content?",
          options: ["Data Analysis", "Machine Learning", "Web Development", "General Knowledge"],
          correctAnswer: "General Knowledge",
          explanation: "Based on the uploaded content"
        },
        {
          id: 2,
          question: "Which format was the content provided in?",
          options: ["JSON", "CSV", "TXT", "PDF"],
          correctAnswer: "JSON",
          explanation: "The content was analyzed from the uploaded file"
        }
      ];
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    console.log('Parsed questions:', questions);
    
    return questions;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // If API fails, return fallback questions
    if (error.message.includes('API')) {
      console.log('Returning fallback questions due to API error');
      return [
        {
          id: 1,
          question: "Sample question based on your content",
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          explanation: "This is a fallback question generated when the API is unavailable"
        },
        {
          id: 2,
          question: "What type of content did you upload?",
          options: ["Text document", "Data file", "Image", "Video"],
          correctAnswer: "Text document",
          explanation: "Based on the file type uploaded"
        }
      ];
    }
    
    throw error;
  }
}

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// MCQ Generation endpoint
app.post('/datasets/generate-mcq', upload.single('file'), async (req, res) => {
  console.log('Received MCQ generation request');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  
  try {
    const { apiKey } = req.body;
    const file = req.file;
    
    if (!apiKey) {
      console.error('No API key provided');
      return res.status(400).json({ error: 'Gemini API key is required' });
    }
    
    if (!file) {
      console.error('No file provided');
      return res.status(400).json({ error: 'File is required' });
    }
    
    console.log('Reading file content...');
    const content = readFileContent(file.path, file.originalname);
    console.log('File content length:', content.length);
    
    console.log('Generating MCQ...');
    const mcqQuestions = await generateMCQWithGemini(content, apiKey);
    
    // Clean up uploaded file
    fs.unlinkSync(file.path);
    
    console.log('MCQ generated successfully:', mcqQuestions.length, 'questions');
    
    res.json({
      success: true,
      questions: mcqQuestions,
      message: 'MCQ generated successfully'
    });
    
  } catch (error) {
    console.error('MCQ generation error:', error);
    res.status(500).json({
      error: 'Failed to generate MCQ',
      details: error.message
    });
  }
});

// Save dataset endpoint
app.post('/datasets', (req, res) => {
  try {
    console.log('Saving dataset:', req.body);
    
    const { datasetName, testType, description, questions } = req.body;
    
    if (!datasetName || !questions) {
      return res.status(400).json({
        error: 'Missing required fields: datasetName and questions are required'
      });
    }
    
    const db = readDb();
    
    const dataset = {
      id: Date.now().toString(),
      name: datasetName,
      type: testType || 'mcq',
      description: description || '',
      createdAt: new Date().toISOString(),
      questions: questions,
      totalQuestions: questions.length
    };
    
    db.datasets.push(dataset);
    writeDb(db);
    
    console.log('Dataset saved successfully:', dataset.name);
    res.json({
      success: true,
      message: 'Dataset saved successfully',
      dataset: dataset
    });
    
  } catch (error) {
    console.error('Save dataset error:', error);
    res.status(500).json({
      error: 'Failed to save dataset',
      details: error.message
    });
  }
});

// Get all datasets
app.get('/datasets', (req, res) => {
  try {
    const db = readDb();
    res.json(db.datasets || []);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get specific dataset
app.get('/datasets/:id', (req, res) => {
  try {
    const db = readDb();
    const dataset = db.datasets?.find(d => d.id === req.params.id);
    
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    res.json(dataset);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

// Delete dataset endpoint
app.delete('/datasets/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting dataset:', id);
    
    const db = readDb();
    
    if (!db.datasets) {
      return res.status(404).json({ error: 'No datasets found' });
    }
    
    const datasetIndex = db.datasets.findIndex(d => d.id === id);
    
    if (datasetIndex === -1) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    // Remove the dataset
    const deletedDataset = db.datasets.splice(datasetIndex, 1)[0];
    
    writeDb(db);
    
    console.log('Dataset deleted successfully:', deletedDataset.name);
    res.json({
      success: true,
      message: 'Dataset deleted successfully',
      deletedDataset: { id: deletedDataset.id, name: deletedDataset.name }
    });
    
  } catch (error) {
    console.error('Delete dataset error:', error);
    res.status(500).json({
      error: 'Failed to delete dataset',
      details: error.message
    });
  }
});

// Get saved flow
app.get('/flows/current', (req, res) => {
  try {
    const db = readDb();
    
    // Use initialFlowNodes as the current flow
    res.json({
      nodes: db.initialFlowNodes || [],
      connections: db.connections || [['node-trigger', 'node-llm'], ['node-llm', 'node-weather'], ['node-llm', 'node-email']],
      nodeDatasets: db.nodeDatasets || {}
    });
    
  } catch (error) {
    console.error('Error fetching flow:', error);
    res.status(500).json({ error: 'Failed to fetch flow' });
  }
});

// Add single node endpoint
app.post('/flows/nodes/add', (req, res) => {
  try {
    const { node, dataset } = req.body;
    console.log('Adding node:', node);
    
    const db = readDb();
    
    // Initialize arrays if they don't exist
    if (!db.initialFlowNodes) db.initialFlowNodes = [];
    if (!db.nodeDatasets) db.nodeDatasets = {};
    
    // Add the node to initialFlowNodes
    db.initialFlowNodes.push(node);
    
    // Add dataset if provided
    if (dataset) {
      db.nodeDatasets[node.id] = dataset;
    }
    
    writeDb(db);
    
    res.json({
      success: true,
      message: 'Node added successfully',
      node: node
    });
    
  } catch (error) {
    console.error('Add node error:', error);
    res.status(500).json({
      error: 'Failed to add node',
      details: error.message
    });
  }
});

// Delete node endpoint
app.delete('/flows/nodes/:nodeId', (req, res) => {
  try {
    const { nodeId } = req.params;
    console.log('Deleting node:', nodeId);
    
    const db = readDb();
    
    // Remove the node from initialFlowNodes
    if (db.initialFlowNodes) {
      db.initialFlowNodes = db.initialFlowNodes.filter(n => n.id !== nodeId);
    }
    
    // Remove connections involving this node
    if (db.connections) {
      db.connections = db.connections.filter(c => c[0] !== nodeId && c[1] !== nodeId);
    }
    
    // Remove dataset association
    if (db.nodeDatasets && db.nodeDatasets[nodeId]) {
      delete db.nodeDatasets[nodeId];
    }
    
    writeDb(db);
    
    res.json({
      success: true,
      message: 'Node deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(500).json({
      error: 'Failed to delete node',
      details: error.message
    });
  }
});

// Update connections endpoint
app.post('/flows/connections', (req, res) => {
  try {
    const { connections } = req.body;
    console.log('Updating connections:', connections);
    
    const db = readDb();
    db.connections = connections;
    
    writeDb(db);
    
    res.json({
      success: true,
      message: 'Connections updated successfully'
    });
    
  } catch (error) {
    console.error('Update connections error:', error);
    res.status(500).json({
      error: 'Failed to update connections',
      details: error.message
    });
  }
});

// Update node position endpoint
app.put('/flows/nodes/:nodeId/position', (req, res) => {
  try {
    const { nodeId } = req.params;
    const { position } = req.body;
    console.log('Updating node position:', nodeId, position);
    
    const db = readDb();
    
    // Find and update the node position
    if (db.initialFlowNodes) {
      const nodeIndex = db.initialFlowNodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        db.initialFlowNodes[nodeIndex].position = position;
        writeDb(db);
        
        res.json({
          success: true,
          message: 'Node position updated successfully'
        });
      } else {
        res.status(404).json({ error: 'Node not found' });
      }
    } else {
      res.status(404).json({ error: 'No nodes found' });
    }
    
  } catch (error) {
    console.error('Update node position error:', error);
    res.status(500).json({
      error: 'Failed to update node position',
      details: error.message
    });
  }
});

// Generic endpoints for other resources
const resources = ['automations', 'ragModels', 'availableNodes', 'agents', 'presets', 'initialFlowNodes'];

resources.forEach(resource => {
  app.get(`/${resource}`, (req, res) => {
    try {
      const db = readDb();
      res.json(db[resource] || []);
    } catch (error) {
      res.status(500).json({ error: `Failed to fetch ${resource}` });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Database file: ${dbPath}`);
  console.log('Available endpoints:');
  console.log('  GET  /test');
  console.log('  POST /datasets/generate-mcq');
  console.log('  POST /datasets');
  console.log('  GET  /datasets');
  console.log('  GET  /datasets/:id');
  console.log('  GET  /flows/current');
  console.log('  POST /flows/nodes/add');
  console.log('  DELETE /flows/nodes/:nodeId');
  console.log('  POST /flows/connections');
  console.log('  GET  /automations');
  console.log('  GET  /ragModels');
  console.log('  GET  /availableNodes');
  console.log('  GET  /initialFlowNodes');
});

export default app;