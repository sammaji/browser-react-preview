import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Babel from "@babel/standalone";
import type { PluginObj } from '@babel/core';
import type { JSXOpeningElement } from '@babel/types';
import type { NodePath } from '@babel/traverse';

const injectDataId = ({ types: t }: { types: typeof Babel.types }): PluginObj => {
    const addDataId = (jsxElementPath: NodePath, componentName: string) => {
        if (jsxElementPath.isJSXElement()) {
            const attrs = jsxElementPath.get('openingElement').get('attributes');
            const hasDataId = attrs.some(attr => attr.isJSXAttribute() && attr.get('name').isJSXIdentifier({ name: 'data-id' }));
            if (!hasDataId) {
                jsxElementPath.get('openingElement').pushContainer('attributes',
                    t.jsxAttribute(
                        t.jsxIdentifier('data-id'),
                        t.stringLiteral(componentName)
                    )
                );
            }
        }
    };

    const componentVisitor = {
        ReturnStatement(returnPath: NodePath<Babel.types.ReturnStatement>, state: any) {
            if (returnPath.getFunctionParent() !== state.componentPath) return;
            const arg = returnPath.get('argument');
            addDataId(arg, state.componentName);
        }
    };

    return {
        visitor: {
            FunctionDeclaration(path) {
                if (path.node.id && /^[A-Z]/.test(path.node.id.name)) {
                    const componentName = path.node.id.name;
                    path.traverse(componentVisitor, { componentPath: path, componentName });
                }
            },
            VariableDeclarator(path) {
                if (path.get('id').isIdentifier() && /^[A-Z]/.test(path.get('id').node.name)) {
                    const componentName = path.get('id').node.name;
                    const init = path.get('init');
                    if (init.isArrowFunctionExpression()) {
                        const body = init.get('body');
                        if (body.isJSXElement()) {
                            addDataId(body, componentName);
                        } else if (body.isBlockStatement()) {
                            init.traverse(componentVisitor, { componentPath: init, componentName });
                        }
                    }
                }
            }
        }
    };
};


