/**
 * DATA LOADER & SHARED RENDERING
 * Fetches JSON data files and prepares them for use by page-specific JS.
 * Also contains shared rendering functions used by multiple pages.
 */

/**
 * Fetch all data files. Returns an object with the loaded data.
 * Individual pages call this to get the data they need.
 */
async function loadData(filesToLoad = null) {
  const files = filesToLoad || CONFIG.files;

  const fetchOne = async (url) => {
    try {
      const res = await fetch(`${url}?v=${Date.now()}`);
      return res.ok ? await res.json() : [];
    } catch (e) {
      console.warn(`⚠️ Failed to load ${url}:`, e);
      return [];
    }
  };

  const [classes, descs, videoVault, rooms, qi] = await Promise.all([
    files.classes ? fetchOne(files.classes) : [],
    files.descriptions ? fetchOne(files.descriptions) : [],
    files.videoVault ? fetchOne(files.videoVault) : [],
    files.rooms ? fetchOne(files.rooms) : [],
    files.qi ? fetchOne(files.qi) : [],
  ]);

  globalRawClasses = classes;
  globalRawDescs = descs;
  globalVideoVault = videoVault;
  globalQualityImprovement = qi;

  // Flatten room data
  globalRawRooms = [];
  const siteOrder = { scunthorpe: 1, rotherham: 2, doncaster: 3 };

  rooms.forEach((venue) => {
    if (venue.rooms && Array.isArray(venue.rooms)) {
      venue.rooms.forEach((room) => {
        globalRawRooms.push({
          Site: venue.site || "N/A",
          Venue: venue.venue || "N/A",
          Type: (venue.type || "internal").toLowerCase(),
          Contact: venue.contact || "N/A",
          Address: venue.address || "N/A",
          RoomName: room.n || "N/A",
          Capacity: room.c || "N/A",
          ContactEmail:
            venue.contact && venue.contact.includes("@")
              ? venue.contact.split("\n").find((s) => s.includes("@"))
              : "#",
        });
      });
    }
  });

  globalRawRooms.sort((a, b) => {
    const siteA = a.Site.toLowerCase();
    const siteB = b.Site.toLowerCase();

    const getRank = (name) => {
      if (name.includes("scunthorpe")) return 1;
      if (name.includes("rotherham")) return 2;
      if (name.includes("doncaster") || name.includes("tickhill road")) return 3;
      return 999;
    };

    const rankA = getRank(siteA);
    const rankB = getRank(siteB);

    if (rankA !== rankB) return rankA - rankB;
    return siteA.localeCompare(siteB);
  });

  // Build allEvents from classes + descriptions
  const descMap = new Map();
  globalRawDescs.forEach((d) => {
    const key = (d.Course || d.Title || "").trim().toLowerCase();
    if (key) descMap.set(key, d);
    const cleanKey = utils.cleanTitle(d.Course || d.Title || "").toLowerCase();
    if (cleanKey && !descMap.has(cleanKey)) descMap.set(cleanKey, d);
    const normKey = utils.normalizeTitle(d.Course || d.Title || "");
    if (normKey && !descMap.has(normKey)) descMap.set(normKey, d);
  });

  allEvents = globalRawClasses
    .map((item) => {
      const start = utils.excelToJS(item["Start Date"]);
      const end = utils.excelToJS(item["End Date"]);

      if (item["Start Time"] && !isNaN(start.getTime())) {
        const [h, m] = String(item["Start Time"]).split(":").map(Number);
        start.setHours(h || 0, m || 0, 0, 0);
      }
      if (item["End Time"] && !isNaN(end.getTime())) {
        const [h, m] = String(item["End Time"]).split(":").map(Number);
        end.setHours(h || 0, m || 0, 0, 0);
      }

      const courseKey = String(item.Course || "").trim().toLowerCase();
      const cleanKey = utils.cleanTitle(item.Course || "").toLowerCase();
      const normKey = utils.normalizeTitle(item.Course || "");
      const info = descMap.get(courseKey) || descMap.get(cleanKey) || descMap.get(normKey) || {};

      return {
        title: utils.cleanTitle(item.Course || item.Title || "Untitled Course"),
        start: start,
        end: end,
        extendedProps: {
          ...item,
          Description: info.Description || "No description available.",
          TargetAudience: info.TargetAudience || "General Audience",
          Trainer: info.Trainer || "TBD",
          CourseLink: item["Offering link"] || item["Offering Link"] || info.CourseLink || "#",
        },
      };
    })
    .filter((ev) => !isNaN(ev.start.getTime()));

  // Deduplicate events
  const seenEventKeys = new Set();
  allEvents = allEvents.filter((ev) => {
    const key = `${ev.title.toLowerCase()}|${ev.start.getTime()}`;
    if (seenEventKeys.has(key)) return false;
    seenEventKeys.add(key);
    return true;
  });

  return { classes, descs, videoVault, rooms, qi };
}

