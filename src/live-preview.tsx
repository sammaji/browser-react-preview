import React, { useState, useEffect, useCallback } from 'react';
import * as Babel from "@babel/standalone";

const injectPreview = ({ types: t }) => {
    return {
        visitor: {
            JSXOpeningElement(path) {
                const isCustomComponent = path.node.name.name && /^[A-Z]/.test(path.node.name.name);
                if (isCustomComponent) {
                    return;
                }
                const elementName = path.node.name.name;

                // Create the onMouseEnter handler
                const mouseEnterHandler = t.arrowFunctionExpression(
                    [t.identifier('e')],
                    t.blockStatement([
                        // Add the 'hover-highlight' class
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
                        // Call a function to show the tooltip, passing the element's name and its position
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

                // Create the onMouseLeave handler
                const mouseLeaveHandler = t.arrowFunctionExpression(
                    [t.identifier('e')],
                    t.blockStatement([
                        // Remove the 'hover-highlight' class
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
                        // Call a function to hide the tooltip
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
    const [Component, setComponent] = useState(null);
    const [error, setError] = useState(null);

    const [tooltip, setTooltip] = useState(null);

    const showTooltip = useCallback((name, rect) => {
        setTooltip({ name, rect });
    }, []);

    const hideTooltip = useCallback(() => {
        setTooltip(null);
    }, []);

    const [selectedElement, setSelectedElement] = useState(null);

    const selectElement = useCallback((element) => {
        // Deselect the previous element if one exists
        if (selectedElement && selectedElement !== element) {
            selectedElement.removeAttribute('contentEditable');
            selectedElement.classList.remove('selected-element');
        }

        // Select the new element
        setSelectedElement(element);
        element.setAttribute('contentEditable', 'true');
        element.classList.add('selected-element');

        // Prevent click events from bubbling up
        element.style.cursor = 'text';
    }, [selectedElement]);

    useEffect(() => {
        const transpileAndRender = () => {
            try {
                const transformedCode = Babel.transform(code, {
                    presets: ['react'],
                    plugins: [
                        injectPreview,
                        'transform-modules-commonjs'
                    ]
                }).code;

                const exports = { default: null };
                const module = { exports };

                if (!transformedCode) return;

                new Function('React', 'module', 'exports', 'showTooltip', 'hideTooltip', 'selectElement', transformedCode)(
                    React,
                    module,
                    exports,
                    showTooltip,
                    hideTooltip,
                    selectElement
                );
                const RenderedComponent = exports.default;

                if (typeof RenderedComponent === 'function' || (typeof RenderedComponent === 'object' && RenderedComponent !== null)) {
                    setComponent(() => RenderedComponent);
                    setError(null);
                } else {
                    throw new Error("The code must export a default React component.");
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            catch (err: any) {
                console.error("Error rendering component:", err);
                if (typeof err?.message !== "string") return;
                setError(err?.message);
                setComponent(null);
            }
        };

        // A small debounce to prevent re-rendering on every single keystroke
        const debounceTimeout = setTimeout(transpileAndRender, 500);
        return () => clearTimeout(debounceTimeout);

    }, [code, showTooltip, hideTooltip]);

    return (
        <div id='codepreview'>
            <style>
                {`
                .hover-highlight {
                    outline: 1px dashed #4169E1;
                    background-color: rgba(65, 105, 225, 0.2);
                    box-shadow: 0 0 0 1px #4169E1 inset;
                }

                .selected-element:focus > p {
                    outline: 2px solid #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
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
