const { rejects } = require("assert/strict");
const { resolve } = require("dns");
const fs = require("fs");
const https = require("https");

const PLAYER_IDS = [
  "STEAM_0:0:503393975",
  "STEAM_0:0:553390492",
  "STEAM_0:1:38564834",
  "STEAM_0:0:441781708",
];

const API_KEY = process.env.STEAM_API_KEY;

function getGames(steamId) {
    return new Promise((resolve) => {
        if (!API_KEY) { resolve(null); return; }
        if (steamId.includes('xxx')) { resolve(null); return; }

        const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) { resolve(null); return; }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.response && parsed.response.games) {
                        resolve(parsed.response.games);
                    } else {
                        resolve(null);
                    }
                } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

async function main() {
    const outputDir = './data';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    if (!API_KEY) {
        fs.writeFileSync(`${outputDir}/steam_data.json`, '[]');
        return;
    }

    const rawResults = await Promise.all(PLAYER_IDS.map(id => getGames(id)));
    const activePlayersGames = rawResults.filter(g => g !== null);

    if (activePlayersGames.length === 0) {
        fs.writeFileSync(`${outputDir}/steam_data.json`, '[]');
        return;
    }

    const baseGames = activePlayersGames[0]; 
    const commonGames = [];

    baseGames.forEach(game => {
        const appId = game.appid;
        let minPlaytime = game.playtime_forever;
        let allHaveIt = true;

        for (let i = 1; i < activePlayersGames.length; i++) {
            const friendGame = activePlayersGames[i].find(g => g.appid === appId);
            if (!friendGame) { allHaveIt = false; break; }
            if (friendGame.playtime_forever < minPlaytime) minPlaytime = friendGame.playtime_forever;
        }

        if (allHaveIt && minPlaytime > 0) {
            commonGames.push({
                id: appId,
                name: game.name,
                image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
                hours: Math.floor(minPlaytime / 60)
            });
        }
    });

    commonGames.sort((a, b) => b.hours - a.hours);
    const topGames = commonGames.slice(0, 10);
    
    fs.writeFileSync(`${outputDir}/steam_data.json`, JSON.stringify(topGames, null, 2));
    console.log('Done');
}

main();
