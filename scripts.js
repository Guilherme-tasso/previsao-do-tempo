// A chave da API fica em config.js (que não vai para o GitHub). Veja config.example.js.
const key = window.CONFIG && window.CONFIG.API_KEY;
const API_BASE = "https://api.openweathermap.org";

// Imagens de fundo para cada tipo de clima retornado pela API
const backgroundThemes = {
    Clear: ["./img/sol1.jpg"],
    Clouds: ["./img/nevoa1.jpg", "./img/nevoa2.jpg"],
    Rain: ["./img/chuva1.jpg", "./img/chuva2.jpg"],
    Drizzle: ["./img/chuva1.jpg", "./img/chuva2.jpg"],
    Thunderstorm: ["./img/chuva1.jpg", "./img/chuva2.jpg"],
    Snow: ["./img/neve1.jpg", "./img/neve2.jpg"],
    Mist: ["./img/nevoa1.jpg", "./img/nevoa2.jpg"],
    Fog: ["./img/nevoa1.jpg", "./img/nevoa2.jpg"],
    Haze: ["./img/nevoa1.jpg", "./img/nevoa2.jpg"],
    default: [
        "./img/aleatorio1.jpg", "./img/aleatoria2.jpg", "./img/aleatoria3.jpg",
        "./img/aleatoria4.jpg", "./img/aleatoria5.jpg"
    ]
};

const inputCityElement = document.querySelector(".input-city");
const suggestionsListElement = document.querySelector(".suggestions-list");
const errorMessageElement = document.querySelector(".error-message");
const loadingElement = document.querySelector("#loading");
const forecastSection = document.querySelector(".forecast-5day");
const forecastCards = document.querySelector("#forecast-cards");
const unitToggleBtn = document.querySelector(".unit-toggle");

let debounceTimer;
// Unidade de temperatura atual ('metric' = Celsius, 'imperial' = Fahrenheit)
let currentUnit = "metric";
// Última cidade pesquisada, usada para recarregar ao trocar de unidade
let lastQuery = null;

function unitSymbol() {
    return currentUnit === "metric" ? "°C" : "°F";
}

function windUnit() {
    return currentUnit === "metric" ? "km/h" : "mph";
}

// Monta os parâmetros da busca: por coordenadas (mais preciso) ou por nome
function queryParams(query) {
    const params = new URLSearchParams({ appid: key, lang: "pt_br", units: currentUnit });
    if (query.lat !== undefined) {
        params.set("lat", query.lat);
        params.set("lon", query.lon);
    } else {
        params.set("q", query.name);
    }
    return params;
}

function setDynamicBackground(weatherMain) {
    const themes = backgroundThemes[weatherMain] || backgroundThemes.default;
    const imageUrl = themes[Math.floor(Math.random() * themes.length)];

    // Pré-carrega a imagem para a troca de fundo ser suave
    const img = new Image();
    img.onload = () => {
        document.body.style.backgroundImage = `url('${imageUrl}')`;
    };
    img.onerror = () => {
        console.error("Erro ao carregar imagem de fundo:", imageUrl);
    };
    img.src = imageUrl;
}

function setLoading(isLoading) {
    loadingElement.classList.toggle("hidden", !isLoading);
}

function showError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.classList.remove("hidden");
}

function colocardados(dados) {
    errorMessageElement.classList.add("hidden");
    setDynamicBackground(dados.weather[0].main);

    // Vento: a API devolve m/s em 'metric', convertemos para km/h
    const wind = currentUnit === "metric" ? dados.wind.speed * 3.6 : dados.wind.speed;

    document.querySelector(".city").textContent = `Tempo em ${dados.name}`;
    document.querySelector(".time").textContent = `${Math.round(dados.main.temp)}${unitSymbol()}`;
    document.querySelector(".forecast").textContent = dados.weather[0].description;
    document.querySelector(".feels-like").textContent = `Sensação ${Math.round(dados.main.feels_like)}${unitSymbol()}`;
    document.querySelector(".humidity").textContent = `Umidade ${dados.main.humidity}%`;
    document.querySelector(".wind").textContent = `Vento ${Math.round(wind)} ${windUnit()}`;

    const icon = document.querySelector(".img");
    icon.src = `https://openweathermap.org/img/wn/${dados.weather[0].icon}@2x.png`;
    icon.alt = dados.weather[0].description;
}

