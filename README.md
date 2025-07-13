# Automation Platform

A modern, enterprise-grade web application for building, deploying, and managing intelligent automations, RAG (Retrieval-Augmented Generation) pipelines, and AI-powered workflows. Built with React 19, TypeScript, and Tailwind CSS v4, this platform provides an intuitive interface for creating sophisticated automation solutions.

## Overview

The Automation Platform is a comprehensive solution that empowers users to create and manage various types of intelligent automations without extensive technical knowledge. The platform features a drag-and-drop flow builder, preset configurations for common automation types, dataset testing capabilities, and a flexible architecture that supports everything from simple API integrations to complex RAG-based AI systems.

Key capabilities include:
- **Visual Flow Builder**: Drag-and-drop interface for creating automation workflows
- **RAG Pipeline Creation**: Build knowledge retrieval systems with document Q&A capabilities
- **Agent Configuration**: Set up automated agents with customizable presets (Weather API, Google Search, Custom)
- **Dataset Testing**: Upload and validate datasets against existing automations
- **Project Management**: Organize and track automation projects with real-time status updates
- **Multi-template UI Generation**: Choose from chatbot, avatar, or web interface templates

## Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features and improved performance
- **TypeScript 5.8.3** - Full type safety and enhanced developer experience
- **Vite 7.0.4** - Fast build tool and development server with HMR
- **Tailwind CSS v4.1.11** - Utility-first CSS framework with custom design system
- **PostCSS & Autoprefixer** - CSS processing and vendor prefixing

### Backend/Data
- **JSON Server** - Mock REST API for development and prototyping
- **Fetch API** - Modern HTTP client for API communication
- **Local Storage/State Management** - React Hooks for state management

### Development Tools
- **ESLint 9.30.1** - Code linting with React-specific rules
- **TypeScript ESLint** - TypeScript-aware linting
- **React Hot Reload** - Fast development with live updates

### Styling
- **Custom Design System** - Semantic color tokens and component patterns
- **Responsive Design** - Mobile-first approach with breakpoint system
- **CSS Custom Properties** - Dynamic theming with CSS variables

## Key Features

### 🏠 **Dashboard & Project Management**
- Clean, intuitive dashboard with quick action cards
- Recent projects view with categorized tabs (Automations vs RAG Models)
- Project status tracking with tags and metadata
- Real-time data fetching from REST API

### 🔧 **Agent Configuration System**
- **Preset Configurations**: Weather API, Google Search, and Custom setups
- **Form Validation**: TypeScript-enforced form handling with controlled components
- **Dynamic Configuration**: Context-aware field rendering based on selected preset
- **State Management**: Comprehensive state handling for all configuration options

### 🌊 **Visual Flow Builder**
- **Drag-and-Drop Interface**: Intuitive node-based workflow creation
- **Component Categories**: Organized sidebar with Automations, RAG Models, and Triggers
- **Real-time Canvas**: Interactive workspace for building complex workflows
- **Dynamic Node Loading**: Fetches available components from API

### 📊 **Dataset Testing & Validation**
- **File Upload System**: Enhanced file upload with drag-and-drop support
- **Format Support**: CSV, JSON, TXT file handling
- **Automation Testing**: Test datasets against existing automation pipelines
- **Results Visualization**: Real-time test results and performance metrics

### 🎨 **UI Template Generation**
- **Multiple Templates**: Chatbot, Avatar Interaction, and Website generation
- **Step-by-Step Wizard**: Guided UI creation process
- **Template Customization**: Configurable options for each template type
- **Deployment Ready**: One-click deployment workflow

### 💬 **Interactive Chat Panel**
- **Real-time Messaging**: Bi-directional communication interface
- **AI Response Simulation**: Mock AI responses for testing
- **Message History**: Persistent conversation tracking
- **Testing Interface**: Tool for validating automation responses

## Project Structure

