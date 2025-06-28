# SVG Multi-Language Runtime Engine

> Silnik wykonawczy umożliwiający uruchamianie kodu Python, R, SQL, Lua i WebAssembly bezpośrednio w plikach SVG

## 📁 Struktura runtime/

```
runtime/
├── README.md              # Ta dokumentacja
├── svg-interpreter.js     # Główny orchestrator runtime
├── python-bridge.js       # Most do Pyodide (Python w przeglądarce)
├── r-bridge.js           # Most do WebR (R w WebAssembly)
├── sql-bridge.js         # Most do sql.js (SQLite w przeglądarce)
├── lua-bridge.js         # Most do Fengari (Lua w przeglądarce)
└── wasm-loader.js        # Loader dla modułów WebAssembly
```

## 🎯 Architektura systemu

### Główne komponenty

```
┌─────────────────────────────────────────────────────────────┐
│                    SVG Document                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ <script     │ │ <script     │ │ <script     │           │
│  │ type="py">  │ │ type="sql"> │ │ type="lua"> │           │
│  │ ...code...  │ │ ...code...  │ │ ...code...  │           │
│  │ </script>   │ │ </script>   │ │ </script>   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                SVG Interpreter                              │
│  • Parsowanie script tagów                                 │
│  • Routing do odpowiednich mostków                         │
│  • Zarządzanie lifecycle wykonania                         │
│  • Error handling i fallbacks                              │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Python Bridge  │ │   SQL Bridge    │ │   Lua Bridge    │
│  (Pyodide)      │ │   (sql.js)      │ │   (Fengari)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Python       │ │     SQLite      │ │      Lua        │
│   Runtime       │ │    Database     │ │    Runtime      │
│   + NumPy       │ │    Engine       │ │   + Libraries   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 🔧 svg-interpreter.js - Główny orchestrator

### Interfejs publiczny

```javascript
class SVGInterpreter {
  constructor(options = {}) {
    this.options = {
      enablePython: true,
      enableR: true,
      enableSQL: true,
      enableLua: true,
      enableWASM: true,
      autoExecute: true,
      errorHandling: 'graceful',
      ...options
    };
    
    this.bridges = new Map();
    this.executionQueue = [];
    this.isInitialized = false;
  }
  
  // Inicjalizacja wszystkich runtime environments
  async initialize() {
    console.log('Inicjalizacja SVG Multi-Language Runtime...');
    
    try {
      // Ładowanie mostków zgodnie z konfiguracją
      if (this.options.enablePython) {
        const PythonBridge = await import('./python-bridge.js');
        this.bridges.set('python', new PythonBridge.default());
      }
      
      if (this.options.enableR) {
        const RBridge = await import('./r-bridge.js');
        this.bridges.set('r', new RBridge.default());
      }
      
      if (this.options.enableSQL) {
        const SQLBridge = await import('./sql-bridge.js');
        this.bridges.set('sql', new SQLBridge.default());
      }
      
      if (this.options.enableLua) {
        const LuaBridge = await import('./lua-bridge.js');
        this.bridges.set('lua', new LuaBridge.default());
      }
      
      if (this.options.enableWASM) {
        const WASMLoader = await import('./wasm-loader.js');
        this.bridges.set('wasm', new WASMLoader.default());
      }
      
      // Inicjalizacja wszystkich mostków
      const initPromises = Array.from(this.bridges.values()).map(bridge => 
        bridge.initialize()
      );
      
      await Promise.all(initPromises);
      
      this.isInitialized = true;
      console.log('SVG Runtime zainicjalizowany pomyślnie');
      
      // Auto-wykrywanie i wykonanie skryptów w SVG
      if (this.options.autoExecute) {
        await this.executeScriptsInDocument();
      }
      
    } catch (error) {
      console.error('Błąd inicjalizacji SVG Runtime:', error);
      throw error;
    }
  }
  
  // Wykrywanie i wykonywanie skryptów w dokumencie
  async executeScriptsInDocument() {
    const scripts = document.querySelectorAll('script[type^="text/"]');
    
    for (const script of scripts) {
      try {
        await this.executeScript(script);
      } catch (error) {
        this.handleExecutionError(script, error);
      }
    }
  }
  
