var canvas = document.getElementsByTagName('canvas')[0];
canvas.width = 800;
canvas.height = 500;

var map_empty = new Image();
map_empty.src = 'maps/europe/map_empty.png';

var map_provinces = new Image();
map_provinces.src = 'maps/europe/map_provinces.png';

var map_physical = new Image();
map_physical.src = 'maps/europe/map_physical.png';

var disable_tiles = false;
var physical_map = false;

// Play button
var title_screen = true;
document.getElementById('play_button').addEventListener('click', function() {
    document.getElementById('play_button').style.display = 'none';
    title_screen = false;
    initializeGame();
    redraw();
});

// Settings
document.getElementById('disable_tile_checkbox').addEventListener('change', function(e) {
    disable_tiles = !disable_tiles;
    redraw();
});
document.getElementById('physical_map_checkbox').addEventListener('change', function(e) {
    physical_map = !physical_map;
    if (physical_map) {
        document.getElementById('disable_tile_checkbox').checked = true;
        disable_tiles = true;
    }
    redraw();
});

window.onload = function () {

    var ctx = canvas.getContext('2d');
    trackTransforms(ctx);

    // Off-screen canvas matches image size
    var offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = map_empty.width;
    offscreenCanvas.height = map_empty.height;
    var offscreenCtx = offscreenCanvas.getContext('2d');

    window.redraw = function() {
        // Turn smoothing on/off depending on zoom
        const currentScale = ctx.getTransform().a; // current zoom
        if (currentScale < 1) {
            ctx.imageSmoothingEnabled = true;
        } else {
            ctx.imageSmoothingEnabled = false;
        }

        if (title_screen) {
            // Drawing background of title screen
            ctx.drawImage(map_empty, 0, -250);
            ctx.filter = 'blur(5px)';
            ctx.drawImage(map_provinces, 0, -250);
            ctx.filter = 'none';
            ctx.drawImage(map_provinces, 0, -250);
            
            // Text
            let centerX = canvas.width / 2;
            let centerY = canvas.height / 2;

            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.27)";
            ctx.shadowBlur = 50;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, 200, 50, 0, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fill();

            ctx.font = 'bold 60px serif, Lato, Arial';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5;

            ctx.fillText('Motherland', centerX, centerY);
            ctx.restore();

        } else {
            // raw map
            drawMap(offscreenCtx);

            // Make white pixels transparent if physical_map is true
            if (physical_map) {
                let imgData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                let data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // white to transparent
                    if (data[i] === 255 && data[i+1] === 255 && data[i+2] === 255 && data[i+3] === 255) {
                        data[i+3] = 0;
                    }
                    // transparent to blue
                    else if (data[i+3] === 0 && !disable_tiles) {
                        data[i] = 23;
                        data[i+1] = 45;
                        data[i+2] = 53;
                        data[i+3] = 150;
                    }
                }
                offscreenCtx.putImageData(imgData, 0, 0);
            }
            // ------------------------------------------------------------

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // post-special additions to map
            ctx.save();

            if (physical_map) {
                ctx.drawImage(map_physical, 0, 0);
                ctx.globalAlpha = 0.5;
            }
            if (disable_tiles) {
                ctx.imageSmoothingEnabled = true;
                if (!physical_map) ctx.drawImage(map_empty, 0, 0);
                ctx.drawImage(offscreenCanvas, 1, 0);
                ctx.drawImage(offscreenCanvas, -1, 0);
                ctx.drawImage(offscreenCanvas, 0, 1);
                ctx.drawImage(offscreenCanvas, 0, -1);
                ctx.filter = 'blur(3px)';
                ctx.drawImage(offscreenCanvas, 0, 0);
                ctx.filter = 'none';
            } else {
                // default
                if (!physical_map) ctx.drawImage(map_empty, 0, 0);
                ctx.filter = 'blur(5px)';
                ctx.drawImage(offscreenCanvas, 0, 0);
                ctx.filter = 'none';
                ctx.drawImage(offscreenCanvas, 0, 0);
            }
            ctx.restore();

            drawTileInfo(ctx, currentScale);
            drawNationLabels(ctx, currentScale);
        }
    }
    redraw();

    var lastX = canvas.width / 2, lastY = canvas.height / 2;
    var dragStart, dragged;

    document.getElementById('map_select').addEventListener('change', async (e) => {
        display_map = e.target.value;
        redraw();
    });

    canvas.addEventListener('mousedown', function (evt) {
        document.body.style.userSelect = 'none';
        lastX = evt.offsetX;
        lastY = evt.offsetY;
        dragStart = ctx.transformedPoint(lastX, lastY);
        dragged = false;
    }, false);

    canvas.addEventListener('mousemove', function (evt) {
        lastX = evt.offsetX;
        lastY = evt.offsetY;
        dragged = true;
        if (dragStart) {
            var pt = ctx.transformedPoint(lastX, lastY);
            ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
            redraw();
        }
    }, false);

    canvas.addEventListener('mouseup', function (evt) {
        dragStart = null;
        if (!dragged) clickProvince(ctx,evt);
    }, false);

    var scaleFactor = 1.1;

    function zoom(clicks) {
        var pt = ctx.transformedPoint(lastX, lastY);
        ctx.translate(pt.x, pt.y);
        var factor = Math.pow(scaleFactor, clicks);

        // --- prevent zooming out too far ---
        var boundsScale = Math.min(
            canvas.width / map_empty.width,
            canvas.height / map_empty.height
        );
        var currentScale = ctx.getTransform().a;
        if (factor * currentScale < boundsScale) {
            factor = boundsScale / currentScale;
        }
        // -----------------------------------

        ctx.scale(factor, factor);
        ctx.translate(-pt.x, -pt.y);
        redraw();
    }

    function handleScroll(evt) {
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : -evt.detail;
        if (delta) zoom(delta);
        evt.preventDefault();
    }

    canvas.addEventListener('DOMMouseScroll', handleScroll, false);
    canvas.addEventListener('mousewheel', handleScroll, false);
};

// Adds ctx.getTransform() - returns an SVGMatrix
// Adds ctx.transformedPoint(x,y) - returns an SVGPoint
function trackTransforms(ctx) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function () { return xform; };

    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function () {
        savedTransforms.push(xform.translate(0, 0));
        return save.call(ctx);
    };

    var restore = ctx.restore;
    ctx.restore = function () {
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function (sx, sy) {
        xform = xform.scaleNonUniform(sx, sy);
        return scale.call(ctx, sx, sy);
    };

    var rotate = ctx.rotate;
    ctx.rotate = function (radians) {
        xform = xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
    };

    var translate = ctx.translate;
    ctx.translate = function (dx, dy) {
        xform = xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
    };

    var transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
        var m2 = svg.createSVGMatrix();
        m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
        xform = xform.multiply(m2);
        return transform.call(ctx, a, b, c, d, e, f);
    };

    var setTransform = ctx.setTransform;
    ctx.setTransform = function (a, b, c, d, e, f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
    };

    var pt = svg.createSVGPoint();
    ctx.transformedPoint = function (x, y) {
        pt.x = x; pt.y = y;
        return pt.matrixTransform(xform.inverse());
    }
}