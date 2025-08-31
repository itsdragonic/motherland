var scenario = {
    "nations": {
        "rome": {
            provinces: [],
            ruler: "romans"
        },
        "thrace": {
            provinces: [],
            ruler: "thracians"
        }
    },
    "ethnicities": {
        "romans": {
            provinces: []
        }
    }
};

function loadScenario() {
    for (const id in provinceInfo) {
        const tile = provinceInfo[id];
        if (!tile) continue;

        // --- Nation/Owner ---
        if (tile.owner) {
            if (!scenario.nations[tile.owner]) {
                scenario.nations[tile.owner] = { provinces: [] };
            }
            scenario.nations[tile.owner].provinces.push(id);
        }

        // --- Ethnicity ---
        if (tile.ethnicity) {
            if (!scenario.ethnicities[tile.ethnicity]) {
                scenario.ethnicities[tile.ethnicity] = { provinces: [] };
            }
            scenario.ethnicities[tile.ethnicity].provinces.push(id);
        }
    }

    // Determine ruler
    for (const nationName in scenario.nations) {
        const nation = scenario.nations[nationName];
        if (nation.ruler) continue;

        // Count ethnicities inside this nation's provinces
        const ethnicityCount = {};
        for (const provId of nation.provinces) {
            const prov = provinceInfo[provId];
            if (prov && prov.ethnicity) {
                ethnicityCount[prov.ethnicity] = (ethnicityCount[prov.ethnicity] || 0) + 1;
            }
        }

        // Find ethnicity with the most provinces
        let maxEthnicity = null;
        let maxCount = -1;
        for (const eth in ethnicityCount) {
            if (ethnicityCount[eth] > maxCount) {
                maxCount = ethnicityCount[eth];
                maxEthnicity = eth;
            }
        }

        // Assign as ruler if found
        if (maxEthnicity) {
            nation.ruler = maxEthnicity;
        }
    }
}