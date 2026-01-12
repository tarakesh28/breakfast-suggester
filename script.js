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
      breakfastImageEl.style.display = "none";
      document.getElementById("no-image-slot").style.display = "flex";
      return;
    }

    let candidate = null;
    for (let i = 0; i < 8; i++) {
      const pick = breakfasts[Math.floor(Math.random() * breakfasts.length)];
      if (pick.id !== lastSuggestedId) { candidate = pick; break; }
      candidate = pick;
    }

    lastSuggestedId = candidate.id;

    const noImgSlot = document.getElementById("no-image-slot");

    if (candidate.image instanceof Blob) {
      breakfastNameEl.innerText = candidate.name;
      breakfastImageEl.src = URL.createObjectURL(candidate.image);
      breakfastImageEl.style.display = "block";
      noImgSlot.style.display = "none";
    } else {
      breakfastNameEl.innerText = candidate.name;
      breakfastImageEl.style.display = "none";
      noImgSlot.style.display = "flex";
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

    deletedListEl.replaceChildren(); // mobile-safe clear

    for (const b of deletedBreakfasts) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(b.name)}</strong>`;

      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.style.marginLeft = "8px";

      restoreBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        restoreBtn.disabled = true;

        await put("breakfasts", b);
        await remove("deletedBreakfasts", b.id);

        breakfasts.push(b);
        deletedBreakfasts = deletedBreakfasts.filter(x => x.id !== b.id);

        openDeletedModal();
      });

      const delForeverBtn = document.createElement("button");
      delForeverBtn.textContent = "Delete forever";
      delForeverBtn.style.marginLeft = "8px";

      delForeverBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(`Permanently delete "${b.name}"?`)) return;

        await remove("deletedBreakfasts", b.id);
        deletedBreakfasts = deletedBreakfasts.filter(x => x.id !== b.id);

        openDeletedModal();
      });

      li.appendChild(document.createElement("br"));
      li.appendChild(restoreBtn);
      li.appendChild(delForeverBtn);
      deletedListEl.appendChild(li);
    }

    deletedModal.classList.add("show");
    document.body.classList.add("modal-open");
  }


  function viewBreakfastPage(id) {
    document.body.classList.remove("modal-open");
    const b = (breakfasts || []).find(x => x.id === id);
    let stagedImage = b.image;  // holds temporary edits
    let pendingImagePickMode = null;  // "change" or "add"
    if (!b) return alert("Breakfast not found.");

    const html = `
      <a href="#" class="back-button" id="back-main">Back</a>
      <div class="breakfast-page">
        <div>
          <h1 id="breakfast-title">${escapeHtml(b.name)}</h1>

          <div class="image-box">
            <img id="detail-image" style="display:none;">
            <div id="no-image" class="no-image-box">No image</div>
          </div>

          <div id="image-edit-controls" style="display:none; margin-top:10px;">
            <button id="change-image-btn">Change Image</button>
            <button id="add-image-btn">Add Image</button>
            <button id="remove-image-btn">Remove Image</button>
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

    // ---- element refs ----
    const detailImg = document.getElementById("detail-image");
    const noImg = document.getElementById("no-image");
    const imageControls = document.getElementById("image-edit-controls");
    const changeImgBtn = document.getElementById("change-image-btn");
    const addImgBtn = document.getElementById("add-image-btn");
    const removeImgBtn = document.getElementById("remove-image-btn");

    const backMain = document.getElementById("back-main");
    const editBtn = document.getElementById("edit-btn");
    const saveBtn = document.getElementById("save-btn");
    const deleteBtn = document.getElementById("delete-btn");

    const notesDisplay = document.getElementById("notes-display");
    const notesEditor = document.getElementById("notes-editor");
    const nameEditor = document.getElementById("name-editor");
    const titleEl = document.getElementById("breakfast-title");

    // ---- initial image render ----
    function renderImage() {
      if (stagedImage instanceof Blob) {
        detailImg.src = URL.createObjectURL(stagedImage);
        detailImg.style.display = "block";
        noImg.style.display = "none";
      } else {
        detailImg.style.display = "none";
        noImg.style.display = "flex";
      }
    }
    renderImage();

    // ---- back ----
    backMain.onclick = (e) => {
      e.preventDefault();
      location.reload();
    };

    // ---- enter edit mode ----
    editBtn.onclick = () => {
      nameEditor.value = b.name;
      notesEditor.value = b.notes || "";

      titleEl.style.display = "none";
      notesDisplay.style.display = "none";

      nameEditor.style.display = "block";
      notesEditor.style.display = "block";

      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
      deleteBtn.style.display = "none";

      // show image edit controls
      imageControls.style.display = "block";

      if (b.image instanceof Blob) {
        changeImgBtn.style.display = "inline-block";
        addImgBtn.style.display = "none";
      } else {
        changeImgBtn.style.display = "none";
        addImgBtn.style.display = "inline-block";
      }
      removeImgBtn.style.display = "inline-block";

      // create cancel button
      let cancelEdit = document.getElementById("cancel-edit-btn");
      if (!cancelEdit) {
        cancelEdit = document.createElement("button");
        cancelEdit.id = "cancel-edit-btn";
        cancelEdit.textContent = "Cancel";
        saveBtn.insertAdjacentElement("afterend", cancelEdit);
      }

      cancelEdit.onclick = () => {
        stagedImage = b.image;   // discard staged changes
        renderImage();
        exitEditMode();
        cancelEdit.remove();
      };
    };

    function exitEditMode() {
      titleEl.style.display = "block";
      notesDisplay.style.display = "block";

      nameEditor.style.display = "none";
      notesEditor.style.display = "none";

      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      deleteBtn.style.display = "inline-block";
      imageControls.style.display = "none";
    }

    // ---- save edits ----
    saveBtn.onclick = async () => {
      b.name = nameEditor.value.trim() || b.name;
      b.notes = notesEditor.value;
      b.image = stagedImage;     // commit staged image
      await put("breakfasts", b);

      titleEl.textContent = b.name;
      notesDisplay.textContent = b.notes || "(No notes yet)";

      exitEditMode();

      const cancelEdit = document.getElementById("cancel-edit-btn");
      if (cancelEdit) cancelEdit.remove();
    };

    // ---- image buttons ----
    changeImgBtn.onclick = () => {
      pendingImagePickMode = "change";
      fileInput.click();
    };

    addImgBtn.onclick = () => {
      pendingImagePickMode = "add";
      fileInput.click();
    };

    removeImgBtn.onclick = () => {
      stagedImage = null;   // only stage
      renderImage();
    };

    // ---- shared file input handler ----
    fileInput.onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;

      stagedImage = f;     // stage only, do not save yet
      renderImage();       // preview immediately

      pendingImagePickMode = null;
      fileInput.value = ""; // reset so same file can be re-picked if needed
    };

    // ---- delete breakfast ----
    deleteBtn.onclick = async () => {
      deletedBreakfasts.push(structuredClone(b));
      await put("deletedBreakfasts", structuredClone(b));
      await remove("breakfasts", b.id);
      breakfasts = breakfasts.filter(x => x.id !== b.id);
      alert(`"${b.name}" moved to Recently Deleted.`);
      location.reload();
    };
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

}); // DOMContentLoaded end
