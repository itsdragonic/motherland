function clickProvince(ctx,evt) {
    // Convert mouse coordinates to map coordinates
    const pt = ctx.transformedPoint(evt.offsetX, evt.offsetY);

    const clickX = pt.x;
    const clickY = pt.y;

    let clickedProvinceId = null;
    const threshold = 10; // px radius to detect click near province center

    for (const id in provinceData) {
        if (!Object.prototype.hasOwnProperty.call(provinceData, id)) continue;
        const pos = provinceData[id].pos;
        if (!pos) continue;

        const [x, y] = pos;

        const dist = Math.hypot(x - clickX, y - clickY);
        if (dist <= threshold) {
            clickedProvinceId = id;
            break; // stop after first match
        }
    }

    if (clickedProvinceId) {
        changeOwner(clickedProvinceId, "thrace");
        console.log(clickedProvinceId);
        console.log(provinceInfo[clickedProvinceId]);
    } else {
        console.log("No province clicked");
    }
}

function changeOwner(id, nation) {
    provinceInfo[id].owner = nation;
    cachedProvinceOverlay = null;
}