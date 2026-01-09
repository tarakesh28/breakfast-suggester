import { getAll, put, remove } from './db.js';
// script.js (DOM-ready, wires all buttons in your current index.html)
// Works with the Node server endpoints if present (/data, /upload-image, /save-data, /deleted, /save-deleted).
const API_PREFIX = ''; // keep empty if same origin (http://localhost:3000)

document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const suggestBtn = document.getElementById("suggest-button");
  const allBtn = document.getElementById("all-breakfasts-button");
  const addBtn = document.getElementById("add-breakfast-button");
  const recentlyDeletedBtn = document.getElementById("recently-deleted-button");
  const breakfastNameEl = document.getElementById("breakfast-name");
  const breakfastImageEl = document.getElementById("breakfast-image");

  const allModal = document.getElementById("all-breakfasts-modal");
  const addModal = document.getElementById("add-breakfast-modal");
  const deletedModal = document.getElementById("deleted-modal");
  const confirmModal = document.getElementById("confirm-modal");

  const breakfastListEl = document.getElementById("breakfast-list");
  const deletedListEl = document.getElementById("deleted-list");

  const addForm = document.getElementById("add-breakfast-form");
  const nameInput = document.getElementById("new-name");
  const fileInput = document.getElementById("image-input");
  const fileDrop = document.getElementById("file-drop");
  const previewWrapper = document.getElementById("preview-wrapper");
  const previewImage = document.getElementById("preview-image");
  const cancelAddBtn = document.getElementById("cancel-add");
  const saveToScriptJsCheckbox = document.getElementById("save-to-scriptjs");

  const confirmText = document.getElementById("confirm-text");
  const confirmYes = document.getElementById("confirm-yes");
  const confirmNo = document.getElementById("confirm-no");

  // guards
  if (!breakfastNameEl || !breakfastImageEl) {
    console.error("Missing required elements (#breakfast-name or #breakfast-image). Check index.html.");
    return;
  }

  // app state
  let breakfasts = [];
  let deletedBreakfasts = [];
  let lastSuggestedId = null;

  // initialize: load data from server (if available) or use defaults
  (async function init() {
    await loadBreakfasts();
  })();

  // Wire events (only if the elements exist)
  if (suggestBtn) suggestBtn.addEventListener("click", suggestBreakfast);
  if (allBtn) allBtn.addEventListener("click", openAllModal);
  if (addBtn) addBtn.addEventListener("click", openAddModal);
  if (recentlyDeletedBtn) recentlyDeletedBtn.addEventListener("click", openDeletedModal);

  // close buttons
  document.querySelectorAll('.close').forEach(el => el && el.addEventListener('click', () => { if (allModal) allModal.classList.remove('show'); document.body.classList.remove("modal-open");}));
  document.querySelectorAll('.close-add').forEach(el => el && el.addEventListener('click', () => closeAddModal()));
  document.querySelectorAll('.close-deleted').forEach(el => el && el.addEventListener('click', () => { if (deletedModal) deletedModal.classList.remove('show'); document.body.classList.remove("modal-open");}));
  if (cancelAddBtn) cancelAddBtn.addEventListener("click", () => closeAddModal());
  if (confirmNo) confirmNo.addEventListener("click", () => { if (confirmModal) confirmModal.classList.remove('show'); });

  // file input / drag & drop
  if (fileDrop) {
    fileDrop.addEventListener("dragover", (e) => { e.preventDefault(); fileDrop.style.borderColor = "#888"; });
    fileDrop.addEventListener("dragleave", (e) => { e.preventDefault(); fileDrop.style.borderColor = "#bbb"; });
    fileDrop.addEventListener("drop", (e) => {
      e.preventDefault();
      fileDrop.style.borderColor = "#bbb";
      const f = e.dataTransfer.files?.[0];
      if (f) handleFileSelected(f);
    });
  }
  if (fileInput) fileInput.addEventListener("change", (e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); });

  // add form submit
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return alert("Please enter a name.");

      const newBreakfast = {
        id: genId(),
        name: name,
        notes: "",
        image: previewImage._file || null, // <-- THIS is the fix
        createdAt: Date.now()
      };


      // Save to IndexedDB
      await put("breakfasts", newBreakfast);

      // Update in-memory list so UI updates immediately
      breakfasts.push(newBreakfast);

      // Reset UI
      nameInput.value = "";
      closeAddModal();
    });
  }

  /* ----- Core functions ----- */

  async function loadBreakfasts() {
  breakfasts = await getAll('breakfasts');

  if (!breakfasts || breakfasts.length === 0) {
    breakfasts = [
      { id: genId(), name: "Pancakes", notes: "", image: null, createdAt: Date.now() },
      { id: genId(), name: "Omelette", notes: "", image: null, createdAt: Date.now() },
      { id: genId(), name: "French Toast", notes: "", image: null, createdAt: Date.now() }
    ];

    for (const b of breakfasts) {
      await put('breakfasts', b);
    }
  }
}

  function openAddModal() {
    if (!addModal) return;
    addModal.classList.add('show');
    document.body.classList.add("modal-open");
    if (nameInput) nameInput.value = "";
    if (previewWrapper) previewWrapper.style.display = "none";
    if (previewImage) { previewImage.src = ""; previewImage._file = null; }
    if (fileInput) fileInput.value = "";
    if (saveToScriptJsCheckbox) saveToScriptJsCheckbox.checked = false;
  }
  function closeAddModal() { 
    if (addModal) addModal.classList.remove('show');
    document.body.classList.remove("modal-open");
  }

  function handleFileSelected(file) {
    if (!file.type.startsWith("image/")) return alert("Please select an image file.");
    const reader = new FileReader();
    reader.onload = function(evt) {
      if (previewImage) {
        previewImage.src = evt.target.result;
        previewImage._file = file;
      }
      if (previewWrapper) previewWrapper.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function suggestBreakfast() {
    if (!breakfasts || breakfasts.length === 0) {
      breakfastNameEl.innerText = "No breakfasts available. Add one!";
      if (breakfastImageEl) breakfastImageEl.style.display = "none";
      return;
    }
    let candidate = null;
    for (let i = 0; i < 8; i++) {
      const pick = breakfasts[Math.floor(Math.random() * breakfasts.length)];
      if (pick.id !== lastSuggestedId) { candidate = pick; break; }
      candidate = pick;
    }
    lastSuggestedId = candidate.id;
    breakfastNameEl.innerText = candidate.name || "Breakfast";
    if (candidate.image) {
      breakfastImageEl.src = URL.createObjectURL(candidate.image);
      breakfastImageEl.style.display = "block";
    } else {
    breakfastImageEl.style.display = "none";
    }
  }

  function openAllModal() {
    if (!allModal || !breakfastListEl) return;
    breakfastListEl.innerHTML = "";
    (breakfasts || []).forEach((b) => {
      const li = document.createElement("li");
      li.textContent = b.name;
      li.onclick = () => { allModal.classList.remove('show'); viewBreakfastPage(b.id); };
      breakfastListEl.appendChild(li);
    });
    allModal.classList.add('show');
    document.body.classList.add("modal-open");
  }

  async function openDeletedModal() {
    if (!deletedModal || !deletedListEl) return;
    deletedBreakfasts = await getAll("deletedBreakfasts");

    deletedListEl.innerHTML = "";
    (deletedBreakfasts || []).forEach((b) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(b.name)}</strong>`;
      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.style.marginLeft = "8px";
      restoreBtn.addEventListener('click', async () => {
        restoreBtn.disabled = true;
        // restore to main store
        await put('breakfasts', b);
        breakfasts.push(b);
        // remove from deleted store
        await remove('deletedBreakfasts', b.id);
        deletedBreakfasts = deletedBreakfasts.filter(x => x.id !== b.id);
        openDeletedModal();
      });
      const delForeverBtn = document.createElement("button");
      delForeverBtn.textContent = "Delete forever";
      delForeverBtn.style.marginLeft = "8px";
      delForeverBtn.addEventListener('click', async () => {
        if (!confirm(`Permanently delete "${b.name}"? This cannot be undone.`)) return;
        await remove('deletedBreakfasts', b.id);
        deletedBreakfasts = deletedBreakfasts.filter(x => x.id !== b.id);
        openDeletedModal();
      });
      li.appendChild(document.createElement("br"));
      li.appendChild(restoreBtn);
      li.appendChild(delForeverBtn);
      deletedListEl.appendChild(li);
    });
    deletedModal.classList.add('show');
    document.body.classList.add("modal-open");
  }

  function viewBreakfastPage(id) {
    document.body.classList.remove("modal-open");
    const b = (breakfasts || []).find(x => x.id === id);
    if (!b) return alert("Breakfast not found.");

    const html = `
      <a href="#" class="back-button" id="back-main">Back</a>
      <div class="breakfast-page">
        <div>
          <h1 id="breakfast-title">${escapeHtml(b.name)}</h1>
          <img id="detail-image" style="display:none;">
          <div id="no-image" style="width:320px;height:320px;display:flex;align-items:center;justify-content:center;background:#eee;border-radius:6px;">
            No image
          </div>
        </div>

        <div class="notes">
          <h3>Notes</h3>
          <div id="notes-display">${escapeHtml(b.notes || "(No notes yet)")}</div>
          <input id="name-editor" style="display:none;margin-bottom:8px;" />
          <textarea id="notes-editor" style="display:none;"></textarea>
          <div style="margin-top:12px;">
            <button id="edit-btn">Edit</button>
            <button id="save-btn" style="display:none;">Save</button>
            <button id="delete-btn" style="background:#ffdddd;border-color:#ff9999;margin-left:8px;">Delete Breakfast</button>
          </div>
        </div>
      </div>
    `;
    document.body.innerHTML = html;
    const detailImg = document.getElementById("detail-image");
    const noImg = document.getElementById("no-image");

    if (b.image instanceof Blob) {
      detailImg.src = URL.createObjectURL(b.image);
      detailImg.style.display = "block";
      noImg.style.display = "none";
    }

    const backMain = document.getElementById("back-main");
    if (backMain) backMain.addEventListener("click", (e) => { e.preventDefault(); location.reload(); });

    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const notesDisplay = document.getElementById("notes-display");
    const notesEditor = document.getElementById("notes-editor");
    const nameEditor = document.getElementById("name-editor");
    const titleEl = document.getElementById("breakfast-title");

    if (editBtn) editBtn.addEventListener("click", () => {
      nameEditor.value = b.name;
      notesEditor.value = b.notes || "";
      titleEl.style.display = "none";
      notesDisplay.style.display = "none";
      nameEditor.style.display = "block";
      notesEditor.style.display = "block";
      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
    });

    if (saveBtn) saveBtn.addEventListener("click", async () => {
      const newName = nameEditor.value.trim() || b.name;
      const newNotes = notesEditor.value;
      b.name = newName;
      b.notes = newNotes;
      await put("breakfasts", b);
      titleEl.textContent = b.name;
      titleEl.style.display = "block";
      notesDisplay.textContent = b.notes || "(No notes yet)";
      notesDisplay.style.display = "block";
      nameEditor.style.display = "none";
      notesEditor.style.display = "none";
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
    });

    // re-select newly created confirm modal/buttons from the new DOM
    const newConfirmModal = document.getElementById("confirm-modal");
    const newConfirmYes = document.getElementById("confirm-yes");
    const newConfirmNo = document.getElementById("confirm-no");
    const deleteBtn = document.getElementById("delete-btn");

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        // Move breakfast to Recently Deleted (IndexedDB)
        deletedBreakfasts.push(b);
        const deletedCopy = structuredClone(b);
        await put("deletedBreakfasts", deletedCopy);
        await remove("breakfasts", b.id);

        // Remove from active breakfasts (IndexedDB)
        breakfasts = breakfasts.filter(x => x.id !== b.id);

        alert(`"${b.name}" moved to Recently Deleted.`);
        location.reload();
      });
    }


  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

}); // DOMContentLoaded end
