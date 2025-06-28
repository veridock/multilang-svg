// SVG Runtime for multi-language support
window.executeScript = async function(language) {
    const svgElements = document.getElementsByTagName('svg');
    for (const svg of svgElements) {
        const scripts = svg.getElementsByTagName('script');
        for (const script of scripts) {
            const type = script.getAttribute('type');
            if (type === `text/${language}`) {
                const code = script.textContent;
                try {
                    // Handle different language types
                    if (language === 'python') {
                        // Convert Python code to JavaScript for demonstration
                        const jsCode = code.replace(/executeScript\('python'\)/g, 'regenerateData()');
                        eval(jsCode);
                    } else if (language === 'wasm') {
                        let wasmCode = script.textContent;
                        if (!wasmCode) {
                            const wasmUrl = script.getAttribute('src');
                            if (wasmUrl) {
                                wasmCode = await fetch(wasmUrl).then(response => response.arrayBuffer());
                            }
                        }
                        
                        if (wasmCode) {
                            try {
                                const wasmModule = await WebAssembly.instantiate(wasmCode);
                                window.wasmModule = wasmModule.instance;
                                // Execute any JavaScript code that depends on WASM
                                const jsScript = script.nextElementSibling;
                                if (jsScript && jsScript.getAttribute('type') === 'text/javascript') {
                                    eval(jsScript.textContent);
                                }
                            } catch (error) {
                                console.error('WASM initialization failed:', error);
                                const errorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                errorText.textContent = 'Error: WASM initialization failed - ' + error.message;
                                errorText.setAttribute('x', '20');
                                errorText.setAttribute('y', '20');
                                svg.appendChild(errorText);
                            }
                        } else {
                            console.error('No WASM code found');
                            const errorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                            errorText.textContent = 'Error: No WASM code found';
                            errorText.setAttribute('x', '20');
                            errorText.setAttribute('y', '20');
                            svg.appendChild(errorText);
                        }
                    }
                } catch (error) {
                    console.error(`Error executing ${language} script:`, error);
                    const errorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    errorText.textContent = `Error: ${error.message}`;
                    errorText.setAttribute('x', '20');
                    errorText.setAttribute('y', '20');
                    svg.appendChild(errorText);
                }
            }
        }
    }
};

// Initialize runtime when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // Execute all scripts initially
    await window.executeScript('python');
    await window.executeScript('wasm');
});
