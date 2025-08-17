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
    for (const id in provinceData) {
        if (!provinceData[id].pos || provinceData[id].type == 'ocean') continue;
        
        const [x, y] = provinceData[id].pos;
        const pixel = detectionCtx.getImageData(x, y, 1, 1).data;
        
        // If this pixel is red (from flood-fill), it's the clicked province
        if (pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 0) {
            clickedProvinceId = id;
            break;
        }
    }
    
    // 6. Handle the clicked province
    if (clickedProvinceId && player.gold > 0) {
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
    }
}

function isTileAdjacent(id, nation) {
    let neighbors = provinceData[id].neighbors;

    for (let i = 0; i < neighbors.length; i ++) {
        if (display_map == 'owner' && provinceInfo[neighbors[i]].owner == nation) return true;
        else if (display_map == 'ethnicity' && provinceInfo[neighbors[i]].ethnicity == nation) return true;
    }
    return false;
}

function changeOwner(id, nation) {
    const position = provinceData[id].pos;
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