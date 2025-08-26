import React, { useState, useEffect } from 'react';
import * as Babel from "@babel/standalone";

// ... (aliases and resolvePath function remain the same)
const aliases = { '@/': '/src/' };

const resolvePath = (currentPath, requestedPath) => {
    for (const alias in aliases) {
        if (requestedPath.startsWith(alias)) {
            return requestedPath.replace(alias, aliases[alias]);
        }
    }
    return requestedPath;
};


export function LivePreview({ files, entryPoint }) {
    const [Component, setComponent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const moduleCache = {};
        // Keep track of injected style tags to clean them up later
        const injectedStylePaths = new Set();

        // Helper function to add/update style tags in the <head>
        const injectCss = (path, cssContent) => {
            const existingStyle = document.querySelector(`style[data-path="${path}"]`);
            if (existingStyle) {
                existingStyle.textContent = cssContent;
            } else {
                const style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                style.setAttribute('data-path', path);
                style.textContent = cssContent;
                document.head.appendChild(style);
            }
            injectedStylePaths.add(path);
        };

        const evaluateCode = (path) => {
            if (moduleCache[path]) {
                return moduleCache[path];
            }

            const code = files[path];
            if (code === undefined) {
                throw new Error(`Module not found: ${path}`);
            }

            // **CSS FILE HANDLING LOGIC**
            if (path.endsWith('.css')) {
                injectCss(path, code);
                // CSS modules don't export anything for JS to use
                const cssModule = { exports: {} };
                moduleCache[path] = cssModule;
                return cssModule;
            }

            // **JS/JSX FILE HANDLING LOGIC (existing code)**
            const customRequire = (requestedPath) => {
                const resolvedPath = resolvePath(path, requestedPath);
                return evaluateCode(resolvedPath);
            };

            try {
                const transformedCode = Babel.transform(code, {
                    presets: ['react'],
                    plugins: ['transform-modules-commonjs']
                }).code;

                const exports = {};
                const module = { exports };

                new Function('require', 'module', 'exports', 'React', transformedCode)(
                    customRequire, module, exports, React
                );

                moduleCache[path] = module.exports;
                return module.exports;

            } catch (err) {
                console.error(`Error evaluating ${path}:`, err);
                throw err;
            }
        };

        try {
            const entryModule = evaluateCode(entryPoint);
            const RenderedComponent = entryModule.default;

            if (typeof RenderedComponent === 'function' || (typeof RenderedComponent === 'object' && RenderedComponent !== null)) {
                setComponent(() => RenderedComponent);
                setError(null);
            } else {
                throw new Error(`The entry point '${entryPoint}' must export a default React component.`);
            }
        } catch (err) {
            setError(err.message);
            setComponent(null);
        }

        // **CLEANUP LOGIC**
        // This function runs when the component unmounts or re-renders
        return () => {
            injectedStylePaths.forEach(path => {
                const styleTag = document.querySelector(`style[data-path="${path}"]`);
                if (styleTag) {
                    document.head.removeChild(styleTag);
                }
            });
        };

    }, [files, entryPoint]);

    return (
        <div id='codepreview'>
            {error && <div className='text-red-500 whitespace-pre-wrap'>{error}</div>}
            {Component && !error && <Component />}
        </div>
    );
}
