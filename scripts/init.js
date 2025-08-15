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

function initializeGame() {
    game_data.turn = 1;
    game_data.month = 1;
    game_data.year = 1;

    runTurn();
}

function runTurn() {
    // Display turn
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