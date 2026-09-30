/**
 * TRAINING ROOMS PAGE
 */

async function initRoomsPage() {
  injectHeader("rooms");
  injectFooter();
  applySavedPreferences();

  await loadData({
    classes: null,
    descriptions: null,
    videoVault: null,
    rooms: CONFIG.files.rooms,
    qi: null,
  });

  setupRoomSearch();
  filterRooms();
}

function renderRoomDirectory(rooms) {
  const tbody = document.getElementById("mrTableBody");
  if (!tbody) return;

  tbody.innerHTML = rooms
    .map(
      (room) => `
    <tr>
      <td class="px-4">
        <span class="venue-site-label d-block fw-bold">${room.Site}</span>
        <span class="venue-sub-label small text-muted">${room.Venue}</span>
      </td>
      <td>
        <div class="small text-muted" style="white-space: pre-line; font-size: 0.75rem;">${room.Contact}</div>
      </td>
      <td class="small text-muted">${room.Address}</td>
      <td>
        <div class="fw-bold text-dark">${room.RoomName}</div>
      </td>
      <td class="text-center">
        <span class="capacity-pill badge rounded-pill bg-light text-danger border">${room.Capacity}</span>
      </td>
    </tr>`,
    )
    .join("");
}

function setupRoomSearch() {
  const input = document.getElementById("mrSearchInput");
  if (input) {
    input.addEventListener("input", () => filterRooms());
  }
}

function filterByVenueType(type, btn) {
  document
    .querySelectorAll(".venue-filter-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  currentVenueCategory = type === "trust" ? "internal" : "external";

  document.getElementById("mrSearchInput").value = "";
  filterRooms();
}

function filterRooms() {
  const query = document.getElementById("mrSearchInput").value.toLowerCase();
  const tbody = document.getElementById("mrTableBody");
  const table = document.getElementById("mrTable");
  const noResults = document.getElementById("mrNoResults");

  if (!globalRawRooms || globalRawRooms.length === 0) return;

  const filtered = globalRawRooms.filter((room) => {
    const categoryMatch = room.Type === currentVenueCategory;
    const searchMatch =
      (room.Site || "").toLowerCase().includes(query) ||
      (room.Venue || "").toLowerCase().includes(query) ||
      (room.RoomName || "").toLowerCase().includes(query);
    return categoryMatch && searchMatch;
  });

  renderRoomDirectory(filtered);

  if (filtered.length === 0) {
    noResults.classList.remove("d-none");
    table.classList.add("d-none");
  } else {
    noResults.classList.add("d-none");
    table.classList.remove("d-none");
  }
}