const injectPreview = ({ types: t }: { types: typeof Babel.types }): PluginObj => {
    return {
        visitor: {
            JSXOpeningElement(path: NodePath<JSXOpeningElement>) {
                const nameNode = path.node.name;
                if (nameNode.type === 'JSXIdentifier' && /^[A-Z]/.test(nameNode.name)) {
                    return;
                }

                const dataIdAttr = path.node.attributes.find(
                    (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'data-id'
                );

                let elementName: string;
                if (dataIdAttr && dataIdAttr.type === 'JSXAttribute' && dataIdAttr.value?.type === 'StringLiteral') {
                    elementName = dataIdAttr.value.value;
                } else if (nameNode.type === 'JSXIdentifier') {
                    elementName = nameNode.name;
                } else {
                    return;
                }

                const mouseEnterHandler = t.arrowFunctionExpression(
                    [t.identifier('e')],
                    t.blockStatement([
                        t.expressionStatement(
                            t.callExpression(
                                t.memberExpression(
                                    t.memberExpression(
                                        t.memberExpression(t.identifier('e'), t.identifier('currentTarget')),
                                        t.identifier('classList')
                                    ),
                                    t.identifier('add')
                                ),
                                [t.stringLiteral('hover-highlight')]
                            )
                        ),
                        t.expressionStatement(
                            t.callExpression(t.identifier('showTooltip'), [
                                t.stringLiteral(elementName),
                                t.callExpression(
                                    t.memberExpression(
                                        t.memberExpression(t.identifier('e'), t.identifier('currentTarget')),
                                        t.identifier('getBoundingClientRect')
                                    ),
                                    []
                                )
                            ])
                        )
                    ])
                );

                const onMouseEnterAttr = t.jsxAttribute(
                    t.jsxIdentifier('onMouseEnter'),
                    t.jsxExpressionContainer(mouseEnterHandler)
                );
                path.node.attributes.push(onMouseEnterAttr);

                const mouseLeaveHandler = t.arrowFunctionExpression(
                    [t.identifier('e')],
                    t.blockStatement([
                        t.expressionStatement(
                            t.callExpression(
                                t.memberExpression(
                                    t.memberExpression(
                                        t.memberExpression(t.identifier('e'), t.identifier('currentTarget')),
                                        t.identifier('classList')
                                    ),
                                    t.identifier('remove')
                                ),
                                [t.stringLiteral('hover-highlight')]
                            )
                        ),
                        t.expressionStatement(t.callExpression(t.identifier('hideTooltip'), []))
                    ])
                );

                const onMouseLeaveAttr = t.jsxAttribute(
                    t.jsxIdentifier('onMouseLeave'),
                    t.jsxExpressionContainer(mouseLeaveHandler)
                );
                path.node.attributes.push(onMouseLeaveAttr);

                const onClickHandler = t.arrowFunctionExpression(
                    [t.identifier('e')],
                    t.blockStatement([
                        t.expressionStatement(t.callExpression(t.memberExpression(t.identifier('e'), t.identifier('stopPropagation')), [])),
                        t.expressionStatement(
                            t.callExpression(t.identifier('selectElement'), [
                                t.memberExpression(t.identifier('e'), t.identifier('currentTarget'))
                            ])
                        )
                    ])
                );
                const onClickAttr = t.jsxAttribute(
                    t.jsxIdentifier('onClick'),
                    t.jsxExpressionContainer(onClickHandler)
                );
                path.node.attributes.push(onClickAttr);
            }
        }
    };
};

export function LivePreview({ code }: { code: string }) {
    const [Component, setComponent] = useState<React.ComponentType | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [tooltip, setTooltip] = useState<{ name: string; rect: DOMRect } | null>(null);
    const hideTooltipTimeoutRef = useRef<number>();

    const showTooltip = useCallback((name: string, rect: DOMRect) => {
        if (hideTooltipTimeoutRef.current) {
            clearTimeout(hideTooltipTimeoutRef.current);
        }
        setTooltip({ name, rect });
    }, []);

    const hideTooltip = useCallback(() => {
        hideTooltipTimeoutRef.current = window.setTimeout(() => {
            setTooltip(null);
        }, 50);
    }, []);

    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);

    const deselectElement = useCallback(() => {
        if (selectedElement) {
            selectedElement.removeAttribute('contentEditable');
            selectedElement.classList.remove('selected-element');
            setSelectedElement(null);
        }
    }, [selectedElement]);

    const selectElement = useCallback((element: HTMLElement) => {
        if (selectedElement === element) {
            return;
        }
        if (selectedElement) {
            selectedElement.removeAttribute('contentEditable');
            selectedElement.classList.remove('selected-element');
        }

        element.classList.remove('hover-highlight');
        element.setAttribute('contentEditable', 'true');
        element.classList.add('selected-element');
        element.focus();
        element.style.cursor = 'text';
        setSelectedElement(element);
    }, [selectedElement]);

    const showTooltipRef = useRef(showTooltip);
    useEffect(() => { showTooltipRef.current = showTooltip; }, [showTooltip]);

    const hideTooltipRef = useRef(hideTooltip);
    useEffect(() => { hideTooltipRef.current = hideTooltip; }, [hideTooltip]);

    const selectElementRef = useRef(selectElement);
    useEffect(() => { selectElementRef.current = selectElement; }, [selectElement]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (selectedElement && !selectedElement.contains(e.target as Node)) {
                deselectElement();
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [selectedElement, deselectElement]);

    useEffect(() => {
        const transpileAndRender = () => {
            try {
                const transformedCode = Babel.transform(code, {
                    presets: ['react'],
                    plugins: [
                        injectDataId,
                        injectPreview,
                        'transform-modules-commonjs'
                    ]
                }).code;

                const exports: { default: React.ComponentType | null } = { default: null };
                const module = { exports };

                if (!transformedCode) return;

                new Function('React', 'module', 'exports', 'showTooltip', 'hideTooltip', 'selectElement', transformedCode)(
                    React,
                    module,
                    exports,
                    (...args: any[]) => showTooltipRef.current(...args),
                    (...args: any[]) => hideTooltipRef.current(...args),
                    (...args: any[]) => selectElementRef.current(...args)
                );
                const RenderedComponent = module.exports.default;

                if (typeof RenderedComponent === 'function' || (typeof RenderedComponent === 'object' && RenderedComponent !== null)) {
                    setComponent(() => RenderedComponent);
                    setError(null);
                } else {
                    throw new Error("The code must export a default React component.");
                }
            }
            catch (err: unknown) {
                console.error("Error rendering component:", err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError(String(err));
                }
                setComponent(null);
            }
        };

        const debounceTimeout = setTimeout(transpileAndRender, 500);
        return () => clearTimeout(debounceTimeout);

    }, [code]);

    return (
        <div id='codepreview'>
            <style>
                {`
                .hover-highlight {
                    outline: 1px dashed #4169E1;
                    background-color: rgba(65, 105, 225, 0.2);
                    box-shadow: 0 0 0 1px #4169E1 inset;
                }

                .selected-element {
                    outline: 2px solid #007bff !important;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5) !important;
                }
                `}
            </style>

            {error && <div className='text-destructive-foreground whitespace-pre-wrap'>{error}</div>}

            {Component && !error && <Component />}

            {tooltip && (
                <div
                    className="absolute bg-blue-500 text-white text-[0.65rem] z-100 pointer-events-none whitespace-nowrap h-[16px] px-1"
                    style={{
                        top: (tooltip?.rect?.top || 0) - 16,
                        left: (tooltip?.rect?.left || 0),
                    }}
                >
                    {tooltip.name}
                </div>
            )}
        </div>
    );
}
