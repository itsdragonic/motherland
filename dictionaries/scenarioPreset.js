var scenario = {
    "nations": {
        "rome": {
            provinces: []
        }
    },
    "ethnicities": {
        "romans": {
            provinces: []
        }
    }
};

function loadScenario() {
    scenario.nations = {};
    scenario.ethnicities = {};

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
}