```
automation-platform/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ChatPanel.tsx           # Real-time chat interface
│   │   ├── FileUploadButton.tsx    # Enhanced file upload component
│   │   ├── FlowSidebar.tsx         # Drag-and-drop sidebar for flow builder
│   │   ├── FormField.tsx           # Form input components with validation
│   │   ├── Icons.tsx               # SVG icon library
│   │   ├── PageHeader.tsx          # Consistent page headers
│   │   ├── PresetCard.tsx          # Agent preset selection cards
│   │   ├── PresetConfigs.tsx       # Dynamic configuration forms
│   │   ├── ProjectListItem.tsx     # Project display components
│   │   ├── RecentProjects.tsx      # Project management with API integration
│   │   ├── SectionCard.tsx         # Layout container components
│   │   ├── SelectionCard.tsx       # Interactive action cards
│   │   ├── StepIndicator.tsx       # Multi-step process navigation
│   │   └── TemplateSelectionCard.tsx # UI template selection
│   ├── pages/               # Main application pages
│   │   ├── HomePage.tsx            # Dashboard with action cards and recent projects
│   │   ├── ConfigureAgentPage.tsx  # Agent setup with preset configurations
│   │   ├── AgentCreationPage.tsx   # Visual flow builder interface
│   │   ├── DatasetTestingPage.tsx  # Dataset upload and testing
│   │   └── AppChoicePage.tsx       # UI template selection wizard
│   ├── App.tsx              # Main application component with routing
│   ├── main.tsx             # React application entry point
│   ├── index.css            # Tailwind imports and custom theme
│   └── vite-env.d.ts        # TypeScript environment declarations
├── public/                  # Static assets
├── db.json                  # Mock database for development
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS v4 configuration
├── postcss.config.js        # PostCSS processing configuration
├── vite.config.ts           # Vite build tool configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## Getting Started

### Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** package manager
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Implementation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the mock API server**
   ```bash
   # Install json-server globally if not already installed
   npm install -g json-server
   
   # Start the API server (runs on port 3002)
   npx json-server --watch db.json --port 3002
   ```

4. **Start the development server**
   ```bash
   # In a new terminal window
   npm run dev
   ```

### Running the Application

The application will be available at:
- **Frontend**: `http://localhost:5173` (or next available port)
- **API Server**: `http://localhost:3002`

Available npm scripts:
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint code analysis
npm run preview  # Preview production build locally
```

## Frontend Logic

### Architecture Overview

The frontend follows a **component-based architecture** using React 19 with TypeScript, emphasizing modularity, reusability, and type safety.

### State Management Strategy

- **Local State**: Uses React Hooks (`useState`, `useEffect`) for component-specific state
- **Prop Drilling**: Controlled components with props for data flow
- **API State**: Dedicated hooks for data fetching with loading and error states
- **Form State**: Comprehensive form state management in parent components

### Key Components & Data Flow

#### 1. **Dashboard Flow (`HomePage.tsx`)**
```tsx
HomePage
├── PageHeader (title, subtitle)
├── SelectionCards (4 main actions)
│   ├── Create New Automation → ConfigureAgentPage
│   ├── Build RAG Pipeline → DatasetTestingPage  
│   ├── Create New Flow → AgentCreationPage
│   └── Test Dataset → DatasetTestingPage
└── RecentProjects
    ├── API Data Fetching (useEffect)
    ├── Tab Navigation (automations | RAG models)
    └── ProjectListItem[] (mapped from API data)
```

#### 2. **Agent Configuration Flow**
```tsx
ConfigureAgentPage
├── Preset Selection (weather | search | custom)
├── Dynamic Form Rendering
│   ├── WeatherConfigFields (API key, location, units)
│   ├── SearchConfigFields (API key, engine ID, results)
│   └── CustomConfigFields (agent type, JSON config)
└── Form Submission (controlled state → API)
```

#### 3. **Flow Builder Architecture**
```tsx
AgentCreationPage
├── FlowSidebar
│   ├── API Data Loading (availableNodes from db.json)
│   ├── Category Mapping (Automations, RAG Models, Triggers)
│   └── DraggableNodeItem[] (cursor-grab interaction)
└── Canvas Area (drag-and-drop target)
```

### Component Patterns

- **Controlled Components**: All form inputs use controlled state patterns
- **Composition**: Components accept `children` props for flexible layouts
- **Props Interfaces**: TypeScript interfaces for all component props
- **Error Boundaries**: Loading and error states for async operations
- **Responsive Design**: Mobile-first with Tailwind breakpoints

## Backend Logic

### API Architecture

The application uses a **RESTful API** design pattern with JSON Server providing a fully functional mock backend during development.

### API Endpoints

#### **Core Data Endpoints**
```
GET /automations          # Fetch automation projects
GET /ragModels           # Fetch RAG model projects  
GET /availableNodes      # Fetch flow builder components
GET /datasets            # Fetch available test datasets
GET /agents              # Fetch configured agents
GET /presets             # Fetch agent configuration presets
```

#### **Data Models**

**Automation Project**
```typescript
interface AutomationProject {
  id: number;
  title: string;           // "Singapore Weather Automation"
  description: string;     // "10 months ago • by John Doe"
  tags: string[];         // ["API", "Active"]
}
```

**Flow Node Structure**
```typescript
interface NodeCategory {
  category: string;        // "Automations" | "RAG Models" | "Triggers"
  items: NodeItem[];
}