/**
 * Generate action buttons for a course/video/QI item.
 * Used by catalogue, video vault, and QI pages.
 */
function generateActionButtons(item, primaryColorClass = "btn-info") {
  let buttons = "";

  // Primary link (CourseLink)
  if (item.CourseLink && item.CourseLink !== "#" && item.CourseLink !== "awaiting link" && item.CourseLink !== "") {
    let btnText = "View Here";
    let lowerLink = item.CourseLink.toLowerCase();

    if (item.CourseButtonText) {
      btnText = item.CourseButtonText;
    } else if (lowerLink.includes("my.esr.nhs.uk")) {
      btnText = "ESR Enrolment";
    } else if (lowerLink.includes("youtu") || lowerLink.includes("vimeo")) {
      btnText = "Watch Video";
    } else if (lowerLink.includes("intranet.rdash")) {
      btnText = "Intranet Link";
    } else if (lowerLink.includes("staffportal")) {
      btnText = "Staff Portal";
    } else if (lowerLink.includes("alison")) {
      btnText = "Learning Platform";
    }

    buttons += `<a href="${item.CourseLink}" target="_blank" class="btn btn-sm ${primaryColorClass} text-white px-3 me-2 mb-1 fw-bold">${btnText}</a>`;
  }

  // Video link
  if (item.VideoLink) {
    let videoBtnText = "Watch Video";
    let lowerVid = item.VideoLink.toLowerCase();
    if (lowerVid.includes("playlist") || lowerVid.includes("list=")) {
      videoBtnText = "Watch Videos";
    }
    buttons += `<a href="${item.VideoLink}" target="_blank" class="btn btn-sm btn-warning text-dark px-3 me-2 mb-1 fw-bold"><i class="bi bi-play-circle-fill me-1"></i>${videoBtnText}</a>`;
  }

  // External link
  if (item.ExternalLink) {
    let extText = item.ExternalButtonText || "Platform Link";
    buttons += `<a href="${item.ExternalLink}" target="_blank" class="btn btn-sm btn-outline-secondary px-3 me-2 mb-1 fw-bold"><i class="bi bi-box-arrow-up-right me-1"></i>${extText}</a>`;
  }

  // Self-Directed ESR link
  if (item.ESRLink) {
    let esrText = item.ESRButtonText || "Record External Learning";
    buttons += `<a href="${item.ESRLink}" target="_blank" class="btn btn-sm btn-primary text-white px-3 me-2 mb-1 fw-bold"><i class="bi bi-person-workspace me-1"></i>${esrText}</a>`;
  }

  // User Guide link
  if (item.UserGuideLink) {
    if (item.UserGuideLink.startsWith("#")) {
      buttons += `<a href="${item.UserGuideLink.substring(1)}.html" class="btn btn-sm btn-success text-white px-3 me-2 mb-1 fw-bold"><i class="bi bi-journal-text me-1"></i>User Guide</a>`;
    } else {
      buttons += `<a href="${item.UserGuideLink}" target="_blank" class="btn btn-sm btn-success text-white px-3 me-2 mb-1 fw-bold"><i class="bi bi-journal-text me-1"></i>User Guide</a>`;
    }
  }

  return buttons;
}

/**
 * Render upcoming list — used by home page and calendar page.
 */
