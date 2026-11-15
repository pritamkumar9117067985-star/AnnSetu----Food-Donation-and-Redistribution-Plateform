// ---------- Data (saved in the browser using localStorage) ----------
var STATUS_FLOW = ["Available", "Scheduled", "Collected", "Delivered"];
var donations = load("fd_donations", []);
var volunteers = load("fd_volunteers", []);
var alerts = load("fd_alerts", []);

function load(key, fallback) {
  try {
    var saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveAll() {
  localStorage.setItem("fd_donations", JSON.stringify(donations));
  localStorage.setItem("fd_volunteers", JSON.stringify(volunteers));
  localStorage.setItem("fd_alerts", JSON.stringify(alerts));
}

// Add sample data the first time the page is opened
if (donations.length === 0 && volunteers.length === 0) {
  volunteers.push({ id: 1, name: "Amit Kumar", phone: "9876501234", area: "Model Town" });
  volunteers.push({ id: 2, name: "Neha Singh", phone: "9876505678", area: "Sarabha Nagar" });
  donations.push({
    id: 1, donorName: "Sharma Restaurant", donorType: "Restaurant", phone: "9812345678",
    foodItem: "Rice and dal", category: "Cooked meals", quantity: 40,
    location: "Model Town, Ludhiana", pickupTime: "2026-11-09T20:00", notes: "Veg only",
    status: "Available", volunteerId: null
  });
  donations.push({
    id: 2, donorName: "Grand Hotel", donorType: "Hotel", phone: "9811122233",
    foodItem: "Bread and buns", category: "Bakery", quantity: 25,
    location: "Ferozepur Road, Ludhiana", pickupTime: "2026-11-09T18:30", notes: "",
    status: "Delivered", volunteerId: 1
  });
  saveAll();
}

// ---------- Small helpers ----------
function $(id) { return document.getElementById(id); }

// Stops user text from being treated as HTML
function esc(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function nextId(list) {
  var max = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id > max) max = list[i].id;
  }
  return max + 1;
}

function showMessage(text, type) {
  var box = $("message");
  box.textContent = text;
  box.className = "message " + type;
  setTimeout(function () { box.className = "message hidden"; }, 4000);
}

function addAlert(text) {
  alerts.unshift({ text: text, time: new Date().toLocaleString("en-IN") });
  saveAll();
}

function findVolunteer(id) {
  for (var i = 0; i < volunteers.length; i++) {
    if (volunteers[i].id === id) return volunteers[i];
  }
  return null;
}

// ---------- Page navigation ----------
var navButtons = document.querySelectorAll("#nav button");
var pageLinks = document.querySelectorAll(".page-link, .brand[data-page]");
var menuToggle = $("menuToggle");
for (var i = 0; i < navButtons.length; i++) {
  navButtons[i].addEventListener("click", function () {
    showPage(this.getAttribute("data-page"));
  });
}

for (var k = 0; k < pageLinks.length; k++) {
  pageLinks[k].addEventListener("click", function () {
    var status = this.getAttribute("data-status");
    if (status !== null) $("filterStatus").value = status;
    showPage(this.getAttribute("data-page"));
  });
}

menuToggle.addEventListener("click", function () {
  var isOpen = this.getAttribute("aria-expanded") === "true";
  this.setAttribute("aria-expanded", String(!isOpen));
  $("nav").classList.toggle("open", !isOpen);
});

var posterDialog = $("posterDialog");
var posterDialogTitle = $("posterDialogTitle");
var posterDialogImage = $("posterDialogImage");
var posterButtons = document.querySelectorAll(".poster-open");
for (var p = 0; p < posterButtons.length; p++) {
  posterButtons[p].addEventListener("click", function () {
    posterDialogTitle.textContent = this.getAttribute("data-title");
    posterDialogImage.src = this.getAttribute("data-image");
    posterDialogImage.alt = this.getAttribute("data-alt");
    posterDialog.showModal();
  });
}

$("closePosterDialog").addEventListener("click", function () {
  posterDialog.close();
});

posterDialog.addEventListener("click", function (event) {
  if (event.target === posterDialog) posterDialog.close();
});

function showPage(name) {
  var pages = document.querySelectorAll(".page");
  for (var i = 0; i < pages.length; i++) pages[i].classList.add("hidden");
  $(name).classList.remove("hidden");

  for (var j = 0; j < navButtons.length; j++) {
    var active = navButtons[j].getAttribute("data-page") === name;
    navButtons[j].classList.toggle("active", active);
    if (active) navButtons[j].setAttribute("aria-current", "page");
    else navButtons[j].removeAttribute("aria-current");
  }
  $("nav").classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  renderAll();
  if (name === "donations") renderDonations();
  window.scrollTo(0, 0);
}

// ---------- Validation ----------
function clearErrors(form) {
  var errors = form.querySelectorAll(".field-error");
  for (var i = 0; i < errors.length; i++) errors[i].remove();
  var bad = form.querySelectorAll(".invalid");
  for (var j = 0; j < bad.length; j++) bad[j].classList.remove("invalid");
}

function fieldError(id, text) {
  var field = $(id);
  field.classList.add("invalid");
  var p = document.createElement("div");
  p.className = "field-error";
  p.textContent = text;
  field.parentNode.insertBefore(p, field.nextSibling);
}

function validPhone(p) { return /^[6-9][0-9]{9}$/.test(p); }

function validateDonation(isNew) {
  clearErrors($("donationForm"));
  var ok = true;

  if ($("donorName").value.trim().length < 2) { fieldError("donorName", "Enter the donor name."); ok = false; }
  if ($("donorType").value === "") { fieldError("donorType", "Choose a donor type."); ok = false; }
  if (!validPhone($("phone").value.trim())) { fieldError("phone", "Enter a valid 10-digit mobile number."); ok = false; }
  if ($("foodItem").value.trim() === "") { fieldError("foodItem", "Enter the food item."); ok = false; }
  if ($("category").value === "") { fieldError("category", "Choose a category."); ok = false; }

  var qty = Number($("quantity").value);
  if (!qty || qty < 1 || qty % 1 !== 0) { fieldError("quantity", "Enter a whole number of servings, 1 or more."); ok = false; }

  if ($("location").value.trim().length < 5) { fieldError("location", "Enter the full pickup address."); ok = false; }

  var time = $("pickupTime").value;
  if (time === "") {
    fieldError("pickupTime", "Choose a pickup time."); ok = false;
  } else if (isNew && new Date(time) < new Date()) {
    fieldError("pickupTime", "Pickup time must be in the future."); ok = false;
  }
  return ok;
}

// ---------- Donation form ----------
$("donationForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var editId = $("editId").value;
  if (!validateDonation(editId === "")) {
    showMessage("Please fix the highlighted fields.", "error");
    return;
  }

  var data = {
    donorName: $("donorName").value.trim(),
    donorType: $("donorType").value,
    phone: $("phone").value.trim(),
    foodItem: $("foodItem").value.trim(),
    category: $("category").value,
    quantity: Number($("quantity").value),
    location: $("location").value.trim(),
    pickupTime: $("pickupTime").value,
    notes: $("notes").value.trim()
  };

  if (editId === "") {
    data.id = nextId(donations);
    data.status = "Available";
    data.volunteerId = null;
    donations.push(data);
    addAlert("New donation: " + data.foodItem + " (" + data.quantity + " servings) from " + data.donorName + ".");
    showMessage("Donation posted. Volunteers can now see it.", "success");
  } else {
    for (var i = 0; i < donations.length; i++) {
      if (donations[i].id === Number(editId)) {
        for (var key in data) donations[i][key] = data[key];
      }
    }
    addAlert("Donation updated: " + data.foodItem + " from " + data.donorName + ".");
    showMessage("Donation updated.", "success");
  }

  saveAll();
  resetForm();
  showPage("donations");
});

