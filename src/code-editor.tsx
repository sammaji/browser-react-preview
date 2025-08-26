import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';

import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching';

interface CodeEditorProps {
    value: string;
    onValueChange: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onValueChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!editorRef.current) return;

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

        const editor = monaco.editor.create(editorRef.current, {
            value,
            language: 'typescript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
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
            wordBasedSuggestions: "allDocuments",
            parameterHints: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'languageDefined'
        });

        monacoRef.current = editor;

        const disposable = editor.onDidChangeModelContent(() => {
            const newValue = editor.getValue();
            onValueChange(newValue);
        });

        return () => {
            disposable.dispose();
            editor.dispose();
        };
    }, []);

    useEffect(() => {
        if (monacoRef.current && value !== monacoRef.current.getValue()) {
            monacoRef.current.setValue(value);
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            className='w-full h-full'
        />
    );
};
