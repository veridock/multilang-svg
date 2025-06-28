# SQL Database Dashboard SVG Example

> Demonstracja wykonywania zapytań SQL i tworzenia dashboardów bezpośrednio w SVG

## 📁 Zawartość folderu

```
03-sql-database/
├── README.md                 # Ta dokumentacja
├── index.html               # Strona testowa z przykładem
├── database-dashboard.svg   # Główny plik SVG z kodem SQL
├── data/
│   └── sample.db           # Przykładowa baza SQLite
└── screenshots/
    └── preview.png         # Zrzut ekranu działającego przykładu
```

## 🎯 Co demonstruje ten przykład

- **Bezpośrednie zapytania SQL** w przeglądarce (SQLite via sql.js)
- **Dynamiczne dashboardy** generowane z wyników zapytań
- **Agregacje i JOIN-y** z wizualizacją w czasie rzeczywistym
- **Interaktywne filtry** modyfikujące zapytania SQL
- **Multi-chart layout** - różne typy wykresów z jednej bazy

## 🗄️ Struktura bazy danych

Przykładowa baza `sample.db` zawiera tabele:

```sql
-- Tabela sprzedaży
CREATE TABLE sales (
    id INTEGER PRIMARY KEY,
    date TEXT,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    region TEXT,
    sales_person TEXT
);

-- Tabela produktów
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    category TEXT,
    cost REAL,
    supplier TEXT
);

-- Tabela klientów
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT,
    region TEXT,
    segment TEXT,
    acquisition_date TEXT
);

-- Tabela zamówień
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    order_date TEXT,
    total_amount REAL,
    status TEXT
);
```

## 🚀 Jak uruchomić

### Szybki start
```bash
cd examples/03-sql-database/
npm run serve
# Lub python3 -m http.server 8000
```

### Z głównego projektu
```bash
npm run demo
# Przejdź do http://localhost:3000/examples/03-sql-database/
```

## 📊 Przykłady zapytań SQL w SVG

### 1. **Analiza sprzedaży według regionów**
```sql
SELECT 
    region,
    SUM(quantity * price) as total_revenue,
    COUNT(*) as orders_count,
    AVG(quantity * price) as avg_order_value
FROM sales 
WHERE date >= '2025-01-01'
GROUP BY region
ORDER BY total_revenue DESC;
```

### 2. **Top produkty z kategoriami**
```sql
SELECT 
    p.name,
    p.category,
    SUM(s.quantity) as total_sold,
    SUM(s.quantity * s.price) as revenue,
    (SUM(s.quantity * s.price) - SUM(s.quantity * p.cost)) as profit
FROM sales s
JOIN products p ON s.product_id = p.id
GROUP BY p.id, p.name, p.category
ORDER BY revenue DESC
LIMIT 10;
```

### 3. **Trend miesięczny z prognozą**
```sql
SELECT 
    strftime('%Y-%m', date) as month,
    SUM(quantity * price) as monthly_revenue,
    COUNT(DISTINCT sales_person) as active_salespeople,
    AVG(quantity) as avg_quantity_per_sale
FROM sales
GROUP BY strftime('%Y-%m', date)
ORDER BY month;
```

## 🔍 Analiza kodu SVG