function resetForm() {
  $("donationForm").reset();
  $("editId").value = "";
  $("formTitle").textContent = "Post a food donation";
  $("saveBtn").textContent = "Post donation";
  $("cancelEdit").classList.add("hidden");
  clearErrors($("donationForm"));
}

$("cancelEdit").addEventListener("click", function () {
  resetForm();
  showPage("donations");
});

function editDonation(id) {
  for (var i = 0; i < donations.length; i++) {
    var d = donations[i];
    if (d.id === id) {
      $("editId").value = d.id;
      $("donorName").value = d.donorName;
      $("donorType").value = d.donorType;
      $("phone").value = d.phone;
      $("foodItem").value = d.foodItem;
      $("category").value = d.category;
      $("quantity").value = d.quantity;
      $("location").value = d.location;
      $("pickupTime").value = d.pickupTime;
      $("notes").value = d.notes;
      $("formTitle").textContent = "Update donation";
      $("saveBtn").textContent = "Save changes";
      $("cancelEdit").classList.remove("hidden");
      showPage("donate");
    }
  }
}

// ---------- Donation actions ----------
function getDonation(id) {
  for (var i = 0; i < donations.length; i++) {
    if (donations[i].id === id) return donations[i];
  }
  return null;
}

function assignVolunteer(id) {
  var select = $("vol" + id);
  if (select.value === "") {
    showMessage("Choose a volunteer before scheduling the pickup.", "error");
    return;
  }
  var d = getDonation(id);
  var v = findVolunteer(Number(select.value));
  d.volunteerId = v.id;
  d.status = "Scheduled";
  addAlert(v.name + " will pick up " + d.foodItem + " from " + d.donorName + ".");
  saveAll();
  showMessage("Pickup scheduled with " + v.name + ".", "success");
  renderAll();
}

