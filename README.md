# 🌦️ Clima e Tempo

Aplicativo web de previsão do tempo feito com **HTML, CSS e JavaScript puro**, usando a API da [OpenWeatherMap](https://openweathermap.org/).

## ✨ Funcionalidades

- 🔎 Busca de cidades com **sugestões automáticas** enquanto você digita
- 🌡️ Temperatura atual, sensação térmica, umidade e vento
- 📅 **Previsão dos próximos 5 dias** (máxima e mínima)
- 📍 Botão **"Minha localização"** (usa a geolocalização do navegador)
- 🔁 Troca entre **°C e °F**
- 🖼️ **Fundo dinâmico** que muda de acordo com o clima (sol, chuva, neve, névoa…)
- 📱 Layout responsivo para celular

## 🚀 Como rodar

1. Clone o repositório:
   ```bash
   git clone https://github.com/Guilherme-tasso/previsao-do-tempo.git
   ```
2. Crie uma chave grátis em [openweathermap.org](https://home.openweathermap.org/api_keys).
3. Copie `config.example.js` para `config.js` e coloque sua chave:
   ```js
   window.CONFIG = {
       API_KEY: "SUA_CHAVE_AQUI"
   };
   ```
4. Abra o `index.html` no navegador (ou use a extensão **Live Server** do VS Code).

> O arquivo `config.js` está no `.gitignore`, então sua chave não é enviada para o GitHub.

## 🛠️ Tecnologias

- HTML5
- CSS3 (Flexbox, Grid, animações)
- JavaScript (Fetch API, async/await, Geolocation API)
- [OpenWeatherMap API](https://openweathermap.org/api) — endpoints *Current Weather*, *5 Day Forecast* e *Geocoding*

## 📁 Estrutura

```
├── index.html          # Estrutura da página
├── styles.css          # Estilos
├── scripts.js          # Lógica e chamadas à API
├── config.example.js   # Modelo do arquivo de configuração
└── img/                # Imagens de fundo
```

## 👤 Autor

Feito por **Guilherme**.
