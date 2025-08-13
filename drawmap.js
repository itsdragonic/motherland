let cachedProvinceOverlay = null; // cache
let zoomedIn = 3.5;
let displayProperty = 'owner';

function generateProvinceOverlay() {
    // return cached result if available
    if (cachedProvinceOverlay) return cachedProvinceOverlay;

    // check if provinceData, provinceInfo, and nationInfo exist and have content
    if (!provinceData || !provinceInfo || !nationInfo || Object.keys(provinceData).length === 0) {
        return null;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = map_provinces.width;
    tempCanvas.height = map_provinces.height;
    const tempCtx = tempCanvas.getContext('2d');

    // base provinces image
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(map_provinces, 0, 0);

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

    // fill each province according to its assigned value

    for (const id in provinceData) {
        if (!Object.prototype.hasOwnProperty.call(provinceData, id)) continue;
        const pd = provinceData[id];
        if (!pd || !pd.pos) continue;

        const [startX, startY] = pd.pos.map(Math.floor);
        const pInfo = provinceInfo[id];
        if (!pInfo || !pInfo[displayProperty]) continue;

        let colorSource = null;

        if (displayProperty === 'owner') {
            const nation = nationInfo[pInfo.owner];
            if (!nation || !nation.color) continue;
            colorSource = nation.color;
        } 
        else if (displayProperty === 'ethnicity') {
            const ethnicity = ethnicityInfo[pInfo.ethnicity];
            if (!ethnicity || !ethnicity.color) continue;
            colorSource = ethnicity.color;
        }

        const rgb = hexToRgb(colorSource);
        if (!rgb) continue;

        if (startX < 0 || startX >= tempCanvas.width || startY < 0 || startY >= tempCanvas.height) continue;

        floodFill(tempCtx, startX, startY, [rgb.r, rgb.g, rgb.b, 255]);
    }


    // final touches
    //tempCtx.filter = 'blur(3px)';
    tempCtx.drawImage(tempCanvas, 0, 0);
    tempCtx.filter = 'none';

    cachedProvinceOverlay = tempCanvas; // store in cache
    return cachedProvinceOverlay;
}

function drawMap(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const overlayCanvas = generateProvinceOverlay();

    if (!overlayCanvas) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    ctx.drawImage(overlayCanvas, 0, 0);
}

// optional: call this when province ownership changes
function resetProvinceOverlayCache() {
    cachedProvinceOverlay = null;
}

function floodFill(ctx, startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const startPos = (startY * width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    const fillR = fillColor[0];
    const fillG = fillColor[1];
    const fillB = fillColor[2];
    const fillA = fillColor[3] || 255;

    if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) {
        return;
    }

    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const pos = (y * width + x) * 4;

        if (data[pos] === startR && data[pos + 1] === startG &&
            data[pos + 2] === startB && data[pos + 3] === startA) {

            data[pos] = fillR;
            data[pos + 1] = fillG;
            data[pos + 2] = fillB;
            data[pos + 3] = fillA;

            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function darkenColor(hex, factor = 0.8) {
    // Remove '#' if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b from hex
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Apply darkening factor
    r = Math.max(0, Math.min(255, Math.floor(r * factor)));
    g = Math.max(0, Math.min(255, Math.floor(g * factor)));
    b = Math.max(0, Math.min(255, Math.floor(b * factor)));

    // Convert back to hex string
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawTileInfo(ctx, currentScale) {
    if (currentScale >= zoomedIn) {
        const screenTopLeft = ctx.transformedPoint(0, 0);
        const screenBottomRight = ctx.transformedPoint(canvas.width, canvas.height);

        for (const id in provinceData) {
            if (!Object.prototype.hasOwnProperty.call(provinceData, id)) continue;
            const pos = provinceData[id].pos;
            if (!pos) continue;

            const [x, y] = pos;

            // Only draw if within visible bounds
            if (
                x >= screenTopLeft.x && x <= screenBottomRight.x &&
                y >= screenTopLeft.y && y <= screenBottomRight.y
            ) {
                // Determine owner color or default to light gray
                let color = '#efefefff'; // default light gray

                if (provinceData[id] && provinceData[id].type) {
                    if (provinceData[id].type == 'ocean') {
                        color = '#6dc6e3';
                    }
                }

                if (displayProperty == 'owner') {
                    if (provinceInfo[id] && provinceInfo[id].owner) {
                        const owner = provinceInfo[id].owner;
                        if (nationInfo[owner] && nationInfo[owner].color) {
                            color = darkenColor(nationInfo[owner].color, 0.9); // 15% darker
                        }
                    }
                } else if (displayProperty == 'ethnicity') {
                    if (provinceInfo[id] && provinceInfo[id].ethnicity) {
                        const eth = provinceInfo[id].ethnicity;
                        if (ethnicityInfo[eth] && ethnicityInfo[eth].color) {
                            color = darkenColor(ethnicityInfo[eth].color, 0.9);
                        }
                    }
                }
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function drawNationLabels(ctx, currentScale) {
    if (currentScale > zoomedIn) return;

    const nationCoords = {};
    const nationCounts = {};
    const nationBounds = {};

    // Collect nation data
    for (const id in provinceInfo) {
        if (!Object.prototype.hasOwnProperty.call(provinceInfo, id)) continue;
        const owner = provinceInfo[id].owner;
        if (!owner) continue;

        const province = provinceData[id];
        if (!province || !province.pos) continue;
        const [x, y] = province.pos;

        if (!nationCoords[owner]) {
            nationCoords[owner] = { xSum: 0, ySum: 0 };
            nationCounts[owner] = 0;
            nationBounds[owner] = { minX: x, maxX: x, minY: y, maxY: y };
        }

        nationCoords[owner].xSum += x;
        nationCoords[owner].ySum += y;
        nationCounts[owner]++;

        nationBounds[owner].minX = Math.min(nationBounds[owner].minX, x);
        nationBounds[owner].maxX = Math.max(nationBounds[owner].maxX, x);
        nationBounds[owner].minY = Math.min(nationBounds[owner].minY, y);
        nationBounds[owner].maxY = Math.max(nationBounds[owner].maxY, y);
    }

    // Prepare array for sorting (smallest first)
    const nations = Object.keys(nationCoords).map(owner => {
        return {
            owner,
            count: nationCounts[owner],
            avgX: nationCoords[owner].xSum / nationCounts[owner],
            avgY: nationCoords[owner].ySum / nationCounts[owner],
            width: nationBounds[owner].maxX - nationBounds[owner].minX,
            height: nationBounds[owner].maxY - nationBounds[owner].minY
        };
    }).sort((a, b) => a.count - b.count);

    const placedLabels = [];

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";

    // Place labels, smallest first
    for (const nation of nations) {
        let displayName = nation.owner;
        if (nationInfo[nation.owner]) {
            displayName = nation.count > 50 && nationInfo[nation.owner].empire_name
                ? nationInfo[nation.owner].empire_name
                : nationInfo[nation.owner].name || nation.owner;
        }

        let fontSize = 16;
        ctx.font = `bold ${fontSize}px Lato, Arial`;

        // Fit text to territory width
        while (ctx.measureText(displayName).width < nation.width * 0.9 && fontSize < 200) {
            fontSize++;
            ctx.font = `bold ${fontSize}px Lato, Arial`;
        }
        while (ctx.measureText(displayName).width > nation.width * 0.9 && fontSize > 1) {
            fontSize--;
            ctx.font = `bold ${fontSize}px Lato, Arial`;
        }

        // Now check for overlaps with placed smaller labels
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
                    // Overlaps: shrink
                    fontSize--;
                    ctx.font = `bold ${fontSize}px Lato, Arial`;
                    textWidth = ctx.measureText(displayName).width;
                    textHeight = fontSize;
                    collision = true;
                    break;
                }
            }
        }

        // If font size is too small after shrinking, skip drawing
        if (fontSize >= 6) {
            ctx.fillText(displayName, nation.avgX, nation.avgY);
            placedLabels.push({ x: nation.avgX, y: nation.avgY, w: textWidth, h: textHeight });
        }
    }

    ctx.restore();
}