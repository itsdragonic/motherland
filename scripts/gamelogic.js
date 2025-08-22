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
    /*if (clickedProvinceId && player.gold > 0) {
        if (display_map == 'owner') {
            if (isTileAdjacent(clickedProvinceId, player.nation)) {
                changeOwner(clickedProvinceId, player.nation);
            }
        } else if (display_map == 'ethnicity') {
            if (isTileAdjacent(clickedProvinceId, player.ethnicity)) {
                changeOwner(clickedProvinceId, player.ethnicity);
            }
        }
        
        player.gold -= 100;
        updateInfo();
        //console.log(clickedProvinceId);
    } else {
        //console.log("No province clicked at", clickX, clickY);
    }*/
   if (clickedProvinceId) provinceInfoScreen(clickedProvinceId);
}

function provinceInfoScreen(id) {
    let tile_name = document.getElementById('tile_name');
    if (cityInfo[id]) {
        tile_name.textContent = cityInfo[id].name;
    } else {
        tile_name.textContent = `Province #${id}`;
    }

    const found_city = document.getElementById('found_city');

    found_city.onclick = function () {
        if (!cityInfo[id]) {
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

            player.gold -= 500;
            updateInfo();
            redraw();
            tile_name.textContent = `${cityInfo[id].name}`;

            console.log(`New city founded:`, cityInfo[id]);
        } else {
            console.log(`Province ${id} already has a city:`, cityInfo[id]);
        }
    };
}

function isTileAdjacent(id, nation) {
    let neighbors = provinceNodes[id].neighbors;

    for (let i = 0; i < neighbors.length; i ++) {
        if (display_map == 'owner' && provinceInfo[neighbors[i]].owner == nation) return true;
        else if (display_map == 'ethnicity' && provinceInfo[neighbors[i]].ethnicity == nation) return true;
    }
    return false;
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