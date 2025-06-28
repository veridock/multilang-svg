# R Statistics SVG Example

> Demonstracja zaawansowanej analizy statystycznej i modelowania bezpośrednio w SVG z użyciem R

## 📁 Zawartość folderu

```
02-r-statistics/
├── README.md                # Ta dokumentacja
├── index.html              # Strona testowa z przykładem
├── statistical-analysis.svg # Główny plik SVG z kodem R
├── data/
│   └── dataset.csv         # Zestaw danych do analizy
└── screenshots/
    └── preview.png         # Zrzut ekranu działającego przykładu
```

## 🎯 Co demonstruje ten przykład

- **Zaawansowana analiza statystyczna** - regresja liniowa, ANOVA, testy hipotez
- **Wizualizacje statystyczne** - histogramy, boxploty, scatter plots z liniami trendu
- **Modelowanie predykcyjne** - przewidywanie wartości z intervałami ufności
- **Interaktywne parametry** - dynamiczna zmiana modeli i wykresów
- **R packages integration** - ggplot2, dplyr, forecast w przeglądarce

## 📊 Dane wejściowe

Plik `dataset.csv` zawiera dane eksperymentu marketingowego:

```csv
campaign_id,budget,impressions,clicks,conversions,revenue,channel,season
1,5000,125000,1250,125,12500,social,spring
2,7500,180000,1980,198,19800,search,summer
3,3000,90000,900,90,9000,display,autumn
...
```

## 🚀 Jak uruchomić

### Wymagania
- Node.js dla serwera deweloperskiego
- WebR runtime (automatycznie ładowany z CDN)

### Uruchomienie
```bash
cd examples/02-r-statistics/
npm run serve
# Lub python3 -m http.server 8000
```

## 🔍 Analiza kodu R w SVG

### Główne funkcje statystyczne

```r
# Model regresji wielokrotnej
create_regression_model <- function(data) {
  model <- lm(revenue ~ budget + impressions + clicks, data = data)
  
  # Diagnostyka modelu
  r_squared <- summary(model)$r.squared
  p_value <- summary(model)$fstatistic[4]
  
  return(list(
    model = model,
    r_squared = r_squared,
    p_value = p_value,
    coefficients = coef(model),
    residuals = residuals(model)
  ))
}

# Analiza wariancji (ANOVA)
perform_anova <- function(data) {
  model <- aov(revenue ~ channel + season, data = data)
  anova_result <- summary(model)
  
  # Test post-hoc Tukey
  tukey_result <- TukeyHSD(model)
  
  return(list(
    anova = anova_result,
    tukey = tukey_result,
    group_means = aggregate(revenue ~ channel, data, mean)
  ))
}

# Prognozowanie z interwałami ufności
forecast_revenue <- function(model, new_data, confidence = 0.95) {
  predictions <- predict(model, new_data, interval = "confidence", level = confidence)
  
  return(data.frame(
    predicted = predictions[,"fit"],
    lower_ci = predictions[,"lwr"],
    upper_ci = predictions[,"upr"]
  ))
}
```

## 📈 Wizualizacje statystyczne

### 1. **Scatter plot z regresją**
```r
create_scatter_with_regression <- function(x, y, model) {
  # Punkty danych
  plot_points(x, y, color = "steelblue", size = 3)
  
  # Linia regresji
  abline(model, color = "red", width = 2)
  
  # Intervały ufności
  confidence_band(model, alpha = 0.05, color = "lightblue")
  
  # R-squared annotation
  text(max(x) * 0.8, max(y) * 0.9, 
       paste("R² =", round(summary(model)$r.squared, 3)))
}
```

### 2. **Box plots porównawcze**
```r
create_comparative_boxplots <- function(data, group_var, value_var) {
  groups <- unique(data[[group_var]])
  
  for(i in seq_along(groups)) {
    group_data <- data[data[[group_var]] == groups[i], value_var]
    
    # Kwartyle
    q1 <- quantile(group_data, 0.25)
    median_val <- median(group_data)
    q3 <- quantile(group_data, 0.75)
    
    # Outliers (1.5 * IQR)
    iqr <- q3 - q1
    outliers <- group_data[group_data < (q1 - 1.5*iqr) | group_data > (q3 + 1.5*iqr)]
    
    draw_boxplot(i, q1, median_val, q3, outliers)
  }
}
```

### 3. **Histogram z krzywą normalną**
```r
create_histogram_with_normal <- function(data, bins = 20) {
  # Histogram
  hist_data <- hist(data, breaks = bins, plot = FALSE)
  draw_histogram_bars(hist_data)
  
  # Dopasowana krzywa normalna
  mean_val <- mean(data)
  sd_val <- sd(data)
  
  x_seq <- seq(min(data), max(data), length.out = 100)
  normal_curve <- dnorm(x_seq, mean_val, sd_val)
  
  # Skalowanie krzywej do histogramu
  normal_scaled <- normal_curve * length(data) * diff(hist_data$breaks)[1]
  
  draw_curve(x_seq, normal_scaled, color = "red")
  
  # Test normalności Shapiro-Wilk
  shapiro_test <- shapiro.test(data)
  add_test_annotation(shapiro_test$p.value)
}
```

## 🧪 Testy statystyczne

### Test t-Studenta
```r
perform_t_test <- function(group1, group2) {
  test_result <- t.test(group1, group2)
  
  return(list(
    statistic = test_result$statistic,
    p_value = test_result$p.value,
    confidence_interval = test_result$conf.int,
    mean_difference = diff(test_result$estimate)
  ))
}
```