  // Wykonanie pojedynczego skryptu
  async executeScript(scriptElement) {
    const type = scriptElement.getAttribute('type');
    const code = scriptElement.textContent;
    const language = this.detectLanguage(type);
    
    if (!language) {
      console.warn(`Nieobsługiwany typ skryptu: ${type}`);
      return null;
    }
    
    const bridge = this.bridges.get(language);
    if (!bridge) {
      throw new Error(`Most dla języka ${language} nie jest dostępny`);
    }
    
    console.log(`Wykonywanie skryptu ${language}...`);
    
    // Przygotowanie kontekstu wykonania
    const context = this.prepareExecutionContext(scriptElement);
    
    // Wykonanie kodu
    const result = await bridge.execute(code, context);
    
    // Post-processing wyników
    this.processExecutionResult(scriptElement, result);
    
    return result;
  }
  
  // Wykrywanie języka na podstawie typu MIME
  detectLanguage(mimeType) {
    const languageMap = {
      'text/python': 'python',
      'application/x-python': 'python',
      'text/r': 'r',
      'application/x-r': 'r',
      'text/sql': 'sql',
      'application/sql': 'sql',
      'text/lua': 'lua',
      'application/x-lua': 'lua',
      'text/wasm': 'wasm',
      'application/wasm': 'wasm'
    };
    
    return languageMap[mimeType] || null;
  }
  
  // Przygotowanie kontekstu wykonania
  prepareExecutionContext(scriptElement) {
    return {
      element: scriptElement,
      document: document,
      window: window,
      svgRoot: scriptElement.closest('svg'),
      dataAttributes: this.extractDataAttributes(scriptElement),
      imports: this.resolveImports(scriptElement)
    };
  }
  
  // Wyciąganie atrybutów data-*
  extractDataAttributes(element) {
    const dataAttrs = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        const key = attr.name.slice(5).replace(/-([a-z])/g, (_, letter) => 
          letter.toUpperCase()
        );
        dataAttrs[key] = attr.value;
      }
    });
    return dataAttrs;
  }
  
  // Obsługa błędów wykonania
  handleExecutionError(scriptElement, error) {
    console.error('Błąd wykonania skryptu:', error);
    
    if (this.options.errorHandling === 'graceful') {
      // Graceful degradation - pokaż błąd w UI ale kontynuuj
      this.showErrorInUI(scriptElement, error);
    } else if (this.options.errorHandling === 'strict') {
      // Strict mode - zatrzymaj wykonywanie
      throw error;
    }
    
    // Emit custom event dla aplikacji
    const errorEvent = new CustomEvent('svgScriptError', {
      detail: { element: scriptElement, error: error }
    });
    document.dispatchEvent(errorEvent);
  }
  
  // Wyświetlanie błędu w interfejsie SVG
  showErrorInUI(scriptElement, error) {
    const svgRoot = scriptElement.closest('svg');
    if (!svgRoot) return;
    
    // Tworzenie elementu błędu
    const errorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    errorGroup.setAttribute("class", "script-error");
    
    const errorRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    errorRect.setAttribute("x", "10");
    errorRect.setAttribute("y", "10");
    errorRect.setAttribute("width", "300");
    errorRect.setAttribute("height", "60");
    errorRect.setAttribute("fill", "#FEE2E2");
    errorRect.setAttribute("stroke", "#DC2626");
    errorRect.setAttribute("rx", "4");
    
    const errorText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    errorText.setAttribute("x", "20");
    errorText.setAttribute("y", "30");
    errorText.setAttribute("font-family", "monospace");
    errorText.setAttribute("font-size", "12");
    errorText.setAttribute("fill", "#DC2626");
    errorText.textContent = `Script Error: ${error.message}`;
    
    errorGroup.appendChild(errorRect);
    errorGroup.appendChild(errorText);
    svgRoot.appendChild(errorGroup);
    
    // Auto-usuwanie po 5 sekundach
    setTimeout(() => {
      if (errorGroup.parentNode) {
        errorGroup.parentNode.removeChild(errorGroup);
      }
    }, 5000);
  }
  
  // API dla zewnętrznych aplikacji
  async executeCode(language, code, context = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const bridge = this.bridges.get(language);
    if (!bridge) {
      throw new Error(`Język ${language} nie jest obsługiwany`);
    }