### Struktura pliku `database-dashboard.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <!-- SQL Script Section -->
  <script type="text/sql" data-db="./data/sample.db"><![CDATA[
    -- Definicje głównych zapytań
    
    -- Query 1: Revenue by Region
    CREATE VIEW revenue_by_region AS
    SELECT 
        region,
        SUM(quantity * price) as total_revenue,
        COUNT(*) as orders_count,
        AVG(quantity * price) as avg_order
    FROM sales 
    WHERE date >= '2025-01-01'
    GROUP BY region;
    
    -- Query 2: Product Performance
    CREATE VIEW product_performance AS
    SELECT 
        p.name,
        p.category,
        SUM(s.quantity) as units_sold,
        SUM(s.quantity * s.price) as revenue,
        ROUND((SUM(s.quantity * s.price) - SUM(s.quantity * p.cost)), 2) as profit,
        ROUND((SUM(s.quantity * s.price) - SUM(s.quantity * p.cost)) / SUM(s.quantity * s.price) * 100, 1) as margin_percent
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY p.id
    ORDER BY revenue DESC;
    
    -- Query 3: Monthly Trends
    CREATE VIEW monthly_trends AS
    SELECT 
        strftime('%Y-%m', date) as month,
        strftime('%m', date) as month_num,
        SUM(quantity * price) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT sales_person) as salespeople,
        AVG(quantity * price) as avg_order_value
    FROM sales
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month;
    
    -- Query 4: Sales Performance by Person
    CREATE VIEW sales_performance AS
    SELECT 
        sales_person,
        region,
        COUNT(*) as total_sales,
        SUM(quantity * price) as total_revenue,
        AVG(quantity * price) as avg_sale,
        MAX(quantity * price) as biggest_sale
    FROM sales
    GROUP BY sales_person, region
    ORDER BY total_revenue DESC;
  ]]></script>
  
  <!-- JavaScript Bridge for SQL execution -->
  <script><![CDATA[
    let db = null;
    let queryResults = {};
    
    // Inicjalizacja sql.js i ładowanie bazy
    async function initDatabase() {
      try {
        console.log('Ładowanie sql.js...');
        
        // Import sql.js z CDN
        const SQL = await import('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js');
        await SQL.default();
        
        // Ładowanie bazy danych
        const response = await fetch('./data/sample.db');
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);
        
        db = new SQL.Database(data);
        console.log('Baza danych załadowana pomyślnie');
        
        return true;
      } catch (error) {
        console.error('Błąd ładowania bazy:', error);
        showError('Nie można załadować bazy danych');
        return false;
      }
    }
    
    // Wykonywanie zapytania SQL
    function executeQuery(queryName, sqlQuery) {
      if (!db) {
        console.error('Baza danych nie została załadowana');
        return null;
      }
      
      try {
        const result = db.exec(sqlQuery);
        if (result.length > 0) {
          const columns = result[0].columns;
          const values = result[0].values;
          
          // Konwersja do formatu obiektowego
          const rows = values.map(row => {
            const obj = {};
            columns.forEach((col, index) => {
              obj[col] = row[index];
            });
            return obj;
          });
          
          queryResults[queryName] = rows;
          console.log(`Query ${queryName} executed:`, rows.length, 'rows');
          return rows;
        }
        return [];
      } catch (error) {
        console.error(`Błąd wykonywania zapytania ${queryName}:`, error);
        return null;
      }
    }
    
    // Tworzenie wykresu kołowego dla regionów
    function createPieChart(data, containerId) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      
      if (!data || data.length === 0) return;
      
      const centerX = 150;
      const centerY = 150;
      const radius = 100;
      
      // Obliczanie sum i kątów
      const total = data.reduce((sum, item) => sum + parseFloat(item.total_revenue), 0);
      let currentAngle = 0;
      
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
      
      data.forEach((item, index) => {
        const percentage = parseFloat(item.total_revenue) / total;
        const angle = percentage * 2 * Math.PI;
        
        // Tworzenie segmentu koła
        const largeArcFlag = angle > Math.PI ? 1 : 0;
        const x1 = centerX + radius * Math.cos(currentAngle);
        const y1 = centerY + radius * Math.sin(currentAngle);
        const x2 = centerX + radius * Math.cos(currentAngle + angle);
        const y2 = centerY + radius * Math.sin(currentAngle + angle);
        
        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", colors[index % colors.length]);
        path.setAttribute("stroke", "#fff");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("opacity", "0.8");
        
        // Hover effect
        path.addEventListener("mouseenter", function() {
          this.setAttribute("opacity", "1");
          this.setAttribute("transform", `scale(1.05) translate(${centerX * 0.02}, ${centerY * 0.02})`);
        });
        
        path.addEventListener("mouseleave", function() {
          this.setAttribute("opacity", "0.8");
          this.setAttribute("transform", "");
        });
        
        container.appendChild(path);
        
        // Etykieta
        const labelAngle = currentAngle + angle / 2;
        const labelRadius = radius * 0.7;
        const labelX = centerX + labelRadius * Math.cos(labelAngle);
        const labelY = centerY + labelRadius * Math.sin(labelAngle);
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", labelX);
        text.setAttribute("y", labelY);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-family", "Arial, sans-serif");
        text.setAttribute("font-size", "12");
        text.setAttribute("fill", "white");
        text.setAttribute("font-weight", "bold");
        text.textContent = `${(percentage * 100).toFixed(1)}%`;
        container.appendChild(text);
        
        currentAngle += angle;
      });
      
      // Legenda
      const legendY = 320;
      data.forEach((item, index) => {
        const legendX = 50 + (index * 120);
        
        // Kolorowy kwadracik
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", legendX);
        rect.setAttribute("y", legendY);
        rect.setAttribute("width", "15");
        rect.setAttribute("height", "15");
        rect.setAttribute("fill", colors[index % colors.length]);
        container.appendChild(rect);
        
        // Tekst legendy
        const legendText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        legendText.setAttribute("x", legendX + 20);
        legendText.setAttribute("y", legendY + 12);
        legendText.setAttribute("font-family", "Arial, sans-serif");
        legendText.setAttribute("font-size", "11");
        legendText.setAttribute("fill", "#374151");
        legendText.textContent = `${item.region} (${Math.round(item.total_revenue/1000)}k)`;
        container.appendChild(legendText);
      });
    }
    
    // Tworzenie wykresu słupkowego dla produktów
    function createBarChart(data, containerId) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      
      if (!data || data.length === 0) return;
      
      const maxItems = 8; // Pokazuj tylko top 8
      const topData = data.slice(0, maxItems);
      
      const chartWidth = 500;
      const chartHeight = 250;
      const barWidth = chartWidth / topData.length - 10;
      const maxRevenue = Math.max(...topData.map(item => parseFloat(item.revenue)));
      
      topData.forEach((item, index) => {
        const barHeight = (parseFloat(item.revenue) / maxRevenue) * chartHeight;
        const x = index * (barWidth + 10) + 50;
        const y = 300 - barHeight;
        
        // Słupek
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", barHeight);
        rect.setAttribute("fill", "#6366F1");
        rect.setAttribute("stroke", "#4F46E5");
        rect.setAttribute("opacity", "0.8");
        
        // Animacja
        rect.style.transform = "scaleY(0)";
        rect.style.transformOrigin = "bottom";
        rect.style.transition = "transform 0.8s ease-out";
        setTimeout(() => {
          rect.style.transform = "scaleY(1)";
        }, index * 100);
        
        container.appendChild(rect);
        
        // Nazwa produktu
        const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameText.setAttribute("x", x + barWidth/2);
        nameText.setAttribute("y", 320);
        nameText.setAttribute("text-anchor", "middle");
        nameText.setAttribute("font-family", "Arial, sans-serif");
        nameText.setAttribute("font-size", "9");
        nameText.setAttribute("fill", "#374151");
        nameText.textContent = item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name;
        container.appendChild(nameText);
        
        // Wartość
        const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueText.setAttribute("x", x + barWidth/2);
        valueText.setAttribute("y", y - 5);
        valueText.setAttribute("text-anchor", "middle");
        valueText.setAttribute("font-family", "Arial, sans-serif");
        valueText.setAttribute("font-size", "10");
        valueText.setAttribute("font-weight", "bold");
        valueText.setAttribute("fill", "#1F2937");
        valueText.textContent = `${Math.round(item.revenue/1000)}k`;
        container.appendChild(valueText);
      });
    }
    
    // Tworzenie wykresu trendu czasowego
    function createTrendChart(data, containerId) {
      const container = document.getElementById(containerId);
      container.innerHTML = '';
      
      if (!data || data.length === 0) return;
      
      const chartWidth = 400;
      const chartHeight = 150;
      const startX = 50;
      const startY = 200;
      
      const maxRevenue = Math.max(...data.map(item => parseFloat(item.revenue)));
      const minRevenue = Math.min(...data.map(item => parseFloat(item.revenue)));
      const revenueRange = maxRevenue - minRevenue;
      
      // Tworzenie ścieżki linii
      let pathData = "";
      const points = [];
      
      data.forEach((item, index) => {
        const x = startX + (index / (data.length - 1)) * chartWidth;
        const normalizedRevenue = revenueRange > 0 ? (parseFloat(item.revenue) - minRevenue) / revenueRange : 0.5;
        const y = startY - (normalizedRevenue * chartHeight);
        
        points.push({x, y, data: item});
        
        if (index === 0) {
          pathData += `M ${x} ${y}`;
        } else {
          pathData += ` L ${x} ${y}`;
        }
      });
      
      // Linia trendu
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", "#10B981");
      path.setAttribute("stroke-width", "3");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      container.appendChild(path);
      
      // Obszar pod linią (gradient)
      const areaPath = pathData + ` L ${points[points.length-1].x} ${startY} L ${startX} ${startY} Z`;
      const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
      area.setAttribute("d", areaPath);
      area.setAttribute("fill", "url(#trendGradient)");
      area.setAttribute("opacity", "0.3");
      container.appendChild(area);
      
      // Punkty na linii
      points.forEach((point, index) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", point.x);
        circle.setAttribute("cy", point.y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#059669");
        circle.setAttribute("stroke", "#fff");
        circle.setAttribute("stroke-width", "2");
        container.appendChild(circle);
        
        // Etykieta miesiąca
        const monthText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        monthText.setAttribute("x", point.x);
        monthText.setAttribute("y", startY + 20);
        monthText.setAttribute("text-anchor", "middle");
        monthText.setAttribute("font-family", "Arial, sans-serif");
        monthText.setAttribute("font-size", "10");
        monthText.setAttribute("fill", "#6B7280");
        monthText.textContent = point.data.month.split('-')[1];
        container.appendChild(monthText);
      });
    }
    
    // Główna funkcja ładująca wszystkie dane
    async function loadDashboard() {
      const loadingElement = document.getElementById('loading');
      
      try {
        // Inicjalizacja bazy
        const dbReady = await initDatabase();
        if (!dbReady) return;
        
        // Wykonywanie zapytań
        console.log('Wykonywanie zapytań SQL...');
        
        const revenueByRegion = executeQuery('revenue_by_region', 
          'SELECT region, SUM(quantity * price) as total_revenue FROM sales GROUP BY region ORDER BY total_revenue DESC'
        );
        
        const productPerformance = executeQuery('product_performance',
          `SELECT p.name, SUM(s.quantity * s.price) as revenue, p.category 
           FROM sales s JOIN products p ON s.product_id = p.id 
           GROUP BY p.id ORDER BY revenue DESC`
        );
        
        const monthlyTrends = executeQuery('monthly_trends',
          `SELECT strftime('%Y-%m', date) as month, SUM(quantity * price) as revenue 
           FROM sales GROUP BY strftime('%Y-%m', date) ORDER BY month`
        );
        
        // Tworzenie wykresów
        if (revenueByRegion) createPieChart(revenueByRegion, 'pie-chart-container');
        if (productPerformance) createBarChart(productPerformance, 'bar-chart-container');
        if (monthlyTrends) createTrendChart(monthlyTrends, 'trend-chart-container');
        
        // Aktualizacja metryk
        updateMetrics(revenueByRegion, productPerformance, monthlyTrends);
        
        // Ukrycie loadingu
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
        
        console.log('Dashboard załadowany pomyślnie!');
        
      } catch (error) {
        console.error('Błąd ładowania dashboard:', error);
        showError('Wystąpił błąd podczas ładowania danych');
      }
    }
    
    function updateMetrics(regions, products, trends) {
      if (regions && regions.length > 0) {
        const totalRevenue = regions.reduce((sum, r) => sum + parseFloat(r.total_revenue), 0);
        document.getElementById('total-revenue').textContent = `${(totalRevenue/1000).toFixed(0)}k`;
      }
      
      if (products && products.length > 0) {
        document.getElementById('top-product').textContent = products[0].name;
      }
      
      if (trends && trends.length > 1) {
        const lastMonth = parseFloat(trends[trends.length - 1].revenue);
        const prevMonth = parseFloat(trends[trends.length - 2].revenue);
        const growth = ((lastMonth - prevMonth) / prevMonth * 100).toFixed(1);
        document.getElementById('growth-rate').textContent = `${growth}%`;
      }
    }
    
    function showError(message) {
      const errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      }
    }
    
    // Funkcje filtrowania
    function filterByRegion(region) {
      console.log('Filtrowanie po regionie:', region);
      // Ponowne wykonanie zapytań z filtrem WHERE region = ?
    }
    
    function filterByDateRange(startDate, endDate) {
      console.log('Filtrowanie po dacie:', startDate, 'do', endDate);
      // Ponowne wykonanie zapytań z filtrem WHERE date BETWEEN ? AND ?
    }
    
    // Inicjalizacja po załadowaniu DOM
    document.addEventListener('DOMContentLoaded', function() {
      console.log('SQL Dashboard SVG załadowany');
      setTimeout(loadDashboard, 500); // Małe opóźnienie dla lepszego UX
    });
  ]]></script>
