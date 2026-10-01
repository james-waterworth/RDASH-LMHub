/**
 * Shared header component — injected into every page.
 * Call injectHeader('home') on each page, passing the active nav item key.
 *
 * Nav keys: home | educator | learner | feedback | catalogue | video-vault |
 *           qi | mast | rooms | faqs | volunteers
 */
function injectHeader(activePage) {
  const navItems = [
    { key: "home",         label: "Home",                 href: "index.html" },
    { key: "educator",     label: "Educator",             href: "educator.html" },
    { key: "learner",      label: "Learner",              href: "learner.html" },
    { key: "feedback",     label: "Feedback",             href: "feedback.html" },
    { key: "catalogue",    label: "Course Catalogue",     href: "course-catalogue.html" },
    { key: "video-vault",  label: "Video Vault",          href: "video-vault.html" },
    { key: "qi",           label: "Quality Improvement",  href: "quality-improvement.html" },
    { key: "mast",         label: "MAST",                 href: "mast.html" },
    { key: "rooms",        label: "Rooms",                href: "rooms.html" },
    { key: "faqs",         label: "FAQs",                 href: "faqs.html" },
    { key: "volunteers",   label: "Volunteers",           href: "Volunteers.html" },
  ];

  const navLinks = navItems
    .map(
      (item) =>
        `<li class="nav-item"><a class="nav-link ${activePage === item.key ? "active" : ""}" href="${item.href}">${item.label}</a></li>`,
    )
    .join("\n              ");

  const headerHTML = `
  <header class="nhs-header">
    <div class="container">
      <div class="brand-row">
        <h1></h1>
        <img src="Assets/rdashwhite.PNG" class="header-right-logo" alt="RDaSH logo" />
      </div>
      <nav class="navbar navbar-expand-lg">
        <div class="container px-0 d-flex align-items-center">
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse justify-content-center" id="navMenu">
            <ul class="navbar-nav">
              ${navLinks}
            </ul>
          </div>
          <div style="width: 100px;" class="d-none d-lg-block"></div>
        </div>
      </nav>
      <div class="container mt-3">
        <div class="row align-items-center g-2">
          <div class="col">
            <input type="text" id="searchInput" class="form-control" placeholder="Search" onkeyup="if(event.key==='Enter')searchPages()">
          </div>
          <div class="col-auto">
            <div class="d-flex flex-wrap align-items-center gap-2 control-toolbar p-2 rounded">
              <button id="contrastToggle" type="button"
                class="nhs-contrast-toggle"
                aria-pressed="false" aria-label="Toggle high contrast mode">
                <span class="contrast-toggle-icon" aria-hidden="true">◑</span>
                <span class="contrast-toggle-label">High Contrast</span>
              </button>
              <div class="btn-group btn-group-sm" role="group" aria-label="Text Size">
                <button onclick="setTextSize('scale-small')" class="btn btn-outline-secondary">A–</button>
                <button onclick="setTextSize('scale-medium')" class="btn btn-outline-secondary">A</button>
                <button onclick="setTextSize('scale-large')" class="btn btn-outline-secondary">A+</button>
                <button onclick="setTextSize('scale-xlarge')" class="btn btn-outline-secondary">A++</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>`;

  const mount = document.getElementById("header-mount");
  if (mount) mount.innerHTML = headerHTML;

  // Wire up theme selector after injection
  initThemeSelector();
}

/**
 * Shared footer component — injected into every page.
 */
function injectFooter() {
  const footerHTML = `
  <footer class="mt-auto py-5 border-top bg-light">
    <div class="container text-center">
      <div class="row mb-4">
        <div class="col">
          <img src="https://assets.codepen.io/8889025/RDaSH_LMRH4.png" class="footer-logo"
            style="max-height: 100px; opacity: 1;">
        </div>
      </div>
      <div class="row mb-3">
        <div class="col">
          <h6 class="text-uppercase fw-bold text-info mb-1" style="font-size: 0.75rem; letter-spacing: 2px;">
            RDaSH Learning Matters
          </h6>
          <p class="small text-muted mb-0">Learning Resource Hub &copy; 2026</p>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <button class="btn btn-sm btn-outline-secondary rounded-pill px-3"
            onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
            <i class="bi bi-arrow-up me-1"></i> Back to Top
          </button>
        </div>
      </div>
    </div>
  </footer>`;

  const mount = document.getElementById("footer-mount");
  if (mount) mount.innerHTML = footerHTML;
}

/**
 * Shared class modal — injected into every page that needs it.
 */
function injectClassModal() {
  const modalHTML = `
  <div class="modal fade" id="classModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4">
        <div class="modal-header border-0 pb-0">
          <div class="d-flex align-items-center">
            <div class="bg-primary bg-opacity-10 p-2 rounded-3 me-3">
              <i class="bi bi-journal-bookmark-fill text-primary fs-4"></i>
            </div>
            <h5 class="modal-title fw-bold text-dark" id="modalTitle">Course Details</h5>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <div id="modalDetails"></div>
        </div>
        <div class="modal-footer border-0 pt-0 pb-4 px-4 justify-content-between">
          <button type="button" class="btn btn-light rounded-pill px-4 text-muted fw-bold" data-bs-toggle="modal"
            data-bs-target="#classModal">
            <i class="bi bi-x-lg me-1"></i> Close
          </button>
          <a id="modalLink" href="#" target="_blank" class="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm"
            style="display:none;">
            Book on ESR <i class="bi bi-arrow-right-short ms-1"></i>
          </a>
        </div>
      </div>
    </div>
  </div>`;

  const mount = document.getElementById("modal-mount");
  if (mount) mount.innerHTML = modalHTML;
}