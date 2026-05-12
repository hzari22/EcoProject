const API_KEY = "MF415F0DM575NBZCNWS17F7590";
const API_URL = "https://api.climatiq.io/data/v1/estimate";
const SUPPORTER_STORAGE_KEY = "ecotrackSupporter";

const supportLevelsData = [
    {
        name: "Starter",
        minimum: 3,
        description: "Premium-Rechner fuer Zug und Flug wird freigeschaltet."
    },
    {
        name: "Klima-Fan",
        minimum: 5,
        description: "Unterstuetzt neue Vergleichswerte und bessere Tipps."
    },
    {
        name: "Impact-Partner",
        minimum: 10,
        description: "Hilft dabei, EcoTrack weiter auszubauen."
    },
    {
        name: "Zukunfts-Sponsor",
        minimum: 20,
        description: "Finanziert langfristige Erweiterungen der Anwendung."
    }
];

const transportOptions = {
    car: {
        label: "Auto",
        activityId: "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na"
    },
    electricCar: {
        label: "Elektroauto",
        activityId: "passenger_vehicle-vehicle_type_car-fuel_source_bev-engine_size_na-vehicle_age_na-vehicle_weight_na"
    },
    train: {
        label: "Zug",
        activityId: "passenger_train-route_type_mainline-fuel_source_na",
        premium: true
    },
    bus: {
        label: "Bus",
        activityId: "passenger_vehicle-vehicle_type_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na"
    },
    coach: {
        label: "Reisebus",
        activityId: "passenger_vehicle-vehicle_type_coach-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na"
    },
    tram: {
        label: "Strassenbahn / U-Bahn",
        activityId: "passenger_vehicle-vehicle_type_na-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na"
    },
    flight: {
        label: "Flugzeug",
        activityId: "passenger_flight-route_type_na-aircraft_type_na-distance_na-class_na-rf_na-distance_uplift_na",
        premium: true
    },
    bike: {
        label: "Fahrrad",
        activityId: "passenger_vehicle-vehicle_type_bicycle-fuel_source_electricity-engine_size_na-vehicle_age_na-vehicle_weight_na"
    },
    walk: {
        label: "Zu Fuss",
        activityId: null,
        fixedCarbon: 0
    }
};

function createJsonFetchUrl(data) {
    return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
}

function getSupporter() {
    const savedSupporter = localStorage.getItem(SUPPORTER_STORAGE_KEY);

    if (!savedSupporter) {
        return null;
    }

    try {
        return JSON.parse(savedSupporter);
    } catch (error) {
        localStorage.removeItem(SUPPORTER_STORAGE_KEY);
        return null;
    }
}

function hasPremiumAccess() {
    const supporter = getSupporter();
    return Boolean(supporter && supporter.premiumActive);
}

function saveSupporter(supporter) {
    localStorage.setItem(SUPPORTER_STORAGE_KEY, JSON.stringify(supporter));
}

function formatCarbon(value) {
    if (value === 0) {
        return "0 kg CO2";
    }

    if (value < 1) {
        return `${Math.round(value * 1000)} g CO2`;
    }

    return `${value.toFixed(2).replace(".", ",")} kg CO2`;
}

function showResult(resultElement, carbon, transport, distance) {
    resultElement.innerHTML = `
        ${formatCarbon(carbon)}
        <small>${transport.label} auf ${distance.toLocaleString("de-DE")} km</small>
    `;
}

async function fetchEmission(distance, transport) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            emission_factor: {
                activity_id: transport.activityId,
                data_version: "^1"
            },
            parameters: {
                distance,
                distance_unit: "km"
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "API Anfrage fehlgeschlagen.");
    }

    return data.co2e;
}

async function fetchSupportLevels() {
    const response = await fetch(createJsonFetchUrl(supportLevelsData));
    return response.json();
}

async function fetchPremiumMessage(name) {
    const response = await fetch(createJsonFetchUrl({
        title: "Premium aktiviert",
        text: `Danke, ${name}! Zug und Flug sind jetzt freigeschaltet.`
    }));

    return response.json();
}

