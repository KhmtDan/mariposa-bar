const fs = require('fs');
const https = require('https');

const PLAYER_IDS = [
    "76561198967053678",
    "76561199067046712",
    "76561198037395397",
    "76561198843829144"
];

const API_KEY = process.env.STEAM_API_KEY;

function getGames(steamId) {
    return new Promise((resolve) => {
        if (!API_KEY) { resolve(null); return; }
        
        if (!steamId || steamId.includes('xxx')) { 
            console.log(`Пропускаем неверный ID: ${steamId}`);
            resolve(null); 
            return; 
        }

        const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) { 
                    console.log(`Ошибка Steam для ${steamId}: ${res.statusCode}`);
                    resolve(null); 
                    return; 
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.response && parsed.response.games) {
                        console.log(`✅ ID ${steamId}: найдено ${parsed.response.games.length} игр.`);
                        resolve(parsed.response.games);
                    } else {
                        console.log(`⚠️ ID ${steamId}: игры скрыты или список пуст.`);
                        resolve(null);
                    }
                } catch (e) { resolve(null); }
            });
        }).on('error', (err) => {
            console.log(`Ошибка соединения для ${steamId}: ${err.message}`);
            resolve(null);
        });
    });
}

async function main() {
    const outputDir = './data';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    if (!API_KEY) {
        console.log('Нет API ключа!');
        fs.writeFileSync(`${outputDir}/steam_data.json`, '[]');
        return;
    }

    console.log(`Запрос данных для ${PLAYER_IDS.length} игроков...`);
    
    const rawResults = await Promise.all(PLAYER_IDS.map(id => getGames(id)));
    const activePlayersGames = rawResults.filter(g => g !== null);

    if (activePlayersGames.length === 0) {
        console.log('❌ Ни одного игрока не загрузилось.');
        fs.writeFileSync(`${outputDir}/steam_data.json`, '[]');
        return;
    }

    console.log(`Успешно загружено профилей: ${activePlayersGames.length}. Ищем совпадения...`);

    const baseGames = activePlayersGames[0]; 
    const commonGames = [];

    baseGames.forEach(game => {
        const appId = game.appid;
        let minPlaytime = game.playtime_forever;
        let allHaveIt = true;

        for (let i = 1; i < activePlayersGames.length; i++) {
            const friendGame = activePlayersGames[i].find(g => g.appid === appId);
            if (!friendGame) { 
                allHaveIt = false; 
                break; 
            }
            if (friendGame.playtime_forever < minPlaytime) minPlaytime = friendGame.playtime_forever;
        }

        if (allHaveIt && minPlaytime > 0) {
            commonGames.push({
                id: appId,
                name: game.name,
                image: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
                hours: Math.floor(minPlaytime / 60)
            });
        }
    });

    commonGames.sort((a, b) => b.hours - a.hours);
    const topGames = commonGames.slice(0, 10);
    
    console.log(`🎉 Найдено общих игр: ${commonGames.length}. Записываем топ-10.`);
    fs.writeFileSync(`${outputDir}/steam_data.json`, JSON.stringify(topGames, null, 2));
}

main();
