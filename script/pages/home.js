/**
 * HOME PAGE
 * Renders the upcoming learning half day courses sidebar list.
 */
async function initHomePage() {
  injectHeader("home");
  injectFooter();
  injectClassModal();
  applySavedPreferences();

  // Home page needs classes + descriptions for the upcoming list
  await loadData({
    classes: CONFIG.files.classes,
    descriptions: CONFIG.files.descriptions,
    videoVault: null,
    rooms: null,
    qi: null,
  });

  renderUpcomingList("upcomingList");
}