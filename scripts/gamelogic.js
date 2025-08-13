let player = {
    nation: "rome",
    ethnicity: "romans",
}

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
    if (clickedProvinceId) {
        if (display_map == 'owner') {
            if (isTileAdjacent(clickedProvinceId, player.nation)) {
                changeOwner(clickedProvinceId, player.nation);
            }
        } else if (display_map == 'ethnicity') {
            if (isTileAdjacent(clickedProvinceId, player.ethnicity)) {
                changeOwner(clickedProvinceId, player.ethnicity);
            }
        }
        
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
    let position = provinceData[id].pos;
    let nation_ctx, rgb;

    if (display_map == 'owner') {
        if (!nationInfo[nation]) return;
        provinceInfo[id].owner = nation;
        rgb = hexToRgb(nationInfo[nation].color);
        nation_ctx = cache_nation_map.getContext('2d');
    }
    else if (display_map == 'ethnicity') {
        if (!ethnicityInfo[nation]) return;
        provinceInfo[id].ethnicity = nation;
        rgb = hexToRgb(ethnicityInfo[nation].color);
        nation_ctx = cache_ethnic_map.getContext('2d');
    }

    floodFill(nation_ctx, position[0], position[1], [rgb.r, rgb.g, rgb.b]);
    redraw();
}


function hexToRgb(hex) {
    if (!hex) return null;
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6) return null;
    const intVal = parseInt(hex, 16);
    return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255
    };
}