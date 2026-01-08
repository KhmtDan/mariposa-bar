document.addEventListener("DOMContentLoaded", () => {
  let beerLikes = 0;
  const beerButton = document.getElementById("beer-button");
  const beerDisplay = document.getElementById("beer-count");

  beerButton.addEventListener("click", function () {
    beerLikes = beerLikes + 1;
    beerDisplay.innerText = beerLikes;
  });
});
