// js/app.js

const calculateBtn = document.getElementById("calculateBtn");

calculateBtn.addEventListener("click", async () => {

    // Eingaben holen
    const distance =
        document.getElementById("distance").value;

    const vehicle =
        document.getElementById("vehicle").value;

    const result =
        document.getElementById("result");

    // Prüfen ob etwas eingegeben wurde
    if(distance === "" || distance <= 0){
        result.innerText =
            "Bitte gib gültige Kilometer ein.";
        return;
    }

    // Ladeanzeige
    result.innerText = "Berechnung läuft...";

    // Fahrzeug-ID
    // Diese IDs kommen von Carbon Interface
    let vehicleModelId = "";

    if(vehicle === "car"){
        vehicleModelId =
            "7268a9b7-17e8-4c8d-acca-57059252afe9";
    }

    if(vehicle === "motorcycle"){
        vehicleModelId =
            "a9382c56-7a7b-4d2f-b6db-f328f2f0f6f4";
    }

    try{

        // API Anfrage
        const response = await fetch(
            "https://www.carboninterface.com/api/v1/estimates",
            {

                method: "POST",

                headers: {

                    "Authorization":
                        "Bearer a2M2CeN0a5ALjfscZgXwZA",

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    type: "vehicle",

                    distance_unit: "km",

                    distance_value:
                        Number(distance),

                    vehicle_model_id:
                        vehicleModelId
                })
            }
        );

        // Antwort umwandeln
        const data = await response.json();

        console.log(data);

        // CO2 Wert holen
        const carbon =
            data.data.attributes.carbon_kg;

        // Ausgabe
        result.innerHTML =
            `
            🌍 Dein Ausstoß beträgt:
            <br><br>
            <strong>${carbon} kg CO₂</strong>
            `;

        // localStorage speichern
        localStorage.setItem(
            "lastResult",
            carbon
        );

    }catch(error){

        console.error(error);

        result.innerText =
            "Fehler bei der API Anfrage.";

    }

});

// Letztes Ergebnis laden
window.addEventListener("load", () => {

    const lastResult =
        localStorage.getItem("lastResult");

    if(lastResult){

        document.getElementById("result")
            .innerHTML =
            `
            Letzte Berechnung:
            <br><br>
            <strong>${lastResult} kg CO₂</strong>
            `;
    }

});