document.addEventListener("DOMContentLoaded", () => {
  const listElement = document.getElementById("steam-game-list");
  fetch("./data/steam_data.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Файл данных пока не создан");
      }
      return response.json();
    })
    .then((games) => {
      if (games.length === 0) {
        listElement.innerHTML =
          '<li class="loading-text">Данные скрыты настройками приватности Steam</li>';
        return;
      }
      listElement.innerHTML = "";
      games.forEach((game) => {
        const li = document.createElement("li");
        li.className = "game-card";
        li.innerHTML = `
                    <div class="game-card-content">
                        <img src="${game.image}" alt="${game.name}" class="game-img">
                        <div class="game-info">
                            <span class="game-title">${game.name}</span>
                            <span class="game-hours">⏱ ${game.hours} ч.</span>
                        </div>
                    </div>
                `;
        listElement.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Ошибка:", error);
      listElement.innerHTML =
        '<li class="loading-text">Данные обновляются... Зайдите позже.</li>';
    });
});


