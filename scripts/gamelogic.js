function clickProvince(ctx, evt) {
    // 1. Get clicked position in canvas coordinates
    const pt = ctx.transformedPoint(evt.offsetX, evt.offsetY);
    const clickX = Math.floor(pt.x);
    const clickY = Math.floor(pt.y);

    // 2. Create a temporary canvas for flood-fill detection
    const detectionCanvas = document.createElement('canvas');
    detectionCanvas.width = map_provinces.width;
    detectionCanvas.height = map_provinces.height;
    const detectionCtx = detectionCanvas.getContext('2d');

    // 3. Draw the base map (map_empty) onto the temp canvas
    detectionCtx.drawImage(map_provinces, 0, 0);

    // 4. Flood-fill from the clicked position with red
    floodFill(detectionCtx, clickX, clickY, [255, 0, 0, 255]); // RGBA red

    //cache_nation_map = detectionCanvas;

    // 5. Check each province's position to see if it's red
    let clickedProvinceId = null;
    for (const id in provinceNodes) {
        if (!provinceNodes[id].pos || provinceNodes[id].type == 'ocean') continue;

        const [x, y] = provinceNodes[id].pos;
        const pixel = detectionCtx.getImageData(x, y, 1, 1).data;

        // If this pixel is red (from flood-fill), it's the clicked province
        if (pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 0) {
            clickedProvinceId = id;
            break;
        }
    }

    // 6. Handle the clicked province
    if (clickedProvinceId) provinceInfoScreen(clickedProvinceId);
}

function provinceInfoScreen(id) {
    let tile_name = document.getElementById('tile_name');
    let tile_population = document.getElementById('tile_population');

    if (zoomed_out) {
        if (display_map == 'owner') {
            let owner = provinceInfo[id].owner;
            let ownerName = nationInfo[owner].name;

            // Sum population of all cities in this owner's provinces
            let totalPop = 0;
            for (let provId of scenario.nations[owner].provinces) {
                totalPop += provinceInfo[provId].population;
                if (cityInfo[provId]) {
                    totalPop += cityInfo[provId].population;
                }
            }

            tile_name.textContent = ownerName;
            tile_population.textContent = `Population: ${(totalPop).toFixed(1)}K`;

        } else {
            let eth = provinceInfo[id].ethnicity;
            let ethName = ethnicityInfo[eth].name;

            // Sum population of all cities in this ethnicity's provinces
            let totalPop = 0;
            for (let provId of scenario.ethnicities[eth].provinces) {
                totalPop += provinceInfo[provId].population;
                if (cityInfo[provId]) {
                    totalPop += cityInfo[provId].population;
                }
            }

            tile_name.textContent = ethName;
            tile_population.textContent = `Population: ${(totalPop).toFixed(1)}K`;
        }
    } else {
        if (display_map == 'owner') {
            foundCity(id);
            armyMovement(id);
            garrisonProvince(id);
        } else {
            if (isTileAdjacent(id, player.ethnicity) && scenario.ethnicities[player.ethnicity].culture > 0) {
                changeOwner(id, player.ethnicity);
                changeValue("ethnicities",player.ethnicity,"culture",-2);
            }
        }
    }
}

function foundCity(id) {
    if (cityInfo[id]) {
        tile_name.textContent = cityInfo[id].name;
        tile_population.textContent = `Population: ${(cityInfo[id].population + provinceInfo[id].population).toFixed(1)}K`;
    } else {
        tile_name.textContent = `Province #${id}`;
        tile_population.textContent = `Population: ${(provinceInfo[id].population).toFixed(1)}K`;
    }

    const found_city = document.getElementById('found_city');

    found_city.onclick = function () {
        if (!cityInfo[id] && provinceInfo[id].owner == player.nation) {
            // Get owner of this province
            let owner = provinceInfo[id]?.owner;

            // Fallback
            let name = `City ${id}`;

            if (owner && nationInfo[owner] && nationInfo[owner].city_names?.length > 0) {
                let names = nationInfo[owner].city_names;

                // Pick a random unused name (if possible)
                let available = names.filter(n =>
                    !Object.values(cityInfo).some(c => c.name === n)
                );

                if (available.length > 0) {
                    name = available[Math.floor(Math.random() * available.length)];
                } else {
                    // If all used up
                    let baseName = names[Math.floor(Math.random() * names.length)];
                    name = getUniqueCityName(baseName);
                }
            }

            // Create new city
            cityInfo[id] = {
                name: name,
                population: 1
            };

            changeValue("nations",player.nation,"gold",-500);
            redraw();
            tile_name.textContent = `${cityInfo[id].name}`;
            tile_population.textContent = `Population: ${(cityInfo[id].population + provinceInfo[id].population).toFixed(1)}K`;

            console.log(`New city founded:`, cityInfo[id]);
        } else {
            console.log('Cannot found city here.');
        }
    };
}