interface NodeItem {
  id: string;             // "auto-weather"
  icon: string;           // "🌦️"
  title: string;          // "Weather Automation"
  description: string;    // "Fetches weather data"
}
```

**Agent Preset Configuration**
```typescript
interface Preset {
  id: string;             // "weather" | "search" | "custom"
  emoji: string;          // "🌦️"
  title: string;          // "Weather API"
  description: string;    // "Get weather information and forecasts"
}
```

### API Integration Patterns

#### **Data Fetching with Error Handling**
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3002/endpoint');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);
```

#### **Parallel Data Fetching**
```typescript
const [automationsResponse, ragModelsResponse] = await Promise.all([
  fetch('http://localhost:3002/automations'),
  fetch('http://localhost:3002/ragModels')
]);
```

### Database Schema (Mock Data)

The `db.json` file provides a structured mock database with:
- **Relationships**: Linked data between automations and their configurations
- **Realistic Data**: Sample projects with metadata and tags
- **Extensible Structure**: Easy to add new data types and relationships

## Styling

### Tailwind CSS v4 Implementation

The project uses **Tailwind CSS v4** with a custom design system built on CSS custom properties and the new `@theme` directive.

### Design System Architecture

#### **Color Palette**
```css
@theme {
  --color-primary: #567ce8;           /* Main brand color */
  --color-primary-hover: #4c76ed;     /* Interactive states */
  --color-secondary: #e0e9ff;         /* Light backgrounds */
  --color-secondary-hover: #c7d5ff;   /* Secondary interactions */
  --color-app-border: #c7d5ff;        /* Default borders */
  --color-app-border-highlight: #4c76ed; /* Highlighted borders */
  --color-app-text: #1e2875;          /* Primary text (high contrast) */
  --color-app-text-subtle: #4c76ed;   /* Secondary text */
  --color-app-bg: #ffffff;            /* Main backgrounds */
  --color-app-bg-content: #ffffff;    /* Content area backgrounds */
  --color-app-bg-highlight: #f0f4ff;  /* Subtle highlights */
}
```

#### **Styling Approach**

- **Utility-First**: Tailwind utility classes for rapid development
- **Custom Tokens**: Semantic color naming for consistency
- **Component Patterns**: Reusable styling patterns across components
- **Responsive Design**: Mobile-first breakpoint system
- **Hover States**: Comprehensive interaction feedback
- **Transitions**: Smooth animations for enhanced UX

#### **Component Styling Examples**

**Interactive Cards**
```tsx
className="bg-app-bg-content rounded-xl p-6 cursor-pointer group border-2 border-app-border hover:border-app-border-highlight hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
```

**Form Elements**
```tsx
className="w-full px-3 py-2 border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-app-bg-content"
```

**Button Variants**
```tsx
// Primary Button
className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-hover"

// Secondary Button  
className="bg-secondary text-app-text font-semibold py-2 px-4 rounded-lg hover:bg-secondary-hover"
```

### Configuration Files

- **`tailwind.config.js`**: Simplified v4 configuration pointing to CSS theme
- **`postcss.config.js`**: PostCSS processing with Tailwind v4 plugin
- **`src/index.css`**: Theme definitions and Tailwind imports

### Responsive Design Strategy

- **Mobile-First**: Base styles for mobile, progressively enhanced
- **Breakpoints**: `sm:`, `md:`, `lg:`, `xl:` for different screen sizes
- **Grid Layouts**: CSS Grid and Flexbox for complex layouts
- **Typography**: Responsive text sizing and spacing

---

## HTML Prototypes Integration

This React implementation is based on comprehensive HTML prototypes found in the `/pitching` directory, which include:

- **`home.html`** - Homepage dashboard prototype
- **`configure-agent.html`** - Agent configuration interface
- **`agentcreation.html`** - Visual flow builder with drag-and-drop
- **`Dataset-Testing.html`** - Dataset upload and testing interface
- **`appchoice.html`** - Template selection wizard

The React components maintain the same visual design and functionality as these prototypes while adding:
- **Type Safety**: Full TypeScript implementation
- **State Management**: React hooks for interactive features
- **API Integration**: Dynamic data loading from JSON server
- **Component Reusability**: Modular, reusable component architecture

## API Documentation

For detailed API documentation and additional styling guidelines, see:
- **[STYLING_README.md](./STYLING_README.md)** - Comprehensive styling guide
- **API Base URL**: `http://localhost:3002`
- **OpenAPI Documentation**: Available at API root when server is running

## Contributing

This project follows standard React and TypeScript best practices. When contributing:

1. Maintain TypeScript strict mode compliance
2. Follow the established component patterns
3. Use the custom color tokens for styling consistency
4. Include proper error handling for API calls
5. Write meaningful commit messages

## License

This project is proprietary and confidential. All rights reserved.

---

**Last Updated**: January 2025  
**Version**: 0.0.0  
**Environment**: Development