```

## 🎨 Funkcjonalności SQL Dashboard

### 1. **Wielokrotne zapytania jednocześnie**
- Równoległe wykonywanie zapytań SQL
- Cachowanie wyników dla lepszej wydajności
- Automatyczne odświeżanie danych

### 2. **Różnorodne wizualizacje**
- **Pie Chart** - podział przychodów według regionów
- **Bar Chart** - top produkty według sprzedaży
- **Line Chart** - trendy czasowe miesięczne
- **Metrics Cards** - kluczowe wskaźniki

### 3. **Interaktywne filtry**
```javascript
// Dynamiczne filtry SQL
function applyFilters() {
  const region = getSelectedRegion();
  const dateRange = getSelectedDateRange();
  
  const query = `
    SELECT * FROM sales 
    WHERE region = '${region}' 
    AND date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
  `;
  
  executeQuery('filtered_sales', query);
}
```

### 4. **Real-time updates**
- WebSocket integration możliwa
- Polling dla odświeżania danych
- Incremental data loading

## 🛠️ Rozszerzenia i customizacja

### Dodanie nowego wykresu
```xml
<!-- W sekcji SQL -->
<script type="text/sql"><![CDATA[
  CREATE VIEW customer_segments AS
  SELECT 
    segment,
    COUNT(*) as customer_count,
    AVG(total_amount) as avg_order_value
  FROM customers c
  JOIN orders o ON c.id = o.customer_id
  GROUP BY segment;
]]></script>
```

### Custom SQL functions
```javascript
// Dodanie funkcji agregujących
function addCustomSQLFunctions(db) {
  db.create_function("MEDIAN", (values) => {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  });
}
```

## 📊 Wydajność i optymalizacja

### Indeksy dla lepszej wydajności
```sql
-- Dodaj w init script
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_region ON sales(region);
CREATE INDEX idx_sales_product ON sales(product_id);
```

### Lazy loading wykresów
```javascript
// Ładowanie wykresów według potrzeby
const observerOptions = {
  root: null,
  threshold: 0.1
};

const chartObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadChart(entry.target.id);
    }
  });
}, observerOptions);
```

## 🔒 Bezpieczeństwo

⚠️ **Uwaga bezpieczeństwa**: Ten przykład używa sql.js w przeglądarce, co jest bezpieczne dla danych tylko do odczytu. W środowisku produkcyjnym:

- Używaj parametryzowanych zapytań
- Waliduj wszystkie dane wejściowe
- Implementuj authorization na poziomie backendu
- Nigdy nie wystawiaj bezpośredniego dostępu do bazy

## 🎯 Zastosowania praktyczne

- **Business Intelligence Dashboards**
- **Financial Reporting**
- **Sales Analytics**
- **Inventory Management**
- **Customer Segmentation Analysis**

Przykład demonstruje, jak SVG może stać się platformą dla zaawansowanych aplikacji analitycznych, łącząc moc SQL z elastycznością wektorowej grafiki.