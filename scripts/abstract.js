// Functions where knowing what goes on inside isn't necessary


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

function hexToRgb(hex) {
    if (!hex) return null;
    hex = hex.replace(/^#/, '');
    
    // Expand shorthand (#abc → #aabbcc)
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    
    // Ignore alpha if present (#rrggbbaa → #rrggbb)
    if (hex.length === 8) {
        hex = hex.slice(0, 6);
    }
    
    if (hex.length !== 6) return null;
    
    const intVal = parseInt(hex, 16);
    return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255
    };
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// Convert number to Roman numeral
function toRoman(num) {
    const lookup = {
        M: 1000,
        CM: 900,
        D: 500,
        CD: 400,
        C: 100,
        XC: 90,
        L: 50,
        XL: 40,
        X: 10,
        IX: 9,
        V: 5,
        IV: 4,
        I: 1
    };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}

function getUniqueCityName(baseName) {
    let name = baseName;

    // If name already exists, try "New {baseName}"
    if (Object.values(cityInfo).some(c => c.name === name)) {
        name = `New ${baseName}`;

        let counter = 2; // Start with II
        while (Object.values(cityInfo).some(c => c.name === name)) {
            name = `New ${baseName} ${toRoman(counter)}`;
            counter++;
        }
    }

    return name;
}

function findShortestPath(startId, endId) {
    // If start and end are the same
    if (startId === endId) {
        return [startId];
    }

    // BFS initialization
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentId = currentPath[currentPath.length - 1];
        const currentNode = provinceNodes[currentId];

        // If current node doesn't exist, skip
        if (!currentNode) continue;

        // Check all neighbors
        for (const neighborId of currentNode.neighbors) {
            // Skip if already visited
            if (visited.has(neighborId)) continue;

            // Create new path with this neighbor
            const newPath = [...currentPath, neighborId];

            // Found the destination
            if (neighborId === endId) {
                return newPath;
            }

            // Add to queue and mark visited
            queue.push(newPath);
            visited.add(neighborId);
        }
    }

    // No path found
    return null;
}