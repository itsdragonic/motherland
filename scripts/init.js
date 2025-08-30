let player = {
    nation: 'rome',
    ethnicity: 'romans',

    army_info: {
        province: null,
        unit: null,
        count: null
    }
}

let ai = {
    difficulty: 1 // 0 | 1 | 2 = easy, medium, hard
}

let game_data = {
    turn: 1,
    month: 1,
    year: 1,
}

const display = {
    gold: document.getElementById('gold_display'),
    stability: document.getElementById('stability_display'),
    culture: document.getElementById('culture_display'),
    player: document.getElementById('player_display'),
    year: document.getElementById('year_display')
};

function month(number) {
    switch (number) {
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
    // Time info
    let year = game_data.year;
    if (year == 0) {
        game_data.year ++;
        year ++;
    } else if (year < 0) {
        year = Math.abs(game_data.year) + ' BC';
    } else if (year < 1000) {
        year = game_data.year + ' AD';
    }
    display.year.innerText = `${month(game_data.month)} ${year}`;

    // Other info
    display.gold.innerText = `🪙${scenario.nations[player.nation].gold}`;
    display.stability.innerText = `⚖️${scenario.nations[player.nation].stability}%`;
    display.culture.innerText = `🎭${scenario.ethnicities[player.ethnicity].culture}`;
    display.player.innerText = nationInfo[player.nation].name;
}

function initializeGame() {
    game_data.turn = 1;
    game_data.month = 1;
    game_data.year = 1;

    // Keybinds
    document.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            nextTurn();
        }
    });

    loadScenario();

    const nations = Object.values(scenario.nations);
    nations.forEach(nation => {
        nation.gold = 0;
        nation.stability = 70;
    });

    const ethnicities = Object.values(scenario.ethnicities);
    ethnicities.forEach(ethnicity => {
        ethnicity.culture = 0;
    });

    updateInfo();
}

function runTurn() {
    updateInfo();
    updateArmies();

    // Running the turn

    const nations = Object.values(scenario.nations);
    nations.forEach(nation => {
        nation.gold += 10;
        nation.stability += Math.round(Math.random() * (2 - (-2)) + (-2));
    });

    for (const name in scenario.ethnicities) {
        const ethnicity = scenario.ethnicities[name];
        ethnicity.culture += 2;

        //if (name == player.ethnicity) continue;
        aiEthnicity(name); // or aiEthnicity(name, ethnicity) if needed
    }
    
    updateInfo();
}

function nextTurn() {
    if (game_data.month >= 12) {
        game_data.month = 1;
        game_data.year++;
    } else {
        game_data.month++;
    }
    runTurn();
}

function aiEthnicity(ethnicity) {
    let neighbors = neighboringProvinces(ethnicity);
    const randomIndex = Math.floor(Math.random() * neighbors.length);
    const randomNumber = neighbors[randomIndex];

    if (provinceNodes[randomNumber].type == 'land' && !provinceInfo[randomNumber].ethnicity) {
        changeOwner(randomNumber, 'ethnicities', ethnicity);
    }
}