function advanceStatus(id) {
  var d = getDonation(id);
  var index = STATUS_FLOW.indexOf(d.status);
  if (index < STATUS_FLOW.length - 1) {
    d.status = STATUS_FLOW[index + 1];
    addAlert("Status of " + d.foodItem + " is now " + d.status + ".");
    saveAll();
    showMessage("Status changed to " + d.status + ".", "success");
    renderAll();
  }
}

function cancelDonation(id) {
  if (!confirm("Cancel this donation?")) return;
  var d = getDonation(id);
  d.status = "Cancelled";
  addAlert("Donation cancelled: " + d.foodItem + " from " + d.donorName + ".");
  saveAll();
  showMessage("Donation cancelled.", "success");
  renderAll();
}

function deleteDonation(id) {
  if (!confirm("Delete this donation permanently?")) return;
  donations = donations.filter(function (d) { return d.id !== id; });
  saveAll();
  showMessage("Donation deleted.", "success");
  renderAll();
}

// ---------- Rendering: donations ----------
function donationCard(d) {
  var v = findVolunteer(d.volunteerId);
  var html = '<div class="card">';
  html += '<div class="card-head"><h4>' + esc(d.foodItem) + " &ndash; " + d.quantity + ' servings</h4>';
  html += '<span class="status ' + d.status + '">' + d.status + "</span></div>";
  html += "<p>" + esc(d.category) + " &bull; from " + esc(d.donorName) + " (" + esc(d.donorType) + ")</p>";
  html += "<p>Pickup: " + esc(d.location) + "</p>";
  html += "<p>Time: " + formatTime(d.pickupTime) + " &bull; Phone: " + esc(d.phone) + "</p>";
  if (d.notes) html += "<p>Note: " + esc(d.notes) + "</p>";
  if (v) html += "<p>Volunteer: " + esc(v.name) + " (" + esc(v.phone) + ")</p>";

  // progress steps
  var pos = STATUS_FLOW.indexOf(d.status);
  html += '<div class="steps">';
  for (var i = 0; i < STATUS_FLOW.length; i++) {
    html += '<div class="step' + (i <= pos ? " done" : "") + '" title="' + STATUS_FLOW[i] + '"></div>';
  }
  html += "</div>";

  html += '<div class="actions">';
  if (d.status === "Available") {
    html += '<select id="vol' + d.id + '"><option value="">Choose volunteer</option>';
    for (var j = 0; j < volunteers.length; j++) {
      html += '<option value="' + volunteers[j].id + '">' + esc(volunteers[j].name) + " (" + esc(volunteers[j].area) + ")</option>";
    }
    html += "</select>";
    html += '<button onclick="assignVolunteer(' + d.id + ')">Schedule pickup</button>';
  }
  if (d.status === "Scheduled") html += '<button onclick="advanceStatus(' + d.id + ')">Mark as collected</button>';
  if (d.status === "Collected") html += '<button onclick="advanceStatus(' + d.id + ')">Mark as delivered</button>';
  if (d.status === "Available" || d.status === "Scheduled") {
    html += '<button onclick="editDonation(' + d.id + ')">Edit</button>';
    html += '<button onclick="cancelDonation(' + d.id + ')">Cancel</button>';
  }
  html += '<button onclick="deleteDonation(' + d.id + ')">Delete</button>';
  html += "</div></div>";
  return html;
}

function renderDonations() {
  var search = $("searchBox").value.trim().toLowerCase();
  var cat = $("filterCategory").value;
  var status = $("filterStatus").value;
  var html = "";
  var shown = 0;

  for (var i = donations.length - 1; i >= 0; i--) {
    var d = donations[i];
    var text = (d.foodItem + " " + d.donorName + " " + d.location).toLowerCase();
    if (search && text.indexOf(search) === -1) continue;
    if (cat && d.category !== cat) continue;
    if (status === "In progress" && d.status !== "Scheduled" && d.status !== "Collected") continue;
    if (status && status !== "In progress" && d.status !== status) continue;
    html += donationCard(d);
    shown++;
  }
  if (shown === 0) html = '<div class="empty">No donations match. Try clearing the filters or post a new donation.</div>';
  $("donationList").innerHTML = html;
}

// ---------- Rendering: dashboard ----------
function count(status) {
  var n = 0;
  for (var i = 0; i < donations.length; i++) if (donations[i].status === status) n++;
  return n;
}

