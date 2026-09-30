/**
 * SEARCH PAGE — loads all data and filters across courses, videos, QI resources.
 * Reads the ?q= query parameter from the URL.
 */
async function initSearchPage() {
  injectHeader("");
  injectFooter();
  injectClassModal();
  applySavedPreferences();

  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").toLowerCase().trim();

  // Display the query in the search input
  const searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = query;

  if (!query) {
    document.getElementById("searchResults").innerHTML =
      '<div class="text-center py-5"><i class="bi bi-search display-3 text-muted"></i><h4 class="mt-3">Enter a search term above.</h4></div>';
    return;
  }

  await loadData();

  const results = [];

  // Search courses
  globalRawDescs.forEach((d) => {
    const title = utils.cleanTitle(d.Course || d.Title || "").toLowerCase();
    const desc = (d.Description || "").toLowerCase();
    if (title.includes(query) || desc.includes(query)) {
      results.push({ type: "Course", title: utils.cleanTitle(d.Course || d.Title), description: d.Description, link: d.CourseLink || "#" });
    }
  });

  // Search videos
  globalVideoVault.forEach((d) => {
    const title = utils.cleanTitle(d.Course || d.Title).toLowerCase();
    const desc = (d.Description || "").toLowerCase();
    if (title.includes(query) || desc.includes(query)) {
      results.push({ type: "Video", title: utils.cleanTitle(d.Course || d.Title), description: d.Description, link: d.CourseLink || d.VideoLink || "#" });
    }
  });

  // Search QI
  globalQualityImprovement.forEach((d) => {
    const title = utils.cleanTitle(d.Course || d.Title).toLowerCase();
    const desc = (d.Description || "").toLowerCase();
    if (title.includes(query) || desc.includes(query)) {
      results.push({ type: "QI Resource", title: utils.cleanTitle(d.Course || d.Title), description: d.Description, link: d.CourseLink || "#" });
    }
  });

  const container = document.getElementById("searchResults");

  if (results.length === 0) {
    container.innerHTML =
      '<div class="text-center py-5"><i class="bi bi-emoji-frown display-3 text-muted"></i><h4 class="mt-3">No results found for "' + query + '"</h4></div>';
    return;
  }

  container.innerHTML = `
    <h4 class="mb-3">${results.length} result${results.length === 1 ? "" : "s"} for "${query}"</h4>
    <div class="list-group">
      ${results
        .map(
          (r) => `
        <div class="list-group-item list-group-item-action mb-2 border-0 shadow-sm rounded-3">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <span class="badge bg-primary mb-1">${r.type}</span>
              <h6 class="fw-bold mb-1">${r.title}</h6>
              <p class="small text-muted mb-0">${(r.description || "").substring(0, 200)}${(r.description || "").length > 200 ? "..." : ""}</p>
            </div>
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
}