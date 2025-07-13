# Tailwind CSS v4 Styling Guide

This project uses **Tailwind CSS v4** with a custom color system. This guide covers the complete setup, configuration, and usage patterns.

## 📋 Table of Contents
- [Configuration Files](#configuration-files)
- [Custom Color System](#custom-color-system)
- [Usage Examples](#usage-examples)
- [Important Notes](#important-notes)
- [Migration from v3 to v4](#migration-from-v3-to-v4)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Configuration Files

### 1. **PostCSS Configuration** (`postcss.config.js`)
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### 2. **Tailwind Configuration** (`tailwind.config.js`)
```javascript
// tailwind.config.js

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // In Tailwind CSS v4, custom colors are defined in CSS using @theme directive
  // See src/index.css for color definitions
}
```

### 3. **CSS Configuration** (`src/index.css`)
```css
@import "tailwindcss";

@theme {
  --color-primary: #567ce8;
  --color-primary-hover: #4c76ed;
  
  --color-secondary: #e0e9ff;
  --color-secondary-hover: #c7d5ff;
  
  --color-app-border: #c7d5ff;
  --color-app-border-highlight: #4c76ed;
  
  --color-app-text: #1e2875;
  --color-app-text-subtle: #4c76ed;
  
  --color-app-bg: #ffffff;
  --color-app-bg-content: #ffffff;
  --color-app-bg-highlight: #f0f4ff;
}
```

### 4. **Package Dependencies** (`package.json`)
```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4.1.11",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.11",
    "vite": "^7.0.4"
  }
}
```

---

## 🎨 Custom Color System

### Primary Colors
- **`primary`** (`#567ce8`) - Main brand color
- **`primary-hover`** (`#4c76ed`) - Hover state for primary elements

### Secondary Colors
- **`secondary`** (`#e0e9ff`) - Light background accents
- **`secondary-hover`** (`#c7d5ff`) - Hover state for secondary elements

### Border Colors
- **`app-border`** (`#c7d5ff`) - Default border color
- **`app-border-highlight`** (`#4c76ed`) - Highlighted borders

### Text Colors
- **`app-text`** (`#1e2875`) - Primary text color (dark blue)
- **`app-text-subtle`** (`#4c76ed`) - Secondary text color (matches primary)

### Background Colors
- **`app-bg`** (`#ffffff`) - Main background
- **`app-bg-content`** (`#ffffff`) - Content area background
- **`app-bg-highlight`** (`#f0f4ff`) - Subtle highlight background

---

## 🔍 Usage Examples

### Buttons
```jsx
// Primary button
<button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded">
  Primary Action
</button>

// Secondary button
<button className="bg-secondary hover:bg-secondary-hover text-app-text px-4 py-2 rounded border border-app-border">
  Secondary Action
</button>
```

### Cards
```jsx
<div className="bg-app-bg-content border border-app-border rounded-xl p-6 hover:border-app-border-highlight">
  <h3 className="text-app-text font-semibold">Card Title</h3>
  <p className="text-app-text-subtle">Card description</p>
</div>
```

### Layout
```jsx
<div className="min-h-screen bg-gradient-to-br from-app-bg-highlight to-app-bg">
  <header className="bg-app-bg border-b border-app-border">
    <h1 className="text-app-text">Page Title</h1>
  </header>
</div>
```

### Tags/Badges
```jsx
<span className="bg-secondary text-app-text px-3 py-1 rounded-full text-sm">
  Tag Label
</span>
```

---

## ⚠️ Important Notes

### 1. **Tailwind CSS v4 Differences**
- ❌ **No more** `theme.extend.colors` in config file
- ✅ **Use** `@theme` directive in CSS files
- ❌ **No more** `require('tailwindcss')` in PostCSS
- ✅ **Use** `@tailwindcss/postcss` plugin

### 2. **Color Naming Convention**
- Use **kebab-case** for color names: `app-text`, `app-border`
- Include **semantic prefixes**: `app-`, `primary-`, `secondary-`
- Follow **BEM-like structure**: `element-modifier`

### 3. **CSS Custom Properties**
Colors are defined as CSS custom properties:
```css
--color-primary: #567ce8;        /* Becomes: bg-primary, text-primary */
--color-app-text: #1e2875;       /* Becomes: bg-app-text, text-app-text */
```

### 4. **Editor Support**
- Your editor may show warnings for `@theme` directive
- This is normal - the syntax is processed by PostCSS
- Classes like `bg-primary` will work correctly

---

## 🔄 Migration from v3 to v4

### What Changed:
1. **Config Structure**: Removed `theme.extend.colors`
2. **Color Definition**: Moved to CSS `@theme` blocks
3. **PostCSS Plugin**: Changed from `tailwindcss` to `@tailwindcss/postcss`

### Migration Steps:
```bash
# 1. Install new packages
npm install @tailwindcss/postcss@^4.1.11 tailwindcss@^4.1.11

# 2. Update postcss.config.js
# Replace 'tailwindcss' with '@tailwindcss/postcss'

# 3. Move colors from tailwind.config.js to src/index.css
# Use @theme directive instead of theme.extend.colors

# 4. Update class names if needed
# Most utility classes remain the same
```

---

## 🐛 Troubleshooting

### Common Issues:

#### 1. **Colors Not Working**
```bash
# Check if PostCSS plugin is correct
# Should be '@tailwindcss/postcss', not 'tailwindcss'
```

#### 2. **Build Errors**
```bash
# Ensure you have the correct versions
npm install @tailwindcss/postcss@^4.1.11 tailwindcss@^4.1.11
```

#### 3. **Editor Warnings**
- Warnings about `@theme` are normal
- Add this to VS Code settings to reduce warnings:
```json
{
  "css.lint.unknownAtRules": "ignore"
}
```

#### 4. **Hot Reload Not Working**
```bash
# Restart dev server after config changes
npm run dev
```

### Verification Steps:
1. ✅ Check `postcss.config.js` has `@tailwindcss/postcss`
2. ✅ Check `src/index.css` has `@theme` block
3. ✅ Check `tailwind.config.js` is simplified (no theme.extend)
4. ✅ Check dev server starts without errors
5. ✅ Check colors render correctly in browser

---

## 📚 Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [PostCSS Plugin GitHub](https://github.com/tailwindlabs/tailwindcss-postcss)
- [Migration Guide](https://tailwindcss.com/docs/upgrade-guide)

---

## 🎯 Best Practices

1. **Consistent Naming**: Use semantic names like `app-text` instead of `blue-900`
2. **Hover States**: Always define hover variants for interactive elements
3. **Accessibility**: Ensure sufficient color contrast (especially `app-text` on backgrounds)
4. **Organization**: Group related colors together in `@theme` block
5. **Documentation**: Comment color purposes in CSS file

---

**Last Updated:** January 2025
**Tailwind CSS Version:** v4.1.11
**Project Type:** React + TypeScript + Vite
