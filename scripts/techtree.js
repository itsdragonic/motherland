(function () {
    'use strict';

    // ---- CONFIG ----
    var width = 800,
        height = 800,
        boxWidth = 150,
        boxHeight = 20,
        gap = { width: 150, height: 12 },
        margin = { top: 16, right: 16, bottom: 16, left: 16 };

    var data = {
        "Nodes": [
            {
                "lvl": 1,
                "name": "Tech 1"
            },
            {
                "lvl": 1,
                "name": "Tech 2"
            },
            {
                "lvl": 1,
                "name": "Tech 3"
            },
            {
                "lvl": 1,
                "name": "Tech 4"
            },
            {
                "lvl": 1,
                "name": "Tech 5"
            },
            {
                "lvl": 0,
                "name": "Choice 1"
            },
            {
                "lvl": 0,
                "name": "Choice 2"
            },
            {
                "lvl": 0,
                "name": "Choice 3"
            },
            {
                "lvl": 0,
                "name": "Choice 4"
            },
            {
                "lvl": 0,
                "name": "Choice 5"
            },
            {
                "lvl": 2,
                "name": "Event 1"
            },
            {
                "lvl": 2,
                "name": "Event 2"
            },
            {
                "lvl": 2,
                "name": "Event 3"
            },
            {
                "lvl": 2,
                "name": "Event 4"
            },
            {
                "lvl": 2,
                "name": "Event 5"
            }
        ],
        "links": [
            {
                "source": "Choice 1",
                "target": "Tech 1"
            },
            {
                "source": "Choice 3",
                "target": "Tech 1"
            },
            {
                "source": "Choice 5",
                "target": "Tech 1"
            },
            {
                "source": "Choice 2",
                "target": "Tech 2"
            },
            {
                "source": "Choice 4",
                "target": "Tech 2"
            },
            {
                "source": "Choice 1",
                "target": "Tech 3"
            },
            {
                "source": "Choice 3",
                "target": "Tech 3"
            },
            {
                "source": "Choice 5",
                "target": "Tech 3"
            },
            {
                "source": "Choice 2",
                "target": "Tech 4"
            },
            {
                "source": "Choice 4",
                "target": "Tech 4"
            },
            {
                "source": "Choice 1",
                "target": "Tech 5"
            },
            {
                "source": "Choice 3",
                "target": "Tech 5"
            },
            {
                "source": "Choice 5",
                "target": "Tech 5"
            },
            {
                "source": "Tech 1",
                "target": "Event 2"
            },
            {
                "source": "Tech 1",
                "target": "Event 4"
            },
            {
                "source": "Tech 2",
                "target": "Event 1"
            },
            {
                "source": "Tech 2",
                "target": "Event 3"
            },
            {
                "source": "Event 5",
                "target": "Tech 2"
            },
            {
                "source": "Tech 3",
                "target": "Event 2"
            },
            {
                "source": "Tech 3",
                "target": "Event 4"
            },
            {
                "source": "Tech 4",
                "target": "Event 1"
            },
            {
                "source": "Tech 4",
                "target": "Event 3"
            },
            {
                "source": "Tech 4",
                "target": "Event 5"
            },
            {
                "source": "Tech 5",
                "target": "Event 2"
            },
            {
                "source": "Tech 5",
                "target": "Event 4"
            }
        ]
    };

    // ---- STATE ----
    var Nodes = [];
    var links = [];
    var svg;

    // ---- DIAGONAL COMPAT (D3 v3 and v4+) ----
    function makeDiagonal() {
        // D3 v3
        if (window.d3 && d3.svg && typeof d3.svg.diagonal === 'function') {
            return d3.svg.diagonal().projection(function (d) { return [d.y, d.x]; });
        }
        // D3 v4+ (uses d3-shape)
        if (window.d3 && d3.linkHorizontal) {
            var link = d3.linkHorizontal()
                .source(function (d) { return [d.source.y, d.source.x]; })
                .target(function (d) { return [d.target.y, d.target.x]; });
            return function (d) { return link(d); };
        }
        // Fallback: manual cubic path
        return function (d) {
            var sx = d.source.y, sy = d.source.x, tx = d.target.y, ty = d.target.x;
            var mx = (sx + tx) / 2;
            return 'M' + sx + ',' + sy + 'C' + mx + ',' + sy + ' ' + mx + ',' + ty + ' ' + tx + ',' + ty;
        };
    }
    var diagonal = makeDiagonal();

    // ---- HELPERS ----
    function find(text) {
        for (var i = 0; i < Nodes.length; i++) {
            if (Nodes[i].name === text) return Nodes[i];
        }
        return null;
    }

    function mouse_action(val, stat, direction) {
        d3.select('#' + val.id).classed('active', stat);

        links.forEach(function (d) {
            if (direction === 'root') {
                if (d.source.id === val.id) {
                    d3.select('#' + d.id).classed('activelink', stat).classed('link', !stat);
                    if (d.target.lvl < val.lvl) mouse_action(d.target, stat, 'left');
                    else if (d.target.lvl > val.lvl) mouse_action(d.target, stat, 'right');
                }
                if (d.target.id === val.id) {
                    d3.select('#' + d.id).classed('activelink', stat).classed('link', !stat);
                    if (d.source.lvl < val.lvl) mouse_action(d.source, stat, 'left');
                    else if (d.source.lvl > val.lvl) mouse_action(d.source, stat, 'right');
                }
            } else if (direction === 'left') {
                if (d.source.id === val.id && d.target.lvl < val.lvl) {
                    d3.select('#' + d.id).classed('activelink', stat).classed('link', !stat);
                    mouse_action(d.target, stat, direction);
                }
                if (d.target.id === val.id && d.source.lvl < val.lvl) {
                    d3.select('#' + d.id).classed('activelink', stat).classed('link', !stat);
                    mouse_action(d.source, stat, direction);
                }
            } else if (direction === 'right') {
                if (d.source.id === val.id && d.target.lvl > val.lvl) {
                    d3.select('#' + d.id).classed('activelink', stat).classed('link', !stat);
                    mouse_action(d.target, stat, direction);
                }
                if (d.target.id === val.id && d.source.lvl > val.lvl) {
                    d3.select('#' + d.id).classed('activelink', stat).classed('link', !stat);
                    mouse_action(d.source, stat, direction);
                }
            }
        });
    }

    function unvisite_links() {
        links.forEach(function (d) { d.visited = false; });
    }

    function renderRelationshipGraph(data) {
        // Reset arrays to avoid duplicate nodes/links when re-initializing
        Nodes.length = 0;
        links.length = 0;

        // Compute row counts per level
        var count = [];
        data.Nodes.forEach(function (d) { count[d.lvl] = count[d.lvl] || 0; });

        // Position nodes
        data.Nodes.forEach(function (d, i) {
            d.x = margin.left + d.lvl * (boxWidth + gap.width);
            d.y = margin.top + (boxHeight + gap.height) * (count[d.lvl] || 0);
            d.id = 'n' + i;
            count[d.lvl] = (count[d.lvl] || 0) + 1;
            Nodes.push(d);
        });

        // Build link objects
        data.links.forEach(function (d) {
            var s = find(d.source);
            var t = find(d.target);
            if (!s || !t) return; // guard if a name is missing
            links.push({
                source: s,
                target: t,
                id: 'l' + s.id + t.id
            });
        });
        unvisite_links();

        // Nodes group
        var nodesG = svg.append('g').attr('class', 'nodes');

        var node = nodesG.selectAll('g.unit')
            .data(Nodes)
            .enter()
            .append('g')
            .attr('class', 'unit');

        node.append('rect')
            .attr('x', function (d) { return d.x; })
            .attr('y', function (d) { return d.y; })
            .attr('id', function (d) { return d.id; })
            .attr('width', boxWidth)
            .attr('height', boxHeight)
            .attr('class', 'node')
            .attr('rx', 6)
            .attr('ry', 6)
            .style('stroke', 'white')        // Outline color
            .style('stroke-width', 2)
            .on('mouseover', function () {
                mouse_action(d3.select(this).datum(), true, 'root');
                unvisite_links();
            })
            .on('mouseout', function () {
                mouse_action(d3.select(this).datum(), false, 'root');
                unvisite_links();
            });

        node.append('text')
            .attr('class', 'label')
            .attr('x', function (d) { return d.x + 14; })
            .attr('y', function (d) { return d.y + 15; })
            .text(function (d) { return d.name; });

        // Links (append after nodes container so they render behind text if your CSS sets it)
        links.forEach(function (li) {
            svg.append('path')
                .attr('class', 'link')
                .attr('id', li.id)
                .attr('d', (function () {
                    var oTarget = { x: li.target.y + 0.5 * boxHeight, y: li.target.x };
                    var oSource = { x: li.source.y + 0.5 * boxHeight, y: li.source.x };
                    if (oSource.y < oTarget.y) oSource.y += boxWidth; else oTarget.y += boxWidth;
                    return diagonal({ source: oSource, target: oTarget });
                })());
        });
    }

    // ---- INIT (wait for DOM and D3) ----
    function boot() {
        if (!window.d3) {
            console.error('D3 not found. Load D3 before this script.');
            return;
        }
        var container = document.getElementById('tree');
        if (!container) {
            console.error('#tree container not found in DOM.');
            return;
        }

        svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g');

        renderRelationshipGraph(data);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();