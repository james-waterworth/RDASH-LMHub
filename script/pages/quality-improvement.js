/**
 * QUALITY IMPROVEMENT PAGE
 */

async function initQIPage() {
  injectHeader("qi");
  injectFooter();
  injectClassModal();
  applySavedPreferences();

  await loadData({
    classes: CONFIG.files.classes,
    descriptions: null,
    videoVault: null,
    rooms: null,
    qi: CONFIG.files.qi,
  });

  renderQI(globalQualityImprovement);
}

function renderQI(qiData) {
  const container = document.getElementById("qiContentList");
  const alphaContainer = document.getElementById("qiAlphabetNav");
  if (!container) return;

  if (qiData.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-5"><h4 class="text-muted">No QI resources found.</h4></div>`;
    return;
  }

  if (alphaContainer) {
    alphaContainer.innerHTML =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .split("")
        .map(
          (l) =>
            `<button class="btn btn-sm text-white fw-bold border-0 p-1" onclick="filterQIByLetter('${l}')">${l}</button>`,
        )
        .join("") +
      `<button class="btn btn-sm btn-light ms-2 rounded-pill" style="color: #6f42c1;" onclick="filterQIByLetter('ALL')">ALL</button>`;
  }

  container.innerHTML = qiData
    .sort((a, b) =>
      utils
        .cleanTitle(a.Course || a.Title)
        .localeCompare(utils.cleanTitle(b.Course || b.Title)),
    )
    .map((item, idx) => {
      const id = `qiCollapse_${idx}`;
      const cleanName = utils.cleanTitle(item.Course || item.Title);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sessions = globalRawClasses.filter(s => {
          const sName = utils.normalizeTitle(s.Course || "");
          const iName = utils.normalizeTitle(item.Course || item.Title || "");
          return sName === iName && utils.excelToJS(s["Start Date"]) >= today;
      });
      const sessionCount = sessions.length;

      const hasLink =
        item.CourseLink &&
        item.CourseLink !== "#" &&
        item.CourseLink !== "awaiting link";

      return `
<div class="card mb-3 border shadow-sm prospectus-card" style="border-left: 5px solid #6f42c1 !important; background-color: #f9f6ff;">
  <button class="btn w-100 text-start p-3 d-flex justify-content-between align-items-center border-0"
          style="background-color: #f9f6ff;" data-bs-toggle="collapse" data-bs-target="#${id}">
      <div>
          <span class="fw-bold d-block text-dark">${cleanName}</span>
          <small class="text-muted opacity-75">${item.Trainer || "Self-Directed"}</small>
      </div>
      ${sessionCount > 0 ? `<span class="badge rounded-pill text-white px-3 py-2 fw-bold shadow-sm" style="background-color: #6f42c1; font-size: 0.85rem;"><i class="bi ${sessionCount === 1 ? "bi-calendar-check" : "bi-calendar-event"} me-1"></i>${sessionCount === 1 ? "1 Available Date" : sessionCount + " Dates"}</span>` : `<i class="bi bi-chevron-down fs-5" style="color: #6f42c1;"></i>`}
  </button>
  <div class="collapse" id="${id}">
      <div class="card-body bg-white border-top">
          <div class="mb-3">
              <span class="badge bg-light text-dark border small"><i class="bi bi-people me-1"></i> Audience: ${item.TargetAudience || "General"}</span>
          </div>
          <p class="small text-dark mb-3" style="white-space: pre-line;">${item.Description || "No description available."}</p>
          ${
            sessionCount > 0
              ? `
              <div class="table-responsive">
                  <table class="table table-sm table-hover bg-white rounded mb-0 align-middle">
                      <thead class="small" style="background-color: #e9dcfc; color: #6f42c1;">
                          <tr>
                              <th class="ps-2">Date</th>
                              <th>Time</th>
                              <th>Venue</th>
                              <th class="text-end pe-2">Book</th>
                          </tr>
                      </thead>
                      <tbody class="small">
                          ${sessions
                            .map(
                              (s) => `
                              <tr>
                                  <td class="fw-bold ps-2" style="font-size: 0.95rem;"><span class="badge px-2 py-1" style="background-color: #f3ebff; color: #6f42c1; border: 1px solid #ebd9fc;"><i class="bi bi-calendar3 me-1"></i>${utils.formatDate(utils.excelToJS(s["Start Date"]))}</span></td>
                                  <td>${s["Start Time"] || "TBD"} - ${s["End Time"] || "TBD"}</td>
                                  <td>${utils.getVenue(s)}</td>
                                  <td class="text-end pe-2">
                                      <a href="${s["Offering link"] || s["Offering Link"] || item.CourseLink || "#"}" target="_blank" class="btn btn-sm text-white py-0 px-3 fw-bold" style="background-color: #6f42c1; border-color: #6f42c1;">Book</a>
                                  </td>
                              </tr>`,
                            )
                            .join("")}
                      </tbody>
                  </table>
              </div>
              ${(item.ExternalLink || item.ESRLink || item.UserGuideLink || item.VideoLink) ?
                `<div class="mt-3 p-2 rounded border" style="background-color: #f9f6ff; border-color: #e9dcfc;">
                  ${generateActionButtons({...item, CourseLink: ""}, "btn-primary")}
                 </div>` : ""
              }
              `
              : `
              <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-3 rounded" style="background-color: #f9f6ff; border: 1px solid #e9dcfc;">
                  <span class="small text-muted mb-2 mb-md-0">No live dates currently scheduled.</span>
                  <div class="d-flex flex-wrap">
                  ${
                    (hasLink || item.ExternalLink || item.ESRLink || item.UserGuideLink || item.VideoLink)
                      ? generateActionButtons(item, "btn-primary")
                      : `<span class="small fst-italic text-muted">Contact L&D for dates</span>`
                  }
                  </div>
              </div>`
          }
      </div>
  </div>
</div>`;
    })
    .join("");
}

function filterQI() {
  const query = document.getElementById("qiSearchInput").value.toLowerCase();
  const filtered = globalQualityImprovement.filter((d) => {
    const title = utils.cleanTitle(d.Course || d.Title).toLowerCase();
    const desc = (d.Description || "").toLowerCase();
    return title.includes(query) || desc.includes(query);
  });
  renderQI(filtered);
}

function filterQIByLetter(letter) {
  const query = letter === "ALL" ? "" : letter.toLowerCase();
  const filtered = globalQualityImprovement.filter((d) => {
    const title = utils.cleanTitle(d.Course || d.Title).toLowerCase();
    return query === "" ? true : title.startsWith(query);
  });
  renderQI(filtered);
}