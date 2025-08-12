let cachedProvinceOverlay = null; // cache

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

    // fill each province according to its owner color
    for (const id in provinceData) {
        if (!Object.prototype.hasOwnProperty.call(provinceData, id)) continue;
        const pd = provinceData[id];
        if (!pd || !pd.pos) continue;

        const [startX, startY] = pd.pos.map(Math.floor);
        const pInfo = provinceInfo[id];
        if (!pInfo || !pInfo.owner) continue;

        const nation = nationInfo[pInfo.owner];
        if (!nation || !nation.color) continue;

        const rgb = hexToRgb(nation.color);
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