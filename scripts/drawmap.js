let cache_nation_map = null;
let cache_ethnic_map = null;
let zoomedIn = 3.5;
let display_map = 'owner';

function drawProvinces(cache = null) {
    // return cached result if available
    if (cache) return cache;

    // check if provinceNodes, provinceInfo, and nationInfo exist and have content
    if (!provinceNodes || !provinceInfo || !nationInfo || Object.keys(provinceNodes).length === 0) {
        return null;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = map_provinces.width;
    tempCanvas.height = map_provinces.height;
    const tempCtx = tempCanvas.getContext('2d');

    // base provinces image
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(map_provinces, 0, 0);

    // fill each province according to its assigned value

    for (const id in provinceNodes) {
        if (!Object.prototype.hasOwnProperty.call(provinceNodes, id)) continue;
        const pd = provinceNodes[id];
        if (!pd || !pd.pos) continue;

        const [startX, startY] = pd.pos.map(Math.floor);
        const pInfo = provinceInfo[id];
        if (!pInfo || !pInfo[display_map]) continue;

        let colorSource = null;

        if (display_map === 'owner') {
            const nation = nationInfo[pInfo.owner];
            if (!nation || !nation.color) continue;
            colorSource = nation.color;
        } 
        else if (display_map === 'ethnicity') {
            const ethnicity = ethnicityInfo[pInfo.ethnicity];
            if (!ethnicity || !ethnicity.color) continue;
            colorSource = ethnicity.color;
        }

        const rgb = hexToRgb(colorSource);
        if (!rgb) continue;

        if (startX < 0 || startX >= tempCanvas.width || startY < 0 || startY >= tempCanvas.height) continue;

        floodFill(tempCtx, startX, startY, [rgb.r, rgb.g, rgb.b, 255]);
    }

    return tempCanvas;
}

function drawMap(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    let cache_map;
    if (display_map == 'owner') {
        cache_nation_map = drawProvinces(cache_nation_map);
        cache_map = cache_nation_map;
    } else {
        cache_ethnic_map = drawProvinces(cache_ethnic_map);
        cache_map = cache_ethnic_map;
    }

    if (!cache_map) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    ctx.drawImage(cache_map, 0, 0);
}

// adjustable scale factor for city/army display
const tileInfoScale = 0.35;

function drawTileInfo(ctx, currentScale) {
    if (currentScale >= zoomedIn) {
        const screenTopLeft = ctx.transformedPoint(0, 0);
        const screenBottomRight = ctx.transformedPoint(canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const id in provinceNodes) {
            if (!Object.prototype.hasOwnProperty.call(provinceNodes, id)) continue;
            const pos = provinceNodes[id].pos;
            if (!pos) continue;

            const [x, y] = pos;

            // Only draw if within visible bounds
            if (
                x >= screenTopLeft.x && x <= screenBottomRight.x &&
                y >= screenTopLeft.y && y <= screenBottomRight.y
            ) {
                let yOffset = 0;

                // ===== Draw City if exists =====
                if (cityInfo[id]) {
                    const owner = provinceInfo[id]?.owner;
                    let bgColor = "#ccc";
                    if (owner && nationInfo[owner]?.color) {
                        bgColor = darkenColor(nationInfo[owner].color, 0.9);
                    }

                    const text = `🏙️${cityInfo[id].name}`;
                    ctx.font = `${8 * tileInfoScale}px Lato, sans-serif`;
                    const textWidth = ctx.measureText(text).width;
                    const padding = 2 * tileInfoScale;

                    // background box
                    ctx.fillStyle = bgColor;
                    roundRect(ctx, x - textWidth / 2 - padding, y + yOffset - 6 * tileInfoScale, textWidth + padding * 2, 10 * tileInfoScale, 2 * tileInfoScale, true, false);

                    // outline
                    ctx.lineWidth = 0.5 * tileInfoScale;
                    ctx.strokeStyle = "white";
                    roundRect(ctx, x - textWidth / 2 - padding, y + yOffset - 6 * tileInfoScale, textWidth + padding * 2, 10 * tileInfoScale, 2 * tileInfoScale, false, true);

                    // text
                    ctx.fillStyle = "black";
                    ctx.fillText(text, x, y + yOffset);

                    yOffset += 12 * tileInfoScale;
                }

                // ===== Draw Armies if exists =====
                if (provinceInfo[id]?.armies) {
                    for (const nation in provinceInfo[id].armies) {
                        const units = provinceInfo[id].armies[nation]; // object like { soldier: 5, archer: 2 }

                        let bgColor = "#ccc";
                        if (nationInfo[nation]?.color) {
                            bgColor = darkenColor(nationInfo[nation].color, 0.9);
                        }

                        // loop through each unit type (soldier, archer, plane...)
                        for (const unitType in units) {
                            const count = units[unitType];
                            if (!count) continue; // skip if 0 or undefined

                            // pick emoji based on unit type
                            let emoji = "";
                            if (unitType === "soldiers") emoji = "🪖";
                            else if (unitType === "archers") emoji = "🏹";
                            else if (unitType === "planes") emoji = "✈️";
                            else continue; // skip unknown types

                            const text = `${emoji}${count}`;
                            ctx.font = `${8 * tileInfoScale}px Lato, sans-serif`;
                            const textWidth = ctx.measureText(text).width;
                            const padding = 2 * tileInfoScale;

                            // background box
                            ctx.fillStyle = bgColor;
                            roundRect(
                                ctx,
                                x - textWidth / 2 - padding,
                                y + yOffset - 6 * tileInfoScale,
                                textWidth + padding * 2,
                                10 * tileInfoScale,
                                2 * tileInfoScale,
                                true,
                                false
                            );

                            // outline
                            ctx.lineWidth = 0.5 * tileInfoScale;
                            ctx.strokeStyle = "white";
                            roundRect(
                                ctx,
                                x - textWidth / 2 - padding,
                                y + yOffset - 6 * tileInfoScale,
                                textWidth + padding * 2,
                                10 * tileInfoScale,
                                2 * tileInfoScale,
                                false,
                                true
                            );

                            // text
                            ctx.fillStyle = "black";
                            ctx.fillText(text, x, y + yOffset);

                            yOffset += 12 * tileInfoScale;
                        }
                    }
                }

            }
        }
    }
}

function drawNationLabels(ctx, currentScale) {
    if (currentScale >= zoomedIn) return;

    const nationCoords = {};
    const nationCounts = {};
    const nationBounds = {};

    const isOwnerMode = display_map === 'owner';
    const infoSource = isOwnerMode ? nationInfo : ethnicityInfo;
    const sourceGroup = isOwnerMode ? scenario.nations : scenario.ethnicities;

    // Use prebuilt scenario data for both owner and ethnicity
    for (const key in sourceGroup) {
        const provinceIds = sourceGroup[key].provinces;
        if (!provinceIds.length) continue;

        for (const id of provinceIds) {
            const province = provinceNodes[id];
            if (!province || !province.pos) continue;
            const [x, y] = province.pos;

            if (!nationCoords[key]) {
                nationCoords[key] = { xSum: 0, ySum: 0 };
                nationCounts[key] = 0;
                nationBounds[key] = { minX: x, maxX: x, minY: y, maxY: y };
            }

            nationCoords[key].xSum += x;
            nationCoords[key].ySum += y;
            nationCounts[key]++;

            nationBounds[key].minX = Math.min(nationBounds[key].minX, x);
            nationBounds[key].maxX = Math.max(nationBounds[key].maxX, x);
            nationBounds[key].minY = Math.min(nationBounds[key].minY, y);
            nationBounds[key].maxY = Math.max(nationBounds[key].maxY, y);
        }
    }

    // Build nations array, sort smallest first
    const nations = Object.keys(nationCoords).map(key => ({
        key,
        count: nationCounts[key],
        avgX: nationCoords[key].xSum / nationCounts[key],
        avgY: nationCoords[key].ySum / nationCounts[key],
        width: nationBounds[key].maxX - nationBounds[key].minX,
        height: nationBounds[key].maxY - nationBounds[key].minY
    })).sort((a, b) => a.count - b.count);

    const placedLabels = [];

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";

    for (const nation of nations) {
        let displayName = nation.key;
        const data = infoSource[nation.key];

        if (data) {
            if (isOwnerMode) {
                displayName = nation.count > 50 && data.empire_name
                    ? data.empire_name
                    : data.name || nation.key;
            } else {
                displayName = data.name || nation.key;
            }
        }

        let fontSize = 16;
        ctx.font = `bold ${fontSize}px Lato, Arial`;

        while (ctx.measureText(displayName).width < nation.width * 0.9 && fontSize < 200) {
            fontSize++;
            ctx.font = `bold ${fontSize}px Lato, Arial`;
        }
        while (ctx.measureText(displayName).width > nation.width * 0.9 && fontSize > 1) {
            fontSize--;
            ctx.font = `bold ${fontSize}px Lato, Arial`;
        }

        let textWidth = ctx.measureText(displayName).width;
        let textHeight = fontSize;
        let collision = true;

        while (collision && fontSize > 5) {
            collision = false;
            for (const placed of placedLabels) {
                const noOverlap =
                    nation.avgX + textWidth / 2 < placed.x - placed.w / 2 ||
                    nation.avgX - textWidth / 2 > placed.x + placed.w / 2 ||
                    nation.avgY + textHeight / 2 < placed.y - placed.h / 2 ||
                    nation.avgY - textHeight / 2 > placed.y + placed.h / 2;

                if (!noOverlap) {
                    fontSize--;
                    ctx.font = `bold ${fontSize}px Lato, Arial`;
                    textWidth = ctx.measureText(displayName).width;
                    textHeight = fontSize;
                    collision = true;
                    break;
                }
            }
        }

        if (fontSize >= 6) {
            ctx.fillText(displayName, nation.avgX, nation.avgY);
            placedLabels.push({ x: nation.avgX, y: nation.avgY, w: textWidth, h: textHeight });
        }
    }

    ctx.restore();
}