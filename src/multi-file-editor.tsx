import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';

// Configure Monaco Editor for TypeScript/React
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
// import 'monaco-editor/esm/vs/editor/contrib/find/findController';
// import 'monaco-editor/esm/vs/editor/contrib/folding/folding';
// import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching';

export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    content?: string;
    language?: string;
    children?: FileNode[];
    parentId?: string;
}

interface FileEditorProps {
    fileTree: FileNode[];
    activeFileId: string | null;
    onFileChange: (fileId: string, content: string) => void;
    onActiveFileChange: (fileId: string) => void;
    onFileCreate: (name: string, type: 'file' | 'folder', parentId?: string) => void;
    onFileDelete: (fileId: string) => void;
    onFileRename: (fileId: string, newName: string) => void;
    onFileMove?: (fileId: string, newParentId?: string) => void;
    sidebarWidth?: number;
}

const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'tsx':
        case 'jsx':
            return 'typescript';
        case 'ts':
            return 'typescript';
        case 'js':
            return 'javascript';
        case 'css':
            return 'css';
        case 'html':
            return 'html';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        default:
            return 'typescript';
    }
};

const getFileIcon = (node: FileNode): string => {
    if (node.type === 'folder') {
        return '📁';
    }
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'tsx':
        case 'jsx':
            return '⚛️';
        case 'ts':
            return '🔷';
        case 'js':
            return '📜';
        case 'css':
            return '🎨';
        case 'html':
            return '🌐';
        case 'json':
            return '📋';
        case 'md':
            return '📝';
        default:
            return '📄';
    }
};

