/*
 * Synchronous pre-paint theme bootstrap.
 *
 * Loaded from the document head before stylesheets or the app bundle so a
 * returning dark-theme visitor never sees a light flash (and a first-time
 * visitor defaults to light). Served from 'self' to satisfy script-src 'self'.
 */
(function () {
  var theme = 'light';
  try {
    if (window.localStorage.getItem('portfolio_theme') === 'dark') {
      theme = 'dark';
    }
  } catch (error) {
    // Storage denial (private browsing) keeps the light default.
  }
  document.documentElement.dataset.theme = theme;
})();
