const btn = document.getElementById("calculateBtn");

btn.addEventListener("click", async () => {

    const type = document.getElementById("type").value;
    const distance = document.getElementById("distance").value;
    const result = document.getElementById("result");

    if (!distance || distance <= 0) {
        result.innerText = "Bitte gültige Kilometer eingeben.";
        return;
    }

    result.innerText = "Berechnung läuft...";

    // Emission Factors (Climatiq Standard IDs)
    let activityId = "";

    switch(type){
        case "car":
            activityId = "passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na";
            break;

        case "train":
            activityId = "passenger_train-route_type_long_haul";
            break;

        case "bus":
            activityId = "passenger_vehicle-vehicle_type_bus-fuel_source_diesel";
            break;

        case "flight":
            activityId = "air_travel-route_type_domestic";
            break;
    }

    try {

        const response = await fetch(
            "https://api.climatiq.io/data/v1/estimate",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer DEIN_CLIMATIQ_KEY",
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    emission_factor: {
                        activity_id: activityId,
                        data_version: "^1"
                    },
                    parameters: {
                        distance: Number(distance),
                        distance_unit: "km"
                    }
                })
            }
        );

        const data = await response.json();

        console.log(data);

        const co2 = data.co2e;

        result.innerHTML = `
            🌍 CO₂ Ausstoß:<br><br>
            <strong>${co2.toFixed(2)} kg CO₂</strong>
        `;

        localStorage.setItem("lastCO2", co2);

    } catch (err) {
        console.error(err);
        result.innerText = "Fehler bei der API Anfrage.";
    }
});

// Letzter Wert
window.addEventListener("load", () => {

    const last = localStorage.getItem("lastCO2");

    if(last){
        document.getElementById("result").innerHTML =
        `Letztes Ergebnis:<br><strong>${last} kg CO₂</strong>`;
    }

});
