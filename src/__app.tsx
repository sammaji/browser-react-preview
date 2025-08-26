// app.tsx (complete)
import React, { useState } from 'react';
import FileEditor, { type FileNode } from './multi-file-editor';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
    const [fileTree, setFileTree] = useState<FileNode[]>([
        {
            id: 'src',
            name: 'src',
            type: 'folder',
            children: [
                {
                    id: 'components',
                    name: 'components',
                    type: 'folder',
                    parentId: 'src',
                    children: [
                        {
                            id: 'app',
                            name: 'App.tsx',
                            type: 'file',
                            parentId: 'components',
                            content: `import React, { useState } from 'react';
import { Button } from './Button';
import { Header } from './Header';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <Header title="My App" />
      <main>
        <h2>Counter: {count}</h2>
        <Button onClick={() => setCount(count + 1)}>
          Increment
        </Button>
        <Button onClick={() => setCount(count - 1)}>
          Decrement
        </Button>
      </main>
    </div>
  );
};

export default App;`
                        },
                        {
                            id: 'button',
                            name: 'Button.tsx',
                            type: 'file',
                            parentId: 'components',
                            content: `import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <button
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};`
                        },
                        {
                            id: 'header',
                            name: 'Header.tsx',
                            type: 'file',
                            parentId: 'components',
                            content: `import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
};`
                        }
                    ]
                },
                {
                    id: 'styles',
                    name: 'styles',
                    type: 'folder',
                    parentId: 'src',
                    children: [
                        {
                            id: 'button-css',
                            name: 'Button.css',
                            type: 'file',
                            parentId: 'styles',
                            content: `.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007acc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #005a9e;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}`
                        },
                        {
                            id: 'app-css',
                            name: 'App.css',
                            type: 'file',
                            parentId: 'styles',
                            content: `.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.header h1 {
  margin: 0;
  color: #333;
}

.header p {
  margin: 8px 0 0 0;
  color: #666;
}

main {
  text-align: center;
}

main h2 {
  margin-bottom: 24px;
  color: #333;
}

main button {
  margin: 0 8px;
}`
                        }
                    ]
                },
                {
                    id: 'types',
                    name: 'types',
                    type: 'folder',
                    parentId: 'src',
                    children: [
                        {
                            id: 'index-types',
                            name: 'index.ts',
                            type: 'file',
                            parentId: 'types',
                            content: `export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export type Theme = 'light' | 'dark' | 'auto';

export interface AppConfig {
  theme: Theme;
  apiUrl: string;
  debug: boolean;
  version: string;
}

export interface ButtonVariant {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
}`
                        }
                    ]
                },
                {
                    id: 'utils',
                    name: 'utils',
                    type: 'folder',
                    parentId: 'src',
                    children: [
                        {
                            id: 'helpers',
                            name: 'helpers.ts',
                            type: 'file',
                            parentId: 'utils',
                            content: `export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
};

export const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};`
                        }
                    ]
                }
            ]
        },
        {
            id: 'package-json',
            name: 'package.json',
            type: 'file',
            content: `{
  "name": "my-react-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "vite": "^4.1.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}`
        },
        {
            id: 'readme',
            name: 'README.md',
            type: 'file',
            content: `# My React App

A modern React application built with TypeScript and Vite.

## Features

- ⚛️ React 18
- 🔷 TypeScript
- ⚡ Vite
- 🎨 CSS Modules
- 📱 Responsive Design

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure

\`\`\`
src/
├── components/     # React components
├── styles/        # CSS files
├── types/         # TypeScript types
└── utils/         # Utility functions
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
`
        }
    ]);

    const [activeFileId, setActiveFileId] = useState<string | null>('app');

    // Helper function to find a node by ID
    const findNodeById = (nodes: FileNode[], id: string): FileNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // Helper function to update a node
    const updateNode = (nodes: FileNode[], id: string, updates: Partial<FileNode>): FileNode[] => {
        return nodes.map(node => {
            if (node.id === id) {
                return { ...node, ...updates };
            }
            if (node.children) {
                return {
                    ...node,
                    children: updateNode(node.children, id, updates)
                };
            }
            return node;
        });
    };

    // Helper function to delete a node
    const deleteNode = (nodes: FileNode[], id: string): FileNode[] => {
        return nodes.filter(node => {
            if (node.id === id) {
                return false;
            }
            if (node.children) {
                node.children = deleteNode(node.children, id);
            }
            return true;
        });
    };

    // Helper function to add a node
    const addNode = (nodes: FileNode[], parentId: string | undefined, newNode: FileNode): FileNode[] => {
        if (!parentId) {
            return [...nodes, newNode];
        }
        return nodes.map(node => {
            if (node.id === parentId) {
                return {
                    ...node,
                    children: [...(node.children || []), newNode]
                };
            }
            if (node.children) {
                return {
                    ...node,
                    children: addNode(node.children, parentId, newNode)
                };
            }
            return node;
        });
    };

    // Handle file content changes from the editor
    const handleFileChange = (fileId: string, content: string) => {
        setFileTree(prevTree => updateNode(prevTree, fileId, { content }));
    };

    // Handle file creation
    const handleFileCreate = (name: string, type: 'file' | 'folder', parentId?: string) => {
        const newId = uuidv4();
        const newNode: FileNode = {
            id: newId,
            name,
            type,
            parentId,
            content: type === 'file' ? '' : undefined,
            children: type === 'folder' ? [] : undefined
        };

        setFileTree(prevTree => addNode(prevTree, parentId, newNode));
        if (type === 'file') {
            setActiveFileId(newId);
        }
    };

    // Handle file deletion
    const handleFileDelete = (fileId: string) => {
        setFileTree(prevTree => {
            const newTree = deleteNode(prevTree, fileId);
            if (activeFileId === fileId) {
                setActiveFileId(null);
            }
            return newTree;
        });
    };

    // Handle file rename
    const handleFileRename = (fileId: string, newName: string) => {
        setFileTree(prevTree => updateNode(prevTree, fileId, { name: newName }));
    };

    return (
        <div>
            <FileEditor
                fileTree={fileTree}
                activeFileId={activeFileId}
                onFileChange={handleFileChange}
                onActiveFileChange={setActiveFileId}
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
            />
        </div>
    );
};

export default App;