### Test chi-kwadrat
```r
perform_chi_square <- function(observed, expected) {
  chi_test <- chisq.test(observed, expected)
  
  return(list(
    statistic = chi_test$statistic,
    p_value = chi_test$p.value,
    degrees_freedom = chi_test$parameter,
    residuals = chi_test$residuals
  ))
}
```

## 🎛️ Interaktywne kontrolki

### Suwaki parametrów modelu
```javascript
function updateConfidenceLevel(value) {
  const confidence = parseFloat(value) / 100;
  
  // Wywołanie funkcji R z nowym poziomem ufności
  R.call('update_confidence_intervals', [confidence])
    .then(result => {
      updateVisualization(result);
    });
}

function changeModelComplexity(complexity) {
  let formula;
  switch(complexity) {
    case 'simple':
      formula = 'revenue ~ budget';
      break;
    case 'medium':
      formula = 'revenue ~ budget + impressions';
      break;
    case 'complex':
      formula = 'revenue ~ budget + impressions + clicks + I(budget^2)';
      break;
  }
  
  R.call('update_model_formula', [formula])
    .then(updateRegressionPlot);
}
```

## 📊 Metryki wydajności modeli

### Cross-validation
```r
perform_cross_validation <- function(data, formula, k = 5) {
  n <- nrow(data)
  fold_size <- floor(n / k)
  cv_errors <- numeric(k)
  
  for(i in 1:k) {
    # Podział train/test
    test_indices <- ((i-1) * fold_size + 1):(i * fold_size)
    test_data <- data[test_indices, ]
    train_data <- data[-test_indices, ]
    
    # Trenowanie modelu
    model <- lm(formula, data = train_data)
    
    # Predykcja i błąd
    predictions <- predict(model, test_data)
    cv_errors[i] <- mean((test_data$revenue - predictions)^2)
  }
  
  return(list(
    mean_cv_error = mean(cv_errors),
    cv_std = sd(cv_errors),
    individual_errors = cv_errors
  ))
}
```

### Model comparison
```r
compare_models <- function(models_list, data) {
  comparison <- data.frame(
    model = names(models_list),
    aic = sapply(models_list, AIC),
    bic = sapply(models_list, BIC),
    r_squared = sapply(models_list, function(m) summary(m)$r.squared),
    rmse = sapply(models_list, function(m) sqrt(mean(residuals(m)^2)))
  )
  
  # Ranking modeli
  comparison$rank_aic <- rank(comparison$aic)
  comparison$rank_bic <- rank(comparison$bic)
  comparison$rank_r2 <- rank(-comparison$r_squared)  # Większe R² lepsze
  
  return(comparison[order(comparison$rank_aic), ])
}
```

## 🔧 Konfiguracja WebR

### Inicjalizacja runtime R
```javascript
async function initWebR() {
  // Import WebR z CDN
  const { WebR } = await import('https://webr.r-wasm.org/latest/webr.mjs');
  
  // Inicjalizacja z required packages
  window.webR = new WebR({
    packages: ['stats', 'graphics', 'ggplot2', 'dplyr']
  });
  
  await window.webR.init();
  
  console.log('WebR initialized successfully');
  return true;
}
```

### Instalacja dodatkowych pakietów
```r
# W kontekście WebR
install.packages(c("forecast", "tseries", "zoo"))
library(forecast)
library(tseries)
```

## 🎨 Stylizacja wykresów R

### Niestandardowe tematy
```r
custom_theme <- function() {
  theme_minimal() +
  theme(
    plot.background = element_rect(fill = "#fafafa"),
    panel.background = element_rect(fill = "white"),
    text = element_text(family = "Arial", color = "#333333"),
    axis.line = element_line(color = "#666666"),
    legend.position = "bottom"
  )
}

# Paleta kolorów
custom_colors <- c("#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6")
```

## 🐛 Debugowanie i troubleshooting

### Częste problemy
```javascript
// Sprawdzenie dostępności WebR
if (typeof window.webR === 'undefined') {
  console.error('WebR nie został załadowany');
  showError('Błąd inicjalizacji R runtime');
}

// Obsługa błędów R
webR.evalR('tryCatch({
  # Kod R
}, error = function(e) {
  list(error = TRUE, message = e$message)
})')
.then(result => {
  if (result.error) {
    console.error('R Error:', result.message);
  }
});
```

## 📈 Przykłady zaawansowanych analiz

### Time series analysis
```r
analyze_time_series <- function(data) {
  ts_data <- ts(data$revenue, frequency = 12)
  
  # Dekompozycja
  decomp <- decompose(ts_data)
  
  # ARIMA model
  arima_model <- auto.arima(ts_data)
  
  # Prognoza
  forecast_result <- forecast(arima_model, h = 6)
  
  return(list(
    decomposition = decomp,
    model = arima_model,
    forecast = forecast_result
  ))
}
```

### Cluster analysis
```r
perform_clustering <- function(data, k = 3) {
  # K-means
  kmeans_result <- kmeans(data[, c("budget", "revenue")], centers = k)
  
  # Hierarchical clustering
  dist_matrix <- dist(data[, c("budget", "revenue")])
  hclust_result <- hclust(dist_matrix)
  
  return(list(
    kmeans = kmeans_result,
    hierarchical = hclust_result,
    silhouette = cluster::silhouette(kmeans_result$cluster, dist_matrix)
  ))
}
```

Ten przykład demonstruje, jak R może być używany w SVG do zaawansowanych analiz statystycznych z interaktywną wizualizacją, łącząc moc R z elastycznością SVG.