function setupCalculator() {
    const calculatorForm = document.getElementById("calculatorForm");

    if (!calculatorForm) {
        return;
    }

    const typeInput = document.getElementById("type");
    const distanceInput = document.getElementById("distance");
    const result = document.getElementById("result");
    const resultMeta = document.getElementById("resultMeta");
    const premiumLink = document.getElementById("premiumLink");

    if (hasPremiumAccess()) {
        premiumLink.textContent = "Premium ist aktiv: Zug und Flug sind freigeschaltet.";
        premiumLink.href = "support.html";
    }

    calculatorForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const distance = Number(distanceInput.value);
        const transport = transportOptions[typeInput.value];

        if (!distance || distance <= 0) {
            result.textContent = "Bitte gueltige Kilometer eingeben.";
            resultMeta.textContent = "Die Strecke muss groesser als 0 km sein.";
            return;
        }

        if (!transport) {
            result.textContent = "Dieses Transportmittel wurde nicht gefunden.";
            resultMeta.textContent = "Bitte waehle eine andere Option aus.";
            return;
        }

        if (transport.premium && !hasPremiumAccess()) {
            result.textContent = "Premium erforderlich.";
            resultMeta.textContent = "Unterstuetze EcoTrack, um Zug und Flug berechnen zu koennen.";
            return;
        }

        if (transport.fixedCarbon === 0) {
            showResult(result, 0, transport, distance);
            resultMeta.textContent = "Zu Fuss entstehen direkt keine CO2-Emissionen.";
            return;
        }

        if (!transport.activityId) {
            result.textContent = "Fuer dieses Transportmittel gibt es aktuell keinen API-Wert.";
            resultMeta.textContent = "Bitte waehle ein anderes Transportmittel aus.";
            return;
        }

        if (!API_KEY) {
            result.textContent = "Bitte trage zuerst deinen API Key in js/app.js ein.";
            resultMeta.textContent = "Setze den Wert bei API_KEY, damit die API Anfrage ausgefuehrt werden kann.";
            return;
        }

        result.textContent = "Berechnung laeuft...";
        resultMeta.textContent = "Die Daten werden ueber die Climatiq API geladen.";

        try {
            const carbon = await fetchEmission(distance, transport);

            showResult(result, carbon, transport, distance);
            resultMeta.textContent = "Berechnet mit der Climatiq API.";
        } catch (error) {
            result.textContent = "Fehler bei der API Anfrage.";
            resultMeta.textContent = error.message;
        }
    });
}

function renderSupportStatus() {
    const supportStatus = document.getElementById("supportStatus");
    const supportMeta = document.getElementById("supportMeta");

    if (!supportStatus || !supportMeta) {
        return;
    }

    const supporter = getSupporter();

    if (!supporter) {
        supportStatus.textContent = "Noch nicht freigeschaltet.";
        supportMeta.textContent = "Fuelle das Formular aus, um Premium lokal zu speichern.";
        return;
    }

    supportStatus.textContent = "Premium aktiv";
    supportMeta.textContent = `${supporter.name} unterstuetzt EcoTrack mit ${supporter.amount} Euro fuer ${supporter.months} Monat(e).`;
}

function renderSupportLevels(levels, searchTerm = "") {
    const supportLevels = document.getElementById("supportLevels");

    if (!supportLevels) {
        return;
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredLevels = levels.filter((level) => {
        return level.name.toLowerCase().includes(normalizedSearch)
            || level.description.toLowerCase().includes(normalizedSearch)
            || String(level.minimum).includes(normalizedSearch);
    });

    supportLevels.innerHTML = "";

    filteredLevels.forEach((level, index) => {
        const card = document.createElement("article");
        card.className = "tip-card";
        card.innerHTML = `
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h2>${level.name}</h2>
            <p>Ab ${level.minimum} Euro pro Monat: ${level.description}</p>
        `;
        supportLevels.appendChild(card);
    });

    if (filteredLevels.length === 0) {
        supportLevels.innerHTML = `<p class="empty-state">Kein Supporter-Level passt zu diesem Filter.</p>`;
    }
}

async function setupSupportPage() {
    const supportForm = document.getElementById("supportForm");
    const levelSearch = document.getElementById("levelSearch");
    const resetSupport = document.getElementById("resetSupport");

    if (!supportForm) {
        return;
    }

    let levels = [];

    renderSupportStatus();

    try {
        levels = await fetchSupportLevels();
        renderSupportLevels(levels);
    } catch (error) {
        const supportLevels = document.getElementById("supportLevels");
        supportLevels.innerHTML = `<p class="empty-state">Supporter-Level konnten nicht geladen werden.</p>`;
    }

    levelSearch.addEventListener("input", () => {
        renderSupportLevels(levels, levelSearch.value);
    });

    supportForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(supportForm);
        const name = formData.get("supportName").trim();
        const email = formData.get("supportEmail").trim();
        const amount = Number(formData.get("donationAmount"));
        const months = Number(formData.get("donationMonths"));

        if (!name || !email || !amount || !months || months < 1) {
            document.getElementById("supportStatus").textContent = "Bitte alle Felder gueltig ausfuellen.";
            document.getElementById("supportMeta").textContent = "Name, E-Mail, Betrag und Monatsanzahl werden benoetigt.";
            return;
        }

        saveSupporter({
            name,
            email,
            amount,
            months,
            total: amount * months,
            premiumActive: true,
            savedAt: new Date().toISOString()
        });

        const premiumMessage = await fetchPremiumMessage(name);

        document.getElementById("supportStatus").textContent = premiumMessage.title;
        document.getElementById("supportMeta").textContent = `${premiumMessage.text} Gesamtspende: ${amount * months} Euro.`;
    });

    resetSupport.addEventListener("click", () => {
        localStorage.removeItem(SUPPORTER_STORAGE_KEY);
        supportForm.reset();
        renderSupportStatus();
    });
}

setupCalculator();
setupSupportPage();
