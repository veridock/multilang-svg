// Simple Fibonacci implementation for browser
(function(global) {
    function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    // Attach to global scope
    global.fibonacci = fibonacci;
    
    // For direct script execution
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { fibonacci: fibonacci };
    }
})(typeof window !== 'undefined' ? window : global);
