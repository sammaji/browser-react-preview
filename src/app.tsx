import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { CodeEditor, type FileNode } from './code-editor'
import { LivePreview } from './live-preview'
import { initialFiles } from './initial-files'
import React from "react"


function buildFileTree(files: Record<string, string>): FileNode[] {
    const root: FileNode = { id: 'root', name: 'root', type: 'folder', children: [] };
    // const nodeMap: Record<string, FileNode> = { '': root };

    const sortedPaths = Object.keys(files).sort();

    for (const path of sortedPaths) {
        const parts = path.split('/');
        let parent = root;
        let currentPath = '';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            currentPath += (i > 0 ? '/' : '') + part;
            const isFile = i === parts.length - 1;

            let child = parent.children?.find(c => c.name === part);

            if (!child) {
                child = {
                    id: currentPath,
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    content: isFile ? files[path] : undefined,
                    children: isFile ? undefined : [],
                    parentId: parent.id === 'root' ? undefined : parent.id,
                };
                parent.children?.push(child);
            }
            if (!isFile) {
                parent = child;
            }
        }
    }
    return root.children || [];
}

function App() {
    const [files, setFiles] = React.useState(initialFiles);
    const [activeFileId, setActiveFileId] = React.useState('src/app.tsx');

    const fileTree = React.useMemo(() => buildFileTree(files), [files]);

    const handleFileChange = (fileId: string, content: string) => {
        setFiles(prev => ({ ...prev, [fileId]: content }));
    };

    const handleFileCreate = (name: string, type: 'file' | 'folder', parentId?: string) => {
        const newId = parentId ? `${parentId}/${name}` : name;
        if (files[newId]) {
            alert('File or folder with this name already exists');
            return;
        }
        setFiles(prev => ({
            ...prev,
            [newId]: type === 'file' ? '' : ''
        }));
    };

    const handleFileDelete = (fileId: string) => {
        const newFiles = { ...files };
        // Also delete children if it\'s a folder
        Object.keys(newFiles).forEach(path => {
            if (path.startsWith(fileId)) {
                delete newFiles[path];
            }
        });
        delete newFiles[fileId];
        setFiles(newFiles);
        if (activeFileId && activeFileId.startsWith(fileId)) {
            setActiveFileId(Object.keys(newFiles)[0] || null);
        }
    };

    const handleFileRename = (fileId: string, newName: string) => {
        const newFiles = { ...files };
        const oldPathParts = fileId.split('/');
        const newId = [...oldPathParts.slice(0, -1), newName].join('/');

        if (files[newId]) {
            alert('File or folder with this name already exists');
            return;
        }

        Object.keys(newFiles).forEach(path => {
            if (path.startsWith(fileId)) {
                const newPath = path.replace(fileId, newId);
                newFiles[newPath] = newFiles[path];
                delete newFiles[path];
            }
        });

        setFiles(newFiles);

        if (activeFileId === fileId) {
            setActiveFileId(newId);
        }
    };

    return (
        <div className='h-screen'>
            <ResizablePanelGroup
                direction="horizontal"
            >
                <ResizablePanel defaultSize={50} minSize={20}>
                    <CodeEditor
                        fileTree={fileTree}
                        activeFileId={activeFileId}
                        onActiveFileChange={setActiveFileId}
                        onFileChange={handleFileChange}
                        onFileCreate={handleFileCreate}
                        onFileDelete={handleFileDelete}
                        onFileRename={handleFileRename}
                    />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50} minSize={20}>
                    <LivePreview files={files} entryPoint="src/app.tsx" />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

export default App