const FileTreeNode: React.FC<{
    node: FileNode;
    depth: number;
    expandedFolders: Set<string>;
    onToggleExpand: (folderId: string) => void;
    onSelect: (fileId: string) => void;
    onRename: (fileId: string, name: string) => void;
    onDelete: (fileId: string) => void;
    onCreateFile: (parentId: string, type: 'file' | 'folder') => void;
    activeFileId: string | null;
    renamingId: string | null;
    setRenamingId: (id: string | null) => void;
    renameValue: string;
    setRenameValue: (value: string) => void;
}> = ({
    node,
    depth,
    expandedFolders,
    onToggleExpand,
    onSelect,
    onRename,
    onDelete,
    onCreateFile,
    activeFileId,
    renamingId,
    setRenamingId,
    renameValue,
    setRenameValue
}) => {
        const isExpanded = expandedFolders.has(node.id);
        const isActive = activeFileId === node.id;
        const isRenaming = renamingId === node.id;

        const handleRename = () => {
            if (renameValue.trim()) {
                onRename(node.id, renameValue.trim());
                setRenamingId(null);
                setRenameValue('');
            }
        };

        const handleCancelRename = () => {
            setRenamingId(null);
            setRenameValue('');
        };

        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            // Simple context menu - in a real app you'd use a proper context menu component
            const action = window.confirm('Delete this item?');
            if (action) {
                onDelete(node.id);
            }
        };

        return (
            <div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        paddingLeft: `${8 + depth * 16}px`,
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#094771' : 'transparent',
                        color: '#cccccc',
                        fontSize: '13px',
                        userSelect: 'none'
                    }}
                    onClick={() => {
                        if (node.type === 'folder') {
                            onToggleExpand(node.id);
                        } else {
                            onSelect(node.id);
                        }
                    }}
                    onDoubleClick={() => {
                        setRenamingId(node.id);
                        setRenameValue(node.name);
                    }}
                    onContextMenu={handleContextMenu}
                >
                    {node.type === 'folder' && (
                        <span
                            style={{
                                marginRight: '4px',
                                fontSize: '10px',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.1s'
                            }}
                        >
                            ▶
                        </span>
                    )}
                    <span style={{ marginRight: '6px' }}>
                        {getFileIcon(node)}
                    </span>
                    {isRenaming ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleCancelRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleRename();
                                } else if (e.key === 'Escape') {
                                    handleCancelRename();
                                }
                            }}
                            autoFocus
                            style={{
                                backgroundColor: '#3c3c3c',
                                color: '#ffffff',
                                border: '1px solid #007acc',
                                padding: '2px 4px',
                                fontSize: '13px',
                                flex: 1
                            }}
                        />
                    ) : (
                        <span>{node.name}</span>
                    )}
                </div>

                {node.type === 'folder' && isExpanded && node.children && (
                    <div>
                        {node.children.map((child) => (
                            <FileTreeNode
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                expandedFolders={expandedFolders}
                                onToggleExpand={onToggleExpand}
                                onSelect={onSelect}
                                onRename={onRename}
                                onDelete={onDelete}
                                onCreateFile={onCreateFile}
                                activeFileId={activeFileId}
                                renamingId={renamingId}
                                setRenamingId={setRenamingId}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

const FileTreeSidebar: React.FC<{
    fileTree: FileNode[];
    activeFileId: string | null;
    onFileSelect: (fileId: string) => void;
    onFileRename: (fileId: string, newName: string) => void;
    onFileDelete: (fileId: string) => void;
    onFileCreate: (name: string, type: 'file' | 'folder', parentId?: string) => void;
    width: number;
}> = ({
    fileTree,
    activeFileId,
    onFileSelect,
    onFileRename,
    onFileDelete,
    onFileCreate,
    width
}) => {
        const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
        const [renamingId, setRenamingId] = useState<string | null>(null);
        const [renameValue, setRenameValue] = useState('');
        const [showCreateInput, setShowCreateInput] = useState<{ parentId?: string, type: 'file' | 'folder' } | null>(null);
        const [newItemName, setNewItemName] = useState('');

        const handleToggleExpand = (folderId: string) => {
            setExpandedFolders(prev => {
                const next = new Set(prev);
                if (next.has(folderId)) {
                    next.delete(folderId);
                } else {
                    next.add(folderId);
                }
                return next;
            });
        };

        const handleCreateItem = () => {
            if (newItemName.trim() && showCreateInput) {
                onFileCreate(newItemName.trim(), showCreateInput.type, showCreateInput.parentId);
                setShowCreateInput(null);
                setNewItemName('');
            }
        };

        const handleCancelCreate = () => {
            setShowCreateInput(null);
            setNewItemName('');
        };

        return (
            <div
                style={{
                    width: `${width}px`,
                    backgroundColor: '#252526',
                    borderRight: '1px solid #3e3e42',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Sidebar Header */}
                <div
                    style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #3e3e42',
                        color: '#cccccc',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <span>Explorer</span>
                    <div>
                        <button
                            onClick={() => setShowCreateInput({ type: 'file' })}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#cccccc',
                                cursor: 'pointer',
                                padding: '4px',
                                marginRight: '4px',
                                fontSize: '16px'
                            }}
                            title="New File"
                        >
                            📄
                        </button>
                        <button
                            onClick={() => setShowCreateInput({ type: 'folder' })}
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#cccccc',
                                cursor: 'pointer',
                                padding: '4px',
                                fontSize: '16px'
                            }}
                            title="New Folder"
                        >
                            📁
                        </button>
                    </div>
                </div>

                {/* File Tree */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {showCreateInput && !showCreateInput.parentId && (
                        <div style={{ padding: '4px 8px' }}>
                            <input
                                type="text"
                                placeholder={`${showCreateInput.type} name`}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onBlur={handleCancelCreate}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateItem();
                                    } else if (e.key === 'Escape') {
                                        handleCancelCreate();
                                    }
                                }}
                                autoFocus
                                style={{
                                    width: '100%',
                                    backgroundColor: '#3c3c3c',
                                    color: '#ffffff',
                                    border: '1px solid #007acc',
                                    padding: '4px 8px',
                                    fontSize: '13px'
                                }}
                            />
                        </div>
                    )}

                    {fileTree.map((node) => (
                        <FileTreeNode
                            key={node.id}
                            node={node}
                            depth={0}
                            expandedFolders={expandedFolders}
                            onToggleExpand={handleToggleExpand}
                            onSelect={onFileSelect}
                            onRename={onFileRename}
                            onDelete={onFileDelete}
                            onCreateFile={(parentId, type) => setShowCreateInput({ parentId, type })}
                            activeFileId={activeFileId}
                            renamingId={renamingId}
                            setRenamingId={setRenamingId}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                        />
                    ))}
                </div>
            </div>
        );
    };

