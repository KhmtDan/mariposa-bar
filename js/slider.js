document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("track");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  const cards = document.querySelectorAll(".game-card");

  if (!track || !prevBtn || !nextBtn || cards.length === 0) return;

  let index = 0;

  const updateSlider = () => {
    const cardWidth = cards[0].offsetWidth;
    const gap = 20;
    const step = cardWidth + gap;

    track.style.transform = `translateX(-${index * step}px)`;
  };

  nextBtn.addEventListener("click", () => {
    if (index < cards.length - 3) {
      index++;
    } else {
      index = 0;
    }
    updateSlider();
  });

  prevBtn.addEventListener("click", () => {
    if (index > 0) {
      index--;
    } else {
      index = cards.length - 3;
    }
    updateSlider();
  });

  window.addEventListener("resize", updateSlider);
});
