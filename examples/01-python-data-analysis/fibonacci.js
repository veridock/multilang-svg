// Simple WASM-like interface
const fibonacciModule = {
    fibonacci: function(n) {
        if (n <= 1) return n;
        return fibonacciModule.fibonacci(n - 1) + fibonacciModule.fibonacci(n - 2);
    }
};

// Export the module
export default fibonacciModule;
