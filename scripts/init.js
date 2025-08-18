let player = {
    nation: "rome",
    ethnicity: "romans",
    gold: 0,
}

let game_data = {
    turn: 1,
    month: 1,
    year: 1,
}

let units_moving = {
    "1": {
        "rome": [
            { unit: "soldiers", count: 3, destination: 2, time_per_tile: 2 },
            { unit: "archers", count: 1, destination: 3, time_per_tile: 4 }
        ],
    }
}

const display = {
    gold: document.getElementById('gold_display'),
    player: document.getElementById('player_display'),
    year: document.getElementById('year_display')
};

function month(number) {
    switch(number) {
        case 1:
            return 'Jan';
        case 2:
            return 'Feb';
        case 3:
            return 'Mar';
        case 4:
            return 'Apr';
        case 5:
            return 'May';
        case 6:
            return 'Jun';
        case 7:
            return 'Jul';
        case 8:
            return 'Aug';
        case 9:
            return 'Sep';
        case 10:
            return 'Oct';
        case 11:
            return 'Nov';
        case 12:
            return 'Dec';
        default:
            return 'Inv';
    }
}

function updateInfo() {
    let year = game_data.year;
    if (year < 0) {
        year = game_data.year + ' BC';
    } else if (year < 1000) {
        year = game_data.year + ' AD';
    }
    display.year.innerText = `${month(game_data.month)} ${year}`;

    display.gold.innerText = `Gold: ${player.gold}`;
    display.player.innerText = nationInfo[player.nation].name;
}

function initializeGame() {
    game_data.turn = 1;
    game_data.month = 1;
    game_data.year = 1;
    loadScenario();
    updateInfo();
}

function runTurn() {
    updateInfo();
    updateArmies();

    // Running the turn

    player.gold += 50 // temporary
    updateInfo();
}

function nextTurn() {
    if (game_data.month >= 12) {
        game_data.month = 1;
        game_data.year ++;
    } else {
        game_data.month ++;
    }
    runTurn();
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        nextTurn(); 
    }
});

function updateArmies() {
    for (const origin in units_moving) {
        for (const nation in units_moving[origin]) {
            const moves = units_moving[origin][nation];

            // go backwards in case we need to splice
            for (let i = moves.length - 1; i >= 0; i--) {
                let move = moves[i];

                // decrement timer
                move.time_per_tile--;

                if (move.time_per_tile <= 0) {
                    const { unit, count, destination } = move;

                    // ensure destination armies object exists
                    if (!provinceInfo[destination].armies) {
                        provinceInfo[destination].armies = {};
                    }
                    if (!provinceInfo[destination].armies[nation]) {
                        provinceInfo[destination].armies[nation] = {};
                    }

                    // add arriving units to destination
                    if (!provinceInfo[destination].armies[nation][unit]) {
                        provinceInfo[destination].armies[nation][unit] = 0;
                    }
                    provinceInfo[destination].armies[nation][unit] += count;

                    // remove from origin (safety check)
                    if (
                        provinceInfo[origin]?.armies?.[nation]?.[unit] !== undefined
                    ) {
                        provinceInfo[origin].armies[nation][unit] -= count;
                        if (provinceInfo[origin].armies[nation][unit] <= 0) {
                            delete provinceInfo[origin].armies[nation][unit];
                        }
                    }

                    // remove this movement entry
                    moves.splice(i, 1);
                }
            }

            // cleanup if nation has no more moves
            if (moves.length === 0) {
                delete units_moving[origin][nation];
            }
        }

        // cleanup if province has no more moves
        if (Object.keys(units_moving[origin]).length === 0) {
            delete units_moving[origin];
        }
    }

    // update canvas
    redraw();
}