const FileEditor: React.FC<FileEditorProps> = ({
    fileTree,
    activeFileId,
    onFileChange,
    onActiveFileChange,
    onFileCreate,
    onFileDelete,
    onFileRename,
    sidebarWidth = 250
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const modelsRef = useRef<Map<string, monaco.editor.ITextModel>>(new Map());

    // Flatten file tree to get all files
    const getAllFiles = (nodes: FileNode[]): FileNode[] => {
        const files: FileNode[] = [];
        const traverse = (nodeList: FileNode[]) => {
            nodeList.forEach(node => {
                if (node.type === 'file') {
                    files.push(node);
                }
                if (node.children) {
                    traverse(node.children);
                }
            });
        };
        traverse(nodes);
        return files;
    };

    const allFiles = getAllFiles(fileTree);
    const activeFile = allFiles.find(f => f.id === activeFileId);

    // Initialize Monaco Editor
    useEffect(() => {
        if (!editorRef.current) return;

        // Configure TypeScript compiler options
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
        });

        // Add React type definitions
        const reactTypes = `
      declare module 'react' {
        export interface Component<P = {}, S = {}> {}
        export class Component<P, S> {
          props: P;
          state: S;
          setState(state: Partial<S>): void;
          render(): ReactNode;
        }
        export function useState<T>(initialState: T): [T, (value: T) => void];
        export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        export function useRef<T>(initialValue: T): { current: T };
        export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        export function useMemo<T>(factory: () => T, deps: any[]): T;
        export type ReactNode = string | number | boolean | null | undefined | ReactElement | ReactNode[];
        export interface ReactElement {
          type: any;
          props: any;
          key: string | number | null;
        }
        export interface FC<P = {}> {
          (props: P): ReactElement | null;
        }
      }
    `;

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            reactTypes,
            'file:///node_modules/@types/react/index.d.ts'
        );

        // Create the editor
        const editor = monaco.editor.create(editorRef.current, {
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            bracketMatching: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: 'line',
            smoothScrolling: true,
            contextmenu: true,
            mouseWheelZoom: true,
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: true,
            parameterHints: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'languageDefined'
        });

        monacoRef.current = editor;

        // Listen for content changes
        const disposable = editor.onDidChangeModelContent(() => {
            const model = editor.getModel();
            if (model) {
                const fileId = model.uri.path.substring(1); // Remove leading slash
                const content = model.getValue();
                onFileChange(fileId, content);
            }
        });

        return () => {
            disposable.dispose();
            // Dispose all models
            modelsRef.current.forEach(model => model.dispose());
            modelsRef.current.clear();
            editor.dispose();
        };
    }, []);

    // Create or update models for files
    useEffect(() => {
        if (!monacoRef.current) return;

        const editor = monacoRef.current;
        const currentModels = modelsRef.current;

        // Remove models for files that no longer exist
        for (const [fileId, model] of currentModels.entries()) {
            if (!allFiles.find(f => f.id === fileId)) {
                model.dispose();
                currentModels.delete(fileId);
            }
        }

        // Create or update models for current files
        allFiles.forEach(file => {
            if (file.content !== undefined) {
                let model = currentModels.get(file.id);
                const language = file.language || getLanguageFromFileName(file.name);

                if (!model) {
                    // Create new model
                    const uri = monaco.Uri.parse(`file:///${file.id}`);
                    model = monaco.editor.createModel(file.content, language, uri);
                    currentModels.set(file.id, model);
                } else {
                    // Update existing model if content changed externally
                    if (model.getValue() !== file.content) {
                        model.setValue(file.content);
                    }
                    // Update language if it changed
                    if (model.getLanguageId() !== language) {
                        monaco.editor.setModelLanguage(model, language);
                    }
                }
            }
        });

        // Switch to active file
        if (activeFileId) {
            const activeModel = currentModels.get(activeFileId);
            if (activeModel && editor.getModel() !== activeModel) {
                editor.setModel(activeModel);
            }
        }
    }, [allFiles, activeFileId]);

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            {/* File Tree Sidebar */}
            <FileTreeSidebar
                fileTree={fileTree}
                activeFileId={activeFileId}
                onFileSelect={onActiveFileChange}
                onFileRename={onFileRename}
                onFileDelete={onFileDelete}
                onFileCreate={onFileCreate}
                width={sidebarWidth}
            />

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Breadcrumb/File Path */}
                {activeFile && (
                    <div
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2d2d30',
                            borderBottom: '1px solid #3e3e42',
                            color: '#cccccc',
                            fontSize: '13px'
                        }}
                    >
                        {getFileIcon(activeFile)} {activeFile.name}
                    </div>
                )}

                {/* Monaco Editor */}
                <div ref={editorRef} style={{ flex: 1 }} />
            </div>
        </div>
    );
};

export default FileEditor;
