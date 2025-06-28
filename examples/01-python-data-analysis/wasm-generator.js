const wasmCode = `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

export { fibonacci };`;

// Create a WebAssembly module from the JavaScript code
export async function createWasmModule() {
    try {
        const response = await fetch('data:application/wasm;base64,' + btoa(wasmCode));
        const bytes = await response.arrayBuffer();
        return await WebAssembly.compile(bytes);
    } catch (error) {
        console.error('Error creating WASM module:', error);
        throw error;
    }
}
