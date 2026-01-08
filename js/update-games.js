// --- Тут качаем игры одного человека ---

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

function getGames(steamID) {
  return new Promise((resolve, rejects) => {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parced = JSON.parse(data);
            resolve(parsed.response.games || []);
          } catch (e) {
            console.error(`Ошибка обработки данных для игрока ${steamId}`, e);
            resolve([]);
          }
        });
      })
      .on("error", reject);
  });
}

// --- ГЛАВНАЯ ФУНКЦИЯ ---

async function main() {
  if (!API_KEY) {
    console.error("ОШИБКА: Не найден STEAM_API_KEY!");
    return;
  }

  const allPlayersData = await Promise.all(
    PLAYER_IDS.map((id) => getGames(id))
  );

  const activePlayersGames = allPlayersData.filter((games) => games !== null);
  if (activePlayersGames.length === 0) {
    console.error(
      "❌ ИТОГ: Нет доступных данных ни для одного игрока. Проверьте настройки приватности Steam у всех."
    );
    process.exit(1);
  }

  if (allPlayersData.some((games) => games.length === 0)) {
    console.error(
      "У кого-то закрыт профиль или нет игр! Проверьте настройки приватности Steam."
    );
  }
  const firstPlayerGames = allPlayersData[0];
  const commonGames = [];
  firstPlayerGames.forEach((game) => {
    const appId = game.appid;
    let minPlaytime = game.playtime_forever;
    let allHaveIt = true;
    for (i = 1; i < allPlayersData.length; i++) {
      const friendGame = allPlayersData[i].find((g) => g.appid === appId);
      if (!friendGame) {
        allHaveIt = false;
        break;
      }
      if (friendGame.playtime_forever < minPlaytime) {
        minPlaytime = friendGame.playtime_forever;
      }
    }
    if (allHaveIt && minPlaytime > 0) {
      commonGames.push({
        id: appId,
        name: game.name,
        image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
        hours: Math.floor(minPlaytime / 60),
      });
    }
  });
  commonGames.sort((a, b) => b.hours - a.hours);
  const topGames = commonGames.slice(0, 10);
  const outputDir = "./data";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.writeFileSync(
    `${outputDir}/steam_data.json`,
    JSON.stringify(topGames, null, 2)
  );

  console.log(
    `ГОТОВО! Найдено общих игр: ${commonGames.length}. В файл записано топ: ${topGames.length}`
  );
}

main();