function renderUpcomingList(containerId, eventsSource = allEvents) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoMonthsLater = new Date();
  twoMonthsLater.setDate(today.getDate() + 60);

  const upcoming = eventsSource
    .filter((ev) => ev.start >= today && ev.start <= twoMonthsLater)
    .sort((a, b) => a.start - b.start);

  if (upcoming.length === 0) {
    container.innerHTML =
      '<div class="p-4 text-center text-muted">No sessions in the next 2 months.</div>';
    return;
  }

  const isCataloguePage = containerId === "upcomingListCatalogue";

  container.innerHTML = upcoming
    .map((ev) => {
      const eventIndex = allEvents.indexOf(ev);
      const sTime = ev.extendedProps["Start Time"] || "--:--";
      const eTime = ev.extendedProps["End Time"] || "--:--";
      const cleanTitle = utils.cleanTitle(ev.title);
      const hasTime =
        ev.extendedProps["Start Time"] || ev.extendedProps["End Time"];

      if (isCataloguePage) {
        return `
  <div class="card border-0 shadow-sm flex-shrink-0" style="width: 340px; cursor: pointer; border-left: 5px solid #0dcaf0 !important;" onclick="showEventDetailsFromData(${eventIndex})">
    <div class="card-body p-4">
      <span class="badge bg-soft-primary text-primary mb-3 fs-5 px-3 py-2 rounded-pill">${utils.formatDate(ev.start)}</span>
      <div class="fw-bold text-dark fs-4 mb-3 text-truncate-2" style="height: 75px; line-height: 1.2;">${cleanTitle}</div>
      ${hasTime ? `<div class="text-info fw-bold mb-2 fs-5"><i class="bi bi-clock me-2"></i>${sTime}-${eTime}</div>` : ""}
      <div class="text-muted fs-6"><i class="bi bi-geo-alt me-2"></i>${utils.getVenue(ev)}</div>
    </div>
  </div>`;
      }
      return `
<button class="list-group-item list-group-item-action border-0 border-bottom py-3" onclick="showEventDetailsFromData(${eventIndex})">
    <div class="fw-bold small text-truncate">${cleanTitle}</div>
    <div class="d-flex justify-content-between mt-1">
      <span class="badge bg-light text-primary border">${utils.formatDate(ev.start)}</span>
      ${hasTime ? `<small class="text-info fw-bold">${sTime}-${eTime}</small>` : ""}
    </div>
</button>`;
    })
    .join("");

  if (!isCataloguePage)
    container.innerHTML = `<div class="list-group list-group-flush">${container.innerHTML}</div>`;
}

/**
 * Show event details in the class modal.
 * Shared between calendar, catalogue, and home pages.
 */
function showEventDetailsFromData(idx, directData) {
  const data = directData || allEvents[idx]?.extendedProps;
  if (!data) return;

  const modal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("classModal"),
  );
  const url = (data.CourseLink || data["Offering link"] || data["Offering Link"] || "").trim();

  const linkEl = document.getElementById("modalLink");
  if (linkEl) {
    linkEl.href = url;
    linkEl.style.display = url && url !== "#" ? "inline-block" : "none";
  }

  const cleanTitle = utils.cleanTitle(data.Course || data.title);

  document.getElementById("modalDetails").innerHTML = `
    <div class="mb-4">
        <h3 class="fw-bold text-primary mb-2">${cleanTitle}</h3>
        <p class="text-dark lead mb-4" style="white-space: pre-line; font-size: 1rem;">${data.Description}</p>
    </div>
    <div class="row g-3 mb-4">
        <div class="col-sm-6">
            <div class="p-3 bg-light rounded-3 h-100 border-start border-primary border-4">
                <small class="text-uppercase fw-bold text-muted d-block mb-1" style="font-size: 0.7rem;">Instructor</small>
                <div class="fw-bold"><i class="bi bi-person-badge me-2"></i>${data.Trainer || "TBD"}</div>
            </div>
        </div>
        <div class="col-sm-6">
            <div class="p-3 bg-light rounded-3 h-100 border-start border-success border-4">
                <small class="text-uppercase fw-bold text-muted d-block mb-1" style="font-size: 0.7rem;">Target Audience</small>
                <div class="fw-bold"><i class="bi bi-people me-2"></i>${data.TargetAudience || "All Staff"}</div>
            </div>
        </div>
    </div>
    <div class="card border-0 bg-light p-3">
        <div class="row small text-muted">
            ${
              data["Start Time"] || data["End Time"]
                ? `<div class="col-6 mb-2"><strong><i class="bi bi-clock me-1"></i> Time:</strong> ${data["Start Time"] || "--:--"} - ${data["End Time"] || "--:--"}</div>`
                : ""
            }
            <div class="col-6 mb-2"><strong><i class="bi bi-geo-alt me-1"></i> Venue:</strong> ${utils.getVenue(data)}</div>
            <div class="col-12"><i class="bi bi-info-circle me-1"></i> <span class="fst-italic">Please ensure you have manager approval before booking on ESR.</span></div>
        </div>
    </div>
  `;

  modal.show();
}

function scrollUpcoming(dist) {
  document
    .getElementById("upcomingListCatalogue")
    ?.scrollBy({ left: dist, behavior: "smooth" });
}