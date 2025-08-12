function drawMap(ctx) {
    ctx.drawImage(map_empty, 0, 0);
    floodFill(ctx,0, 0, [255, 0, 0])
    ctx.filter = 'blur(5px)';
    ctx.drawImage(map_provinces, 0, 0);
    ctx.filter = 'none';
    ctx.drawImage(map_provinces, 0, 0);
}

function floodFill(ctx, startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Get the color of the starting pixel
    const startPos = (startY * width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];
    
    // Convert fill color to RGBA
    const fillR = fillColor[0];
    const fillG = fillColor[1];
    const fillB = fillColor[2];
    const fillA = fillColor[3] || 255;
    
    // Don't fill if the start color is the same as fill color
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