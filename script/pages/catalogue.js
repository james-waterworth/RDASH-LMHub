/**
 * COURSE CATALOGUE PAGE (Calendar + Prospectus)
 * Contains both the FullCalendar view and the A-Z prospectus.
 */

async function initCataloguePage() {
  injectHeader("catalogue");
  injectFooter();
  injectClassModal();
  applySavedPreferences();

  await loadData({
    classes: CONFIG.files.classes,
    descriptions: CONFIG.files.descriptions,
    videoVault: null,
    rooms: null,
    qi: null,
  });

  renderCatalogue(globalRawClasses, globalRawDescs);
  initCalendar();
  setupAlphabetNav();
}

/**
 * Render the course prospectus list.
 */
function renderCatalogue(classList, courseDescs) {
  const container = document.getElementById("courseList");
  if (!container) return;

  if (courseDescs.length === 0) {
    container.innerHTML = `<div class="col-12 text-center py-5"><i class="bi bi-search display-3 text-muted"></i><h4 class="mt-3">No matching courses.</h4></div>`;
    return;
  }

  const groups = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  courseDescs.forEach((d) => {
    const name = (d.Course || d.Title || "").trim();
    if (name) groups[name] = { info: d, sessions: [] };
  });

  classList.forEach((s) => {
    const name = (s.Course || "").trim();
    let targetGroup = groups[name];
    if (!targetGroup) {
      const normName = utils.normalizeTitle(name);
      for (const k in groups) {
        if (utils.normalizeTitle(k) === normName) {
          targetGroup = groups[k];
          break;
        }
      }
    }
    if (targetGroup && utils.excelToJS(s["Start Date"]) >= today) {
      targetGroup.sessions.push(s);
    }
  });

  container.innerHTML = Object.values(groups)
    .sort((a, b) =>
      utils
        .cleanTitle(a.info.Course)
        .localeCompare(utils.cleanTitle(b.info.Course)),
    )
    .map((group, idx) => {
      const id = `courseCollapse_${idx}`;
      const sessionCount = group.sessions.length;
      const cleanCourseName = utils.cleanTitle(group.info.Course);

      const hasLink =
        group.info.CourseLink &&
        group.info.CourseLink !== "#" &&
        group.info.CourseLink !== "awaiting link";

      return `<div class="card mb-3 border border-info-subtle bg-info-subtle shadow-sm prospectus-card">
    <button class="btn w-100 text-start p-3 d-flex justify-content-between align-items-center bg-info-subtle text-info-emphasis border-0" data-bs-toggle="collapse" data-bs-target="#${id}">
        <div>
            <span class="fw-bold d-block">${cleanCourseName}</span>
            <small class="text-info-emphasis opacity-75">${group.info.Trainer || "Self-Directed"}</small>
        </div>
        <span class="badge ${sessionCount > 0 ? "bg-primary text-white" : "bg-light text-muted border"} rounded-pill px-3 py-2 fw-bold shadow-sm" style="font-size: 0.85rem;"><i class="bi ${sessionCount > 0 ? (sessionCount === 1 ? "bi-calendar-check" : "bi-calendar-event") : "bi-calendar-x"} me-1"></i>${sessionCount === 1 ? "1 Available Date" : sessionCount > 1 ? sessionCount + " Dates" : "0 Dates"}</span>
    </button>
    <div class="collapse" id="${id}">
        <div class="card-body bg-white border-top border-info-subtle">
    <div class="mb-3">
        <span class="badge bg-light text-dark border small"><i class="bi bi-people me-1"></i> Audience: ${group.info.TargetAudience || "General"}</span>
    </div>
    <p class="small text-dark mb-3" style="white-space: pre-line;">${group.info.Description}</p>
            ${
              sessionCount > 0
                ? `
                <div class="table-responsive">
                    <table class="table table-sm table-hover bg-white rounded mb-0 align-middle">
                        <thead class="small bg-info-subtle text-info-emphasis">
                            <tr>
                                <th class="ps-2">Date</th>
                                <th>Time</th>
                                <th>Venue</th>
                                <th class="text-end pe-2">ESR</th>
                            </tr>
                        </thead>
                        <tbody class="small">
                            ${group.sessions
                              .map(
                                (s) => `
                                <tr>
                                    <td class="fw-bold ps-2 text-primary" style="font-size: 0.95rem;"><span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i class="bi bi-calendar3 me-1"></i>${utils.formatDate(utils.excelToJS(s["Start Date"]))}</span></td>
                                    <td>${s["Start Time"] || "TBD"} - ${s["End Time"] || "TBD"}</td>
                                    <td>${utils.getVenue(s)}</td>
                                    <td class="text-end pe-2">
                                        <a href="${s["Offering link"] || s["Offering Link"] || group.info.CourseLink || "#"}" target="_blank" class="btn btn-sm btn-info text-white py-0 px-3 fw-bold">Book</a>
                                    </td>
                                </tr>`,
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
                ${(group.info.ExternalLink || group.info.ESRLink || group.info.UserGuideLink || group.info.VideoLink) ?
                  `<div class="mt-3 p-2 bg-light rounded border">
                    ${generateActionButtons({...group.info, CourseLink: ""}, "btn-info")}
                   </div>` : ""
                }
                `
                : `
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center bg-info-subtle p-3 rounded border border-info-subtle">
                    <span class="small text-info-emphasis mb-2 mb-md-0">No live dates currently scheduled.</span>
                    <div class="d-flex flex-wrap">
                    ${
                      (hasLink || group.info.ExternalLink || group.info.ESRLink || group.info.UserGuideLink || group.info.VideoLink)
                        ? generateActionButtons(group.info, "btn-info")
                        : `<span class="small fst-italic text-info-emphasis">Contact L&D for dates</span>`
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

/**
 * Prospectus search & alphabet logic.
 */
function filterProspectus(query) {
  if (!query || query === "") {
    renderCatalogue(globalRawClasses, globalRawDescs);
    return;
  }

  const term = query.toLowerCase();

  const filtered = globalRawDescs.filter((d) => {
    const title = utils.cleanTitle(d.Course || d.Title || "").toLowerCase();
    const desc = (d.Description || "").toLowerCase();
    return query.length === 1
      ? title.startsWith(term)
      : title.includes(term) || desc.includes(term);
  });

  renderCatalogue(globalRawClasses, filtered);
}

function setupAlphabetNav() {
  const nav = document.querySelector(".alphabet-nav");
  if (!nav) return;
  nav.innerHTML =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      .split("")
      .map(
        (l) =>
          `<button class="btn btn-sm btn-outline-light border-0" onclick="filterProspectus('${l}')">${l}</button>`,
      )
      .join("") +
    `<button class="btn btn-sm btn-info ms-2 rounded-pill" onclick="filterProspectus('')">ALL</button>`;
}

/**
 * FullCalendar initialization.
 */
function initCalendar() {
  const el = document.getElementById("calendar");
  if (!el || calendar) return;
  calendar = new FullCalendar.Calendar(el, {
    initialView: "listMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "listMonth,dayGridMonth,listYear",
    },
    buttonText: {
      today: "Today",
      listMonth: "Agenda List",
      dayGridMonth: "Month Grid",
      listYear: "Full Year",
    },
    views: {
      listMonth: { buttonText: "Agenda List" },
      dayGridMonth: { buttonText: "Month Grid", dayMaxEvents: 3, moreLinkClick: "popover" },
      listYear: { buttonText: "Full Year" },
    },
    dayMaxEvents: 3,
    moreLinkClick: "popover",
    navLinks: true,
    eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
    noEventsContent: "No sessions found matching your selected filters.",
    events: (info, success) => {
      success(getFilteredCalendarEvents());
    },
    eventClick: (info) => {
      info.jsEvent.preventDefault();
      showEventDetailsFromData(null, info.event.extendedProps);
    },
  });
  calendar.render();
}

function getFilteredCalendarEvents() {
  const q = (document.getElementById("calendarSearch")?.value || "").toLowerCase().trim();
  const cat = (document.getElementById("calendarCategoryFilter")?.value || "").toLowerCase().trim();
  const mode = (document.getElementById("calendarModeFilter")?.value || "").toLowerCase().trim();

  return allEvents.filter((ev) => {
    const props = ev.extendedProps || {};
    const title = (ev.title || "").toLowerCase();
    const course = (props.Course || "").toLowerCase();
    const trainer = (props.Trainer || "").toLowerCase();
    const category = (props.Category || "").toLowerCase();
    const venue = utils.getVenue(ev).toLowerCase();

    const matchesQuery =
      !q ||
      title.includes(q) ||
      course.includes(q) ||
      trainer.includes(q) ||
      venue.includes(q) ||
      category.includes(q);

    const matchesCat = !cat || category.includes(cat);

    let matchesMode = true;
    if (mode === "online") {
      matchesMode =
        venue.includes("online") ||
        venue.includes("virtual") ||
        venue.includes("webinar") ||
        venue.includes("teams") ||
        venue.includes("video") ||
        venue.includes("workplace");
    } else if (mode === "venue") {
      matchesMode =
        !venue.includes("online") &&
        !venue.includes("virtual") &&
        !venue.includes("webinar") &&
        !venue.includes("teams") &&
        !venue.includes("video");
    }

    return matchesQuery && matchesCat && matchesMode;
  });
}

function filterCalendar() {
  const filtered = getFilteredCalendarEvents();
  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(filtered);
  }
  renderUpcomingList("upcomingListCatalogue", filtered);
}