// A API de previsão devolve dados a cada 3 horas; agrupamos por dia
function renderFiveDayForecast(data) {
    const days = {};
    data.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!days[date]) {
            days[date] = { min: Infinity, max: -Infinity, icon: null, description: "" };
        }
        const day = days[date];
        day.min = Math.min(day.min, item.main.temp_min);
        day.max = Math.max(day.max, item.main.temp_max);
        // Usa o ícone do horário mais próximo do meio-dia
        if (!day.icon || item.dt_txt.includes("12:00:00")) {
            day.icon = item.weather[0].icon;
            day.description = item.weather[0].description;
        }
    });

    const today = new Date().toISOString().split("T")[0];
    const nextDays = Object.keys(days).filter(date => date !== today).slice(0, 5);

    forecastCards.innerHTML = "";
    nextDays.forEach(date => {
        const day = days[date];
        const weekday = new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" });

        const card = document.createElement("div");
        card.classList.add("forecast-card");

        const name = document.createElement("p");
        name.classList.add("forecast-day");
        name.textContent = weekday.replace(".", "");

        const icon = document.createElement("img");
        icon.src = `https://openweathermap.org/img/wn/${day.icon}.png`;
        icon.alt = day.description;
        icon.title = day.description;

        const temps = document.createElement("p");
        temps.classList.add("forecast-temps");
        temps.textContent = `${Math.round(day.max)}° / ${Math.round(day.min)}°`;

        card.append(name, icon, temps);
        forecastCards.appendChild(card);
    });

    forecastSection.classList.remove("hidden");
}

async function searchCity(query) {
    if (!query.name && query.lat === undefined) return;
    if (!key) {
        showError("Chave da API não configurada. Veja o README.");
        return;
    }

    errorMessageElement.classList.add("hidden");
    setLoading(true);

    try {
        const params = queryParams(query);
        const [weatherResponse, forecastResponse] = await Promise.all([
            fetch(`${API_BASE}/data/2.5/weather?${params}`),
            fetch(`${API_BASE}/data/2.5/forecast?${params}`)
        ]);

        if (!weatherResponse.ok) {
            throw new Error(weatherResponse.status === 404 ? "Cidade não encontrada." : "Erro ao buscar o clima.");
        }

        colocardados(await weatherResponse.json());
        lastQuery = query;

        if (forecastResponse.ok) {
            renderFiveDayForecast(await forecastResponse.json());
        } else {
            forecastSection.classList.add("hidden");
        }
    } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
        showError(error.message === "Failed to fetch" ? "Sem conexão com a internet." : error.message);
        forecastSection.classList.add("hidden");
    } finally {
        setLoading(false);
    }
}

async function fetchSuggestions(cityPrefix) {
    if (cityPrefix.length < 3 || !key) {
        clearSuggestions();
        return;
    }
    try {
        const params = new URLSearchParams({ q: cityPrefix, limit: 5, appid: key });
        const response = await fetch(`${API_BASE}/geo/1.0/direct?${params}`);
        if (!response.ok) {
            throw new Error("Erro ao buscar sugestões");
        }
        displaySuggestions(await response.json());
    } catch (error) {
        console.error("Erro ao buscar sugestões:", error.message);
        clearSuggestions();
    }
}

function clearSuggestions() {
    suggestionsListElement.innerHTML = "";
}

function displaySuggestions(suggestions) {
    clearSuggestions();
    suggestions.forEach(city => {
        // Prefere o nome em português quando a API tiver
        const cityName = (city.local_names && city.local_names.pt) || city.name;
        let displayName = cityName;
        if (city.state) displayName += `, ${city.state}`;
        if (city.country) displayName += ` (${city.country})`;

        const item = document.createElement("div");
        item.classList.add("suggestion-item");
        item.textContent = displayName;
        item.addEventListener("click", () => {
            inputCityElement.value = cityName;
            searchCity({ name: cityName, lat: city.lat, lon: city.lon });
            clearSuggestions();
        });
        suggestionsListElement.appendChild(item);
    });
}

function clickbutton() {
    clearTimeout(debounceTimer);
    searchCity({ name: inputCityElement.value.trim() });
    clearSuggestions();
}

inputCityElement.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(inputCityElement.value.trim()), 300);
});

inputCityElement.addEventListener("keydown", event => {
    if (event.key === "Enter") clickbutton();
    if (event.key === "Escape") clearSuggestions();
});

document.querySelector(".search-button").addEventListener("click", clickbutton);

document.addEventListener("click", event => {
    const isClickInside = suggestionsListElement.contains(event.target) || inputCityElement.contains(event.target);
    if (!isClickInside) clearSuggestions();
});

unitToggleBtn.addEventListener("click", () => {
    currentUnit = currentUnit === "metric" ? "imperial" : "metric";
    unitToggleBtn.textContent = currentUnit === "metric" ? "Mudar para °F" : "Mudar para °C";
    if (lastQuery) searchCity(lastQuery);
});

// Botão "minha localização": usa o GPS/navegador para buscar o clima local
document.querySelector(".location-button").addEventListener("click", () => {
    if (!navigator.geolocation) {
        showError("Seu navegador não suporta geolocalização.");
        return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
        position => {
            inputCityElement.value = "";
            searchCity({ lat: position.coords.latitude, lon: position.coords.longitude });
        },
        () => {
            setLoading(false);
            showError("Não foi possível obter sua localização.");
        }
    );
});

setDynamicBackground("default");