function garrisonProvince(id) {
    if (provinceInfo[id]?.armies && !provinceInfo[id].owner) {
        let garrisonDiv = document.createElement('div');
        garrisonDiv.id = 'garrison_buttons';
        garrisonDiv.style.marginTop = '12px';
        let btn = document.createElement('button');
        btn.textContent = `Garrison Province: 50 Gold`;
        btn.style.margin = '2px';
        btn.onclick = function () {
            changeOwner(id, player.nation);
            changeValue("nations",player.nation,"gold",-50);
            btn.remove();
        }
        garrisonDiv.appendChild(btn);
        document.getElementById('left_info').appendChild(garrisonDiv);
    }
}

function armyMovement(id) {
    // Army already clicked
    if (player.army_info.province) {
        let path = findShortestPath(Number(player.army_info.province), Number(id));

        units_moving.push({
            path: path,
            nation: player.nation,
            unit: player.army_info.unit,
            count: player.army_info.count,
            time_per_tile: 2
        });

        player.army_info.province = null;
    }

    // Remove previous army buttons if any
    let oldArmyDiv = document.getElementById('army_buttons');
    if (oldArmyDiv) oldArmyDiv.remove();


    // Only show when zoomed in and there are armies
    if (provinceInfo[id]?.armies) {
        let armies = provinceInfo[id].armies;
        let armyDiv = document.createElement('div');
        armyDiv.id = 'army_buttons';
        armyDiv.style.marginTop = '12px';

        // For each nation in armies
        Object.keys(armies).forEach(nation => {
            Object.keys(armies[nation]).forEach(unitType => {
                let count = armies[nation][unitType];
                if (count > 0) {
                    let btn = document.createElement('button');
                    btn.textContent = `${nationInfo[nation]?.name || nation} ${unitType} (${count})`;
                    btn.style.margin = '2px';
                    btn.onclick = function () {
                        if (player.nation == nation) {
                            // Set up for movement: store selected army info
                            player.army_info = {
                                province: id,
                                unit: unitType,
                                count
                            };
                            // Indicate selection visually
                            Array.from(armyDiv.children).forEach(b => b.disabled = false);
                            btn.disabled = true;
                        }
                    };
                    armyDiv.appendChild(btn);
                }
            });
        });


        // Only add if there are any armies
        if (armyDiv.children.length > 0) {
            document.getElementById('left_info').appendChild(armyDiv);
        }
    }
}

function isTileAdjacent(id, nation) {
    let neighbors = provinceNodes[id].neighbors;

    for (let i = 0; i < neighbors.length; i++) {
        if (display_map == 'owner' && provinceInfo[neighbors[i]].owner == nation) return true;
        else if (display_map == 'ethnicity' && provinceInfo[neighbors[i]].ethnicity == nation) return true;
    }
    return false;
}

function changeValue(type, nation, name, amount) {
    let target = scenario[type][nation];

    if (!target) {
        console.warn(`Nation/ethnicity "${nation}" not found in type "${type}"`);
        return;
    }

    if (Array.isArray(target[name])) {
        // If it's an array, treat "amount" as a province id to push
        if (!target[name].includes(amount)) {
            target[name].push(amount);
        }
    } else if (typeof target[name] === "number") {
        // If it's a number, increment
        target[name] += amount;
    } else {
        console.warn(`Property "${name}" is not numeric or array in ${nation}`);
        return;
    }

    updateInfo();
}