function renderDashboard() {
  var meals = 0;
  var active = 0;
  var categories = {};
  for (var i = 0; i < donations.length; i++) {
    var d = donations[i];
    if (d.status === "Delivered") meals += d.quantity;
    if (d.status !== "Cancelled") active++;
    categories[d.category] = (categories[d.category] || 0) + 1;
  }

  $("sTotal").textContent = donations.length;
  $("sAvailable").textContent = count("Available");
  $("sScheduled").textContent = count("Scheduled") + count("Collected");
  $("sDelivered").textContent = count("Delivered");
  $("sMeals").textContent = meals;
  $("sVolunteers").textContent = volunteers.length;

  var percent = active === 0 ? 0 : Math.round((count("Delivered") / active) * 100);
  $("progressBar").style.width = percent + "%";
  $("progressBar").parentNode.setAttribute("aria-valuenow", percent);
  $("progressText").textContent = percent + "% of active donations have reached people in need.";

  var bars = "";
  for (var name in categories) {
    var width = Math.round((categories[name] / donations.length) * 100);
    bars += '<div class="bar-row"><span class="bar-label">' + esc(name) + '</span>' +
            '<div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div>' +
            "<span>" + categories[name] + "</span></div>";
  }
  $("categoryBars").innerHTML = bars || '<div class="empty">No data yet.</div>';

  var latest = "";
  var start = Math.max(0, donations.length - 3);
  for (var j = donations.length - 1; j >= start; j--) latest += donationCard(donations[j]);
  $("latestList").innerHTML = latest || '<div class="empty">No donations yet. Use "Post donation" to add the first one.</div>';
}

// ---------- Volunteers ----------
$("volunteerForm").addEventListener("submit", function (e) {
  e.preventDefault();
  clearErrors($("volunteerForm"));
  var ok = true;
  if ($("vName").value.trim().length < 2) { fieldError("vName", "Enter the volunteer name."); ok = false; }
  if (!validPhone($("vPhone").value.trim())) { fieldError("vPhone", "Enter a valid 10-digit mobile number."); ok = false; }
  if ($("vArea").value.trim() === "") { fieldError("vArea", "Enter the area covered."); ok = false; }
  if (!ok) { showMessage("Please fix the highlighted fields.", "error"); return; }

  volunteers.push({
    id: nextId(volunteers),
    name: $("vName").value.trim(),
    phone: $("vPhone").value.trim(),
    area: $("vArea").value.trim()
  });
  saveAll();
  $("volunteerForm").reset();
  showMessage("Volunteer added.", "success");
  renderAll();
});

function removeVolunteer(id) {
  for (var i = 0; i < donations.length; i++) {
    if (donations[i].volunteerId === id && (donations[i].status === "Scheduled" || donations[i].status === "Collected")) {
      showMessage("This volunteer has an active pickup. Finish or cancel it first.", "error");
      return;
    }
  }
  volunteers = volunteers.filter(function (v) { return v.id !== id; });
  saveAll();
  showMessage("Volunteer removed.", "success");
  renderAll();
}

function renderVolunteers() {
  var html = "";
  for (var i = 0; i < volunteers.length; i++) {
    var v = volunteers[i];
    var jobs = 0;
    for (var j = 0; j < donations.length; j++) {
      if (donations[j].volunteerId === v.id && donations[j].status !== "Cancelled") jobs++;
    }
    html += '<div class="card"><div class="card-head"><h4>' + esc(v.name) + "</h4><span>" + jobs + " pickup(s)</span></div>" +
            "<p>Area: " + esc(v.area) + " &bull; Phone: " + esc(v.phone) + "</p>" +
            '<div class="actions"><button onclick="removeVolunteer(' + v.id + ')">Remove</button></div></div>';
  }
  $("volunteerList").innerHTML = html || '<div class="empty">No volunteers yet. Add one using the form above.</div>';
}

// ---------- Alerts ----------
function renderAlerts() {
  var html = "";
  for (var i = 0; i < alerts.length; i++) {
    html += '<div class="alert-item">' + esc(alerts[i].text) + "<small>" + esc(alerts[i].time) + "</small></div>";
  }
  $("alertList").innerHTML = html || '<div class="empty">No alerts yet.</div>';
  $("alertCount").textContent = alerts.length;
}

$("clearAlerts").addEventListener("click", function () {
  alerts = [];
  saveAll();
  renderAll();
  showMessage("Alerts cleared.", "success");
});

// ---------- Filters ----------
function fillCategoryFilter() {
  var options = $("category").options;
  var filter = $("filterCategory");
  for (var i = 1; i < options.length; i++) {
    var opt = document.createElement("option");
    opt.textContent = options[i].textContent;
    filter.appendChild(opt);
  }
}

$("searchBox").addEventListener("input", renderDonations);
$("filterCategory").addEventListener("change", renderDonations);
$("filterStatus").addEventListener("change", renderDonations);

// ---------- Start ----------
function renderAll() {
  renderDashboard();
  renderDonations();
  renderVolunteers();
  renderAlerts();
}

fillCategoryFilter();
renderAll();