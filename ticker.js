const newsMessages = [
  "🌎 Bienvenido al mapa mundi interactivo.",
  "📰 Última hora: Nuevas investigaciones sobre el cambio climático.",
  "✈️ Aumentan los vuelos internacionales entre América y Europa.",
  "⚽ Noticias deportivas: Sudamérica domina en el mundial.",
  "💡 Curiosidad: El desierto del Sahara es más grande que Brasil."
];

const ticker = document.getElementById("ticker-content");
ticker.textContent = newsMessages.join("   ✦   ");

// Reiniciar animación cuando termine
ticker.addEventListener("animationiteration", () => {
  const first = newsMessages.shift();
  newsMessages.push(first);
  ticker.textContent = newsMessages.join("   ✦   ");
});