function changeOwner(id, nation) {
    const position = provinceNodes[id].pos;
    let nation_ctx, rgb;

    if (display_map === 'owner') {
        if (!nationInfo[nation]) return;

        // --- remove from old owner in scenario ---
        const oldOwner = provinceInfo[id].owner;
        if (oldOwner && scenario.nations[oldOwner]) {
            scenario.nations[oldOwner].provinces =
                scenario.nations[oldOwner].provinces.filter(pid => pid !== id);
        }

        // --- assign new owner ---
        provinceInfo[id].owner = nation;
        if (!scenario.nations[nation]) {
            scenario.nations[nation] = { provinces: [] };
        }
        scenario.nations[nation].provinces.push(id);

        rgb = hexToRgb(nationInfo[nation].color);
        nation_ctx = cache_nation_map.getContext('2d');
    }
    else if (display_map === 'ethnicity') {
        if (!ethnicityInfo[nation]) return;

        // --- remove from old ethnicity in scenario ---
        const oldEthnicity = provinceInfo[id].ethnicity;
        if (oldEthnicity && scenario.ethnicities[oldEthnicity]) {
            scenario.ethnicities[oldEthnicity].provinces =
                scenario.ethnicities[oldEthnicity].provinces.filter(pid => pid !== id);
        }

        // --- assign new ethnicity ---
        provinceInfo[id].ethnicity = nation;
        if (!scenario.ethnicities[nation]) {
            scenario.ethnicities[nation] = { provinces: [] };
        }
        scenario.ethnicities[nation].provinces.push(id);

        rgb = hexToRgb(ethnicityInfo[nation].color);
        nation_ctx = cache_ethnic_map.getContext('2d');
    }

    floodFill(nation_ctx, position[0], position[1], [rgb.r, rgb.g, rgb.b]);
    redraw();
}

let units_moving = [
    { path: [1, 3, 4, 2], nation: "rome", unit: "soldiers", count: 3, time_per_tile: 2 }
];

function updateArmies() {
    for (let i = units_moving.length - 1; i >= 0; i--) {
        let move = units_moving[i];

        // decrement timer
        move.time_per_tile--;

        if (move.time_per_tile <= 0) {
            // current tile = path[0], next tile = path[1]
            const currentTile = move.path[0];
            const nextTile = move.path[1];
            const { nation, unit, count } = move;

            // remove from current tile
            if (provinceInfo[currentTile]?.armies?.[nation]?.[unit] !== undefined) {
                provinceInfo[currentTile].armies[nation][unit] -= count;
                if (provinceInfo[currentTile].armies[nation][unit] <= 0) {
                    delete provinceInfo[currentTile].armies[nation][unit];
                }
            }

            // advance along path
            move.path.shift(); // remove the current tile

            if (move.path.length === 1) {
                // arrived at final destination
                const destination = move.path[0];

                if (!provinceInfo[destination].armies) provinceInfo[destination].armies = {};
                if (!provinceInfo[destination].armies[nation]) provinceInfo[destination].armies[nation] = {};
                if (!provinceInfo[destination].armies[nation][unit]) provinceInfo[destination].armies[nation][unit] = 0;
                provinceInfo[destination].armies[nation][unit] += count;

                // remove this move from units_moving
                units_moving.splice(i, 1);
            } else {
                // not yet at destination → add units to nextTile
                if (!provinceInfo[nextTile].armies) provinceInfo[nextTile].armies = {};
                if (!provinceInfo[nextTile].armies[nation]) provinceInfo[nextTile].armies[nation] = {};
                if (!provinceInfo[nextTile].armies[nation][unit]) provinceInfo[nextTile].armies[nation][unit] = 0;
                provinceInfo[nextTile].armies[nation][unit] += count;

                // reset movement timer based on terrain
                let baseTime = 2; // default per step
                let modifier = 0;
                switch (provinceInfo[nextTile]?.terrain) {
                    case "plains":
                        modifier = -1;
                        break;
                    case "hills":
                        modifier = 2;
                        break;
                    case "mountains":
                        modifier = 3;
                        break;
                    default:
                        modifier = 0;
                }

                move.time_per_tile = Math.max(1, baseTime + modifier);
            }
        }
    }

    redraw();
}