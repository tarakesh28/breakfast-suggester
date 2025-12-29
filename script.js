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
    await loadDataFromServer();
  })();

  // Wire events (only if the elements exist)
  if (suggestBtn) suggestBtn.addEventListener("click", suggestBreakfast);
  if (allBtn) allBtn.addEventListener("click", openAllModal);
  if (addBtn) addBtn.addEventListener("click", openAddModal);
  if (recentlyDeletedBtn) recentlyDeletedBtn.addEventListener("click", openDeletedModal);

  // close buttons
  document.querySelectorAll('.close').forEach(el => el && el.addEventListener('click', () => { if (allModal) allModal.classList.remove('show'); }));
  document.querySelectorAll('.close-add').forEach(el => el && el.addEventListener('click', () => closeAddModal()));
  document.querySelectorAll('.close-deleted').forEach(el => el && el.addEventListener('click', () => { if (deletedModal) deletedModal.classList.remove('show'); }));
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

      // upload image if file chosen
      let imagePath = "";
      if (previewImage && previewImage._file) {
        const file = previewImage._file;
        const form = new FormData();
        form.append('image', file);
        form.append('name', name);
        try {
          const resp = await fetch(`${API_PREFIX}/upload-image`, { method: 'POST', body: form });
          const j = await resp.json();
          if (!j.ok) throw new Error(j.error || 'Upload failed');
          imagePath = j.path;
        } catch (err) {
          console.error(err);
          return alert('Image upload failed: ' + err.message);
        }
      } else if (previewImage && previewImage.src) {
        imagePath = previewImage.src;
      }

      const newB = { id: genId(), name, image: imagePath || "", notes: "" };
      breakfasts.push(newB);

      try { await saveBreakfastsToServer(); } 
      catch (err) { console.error(err); return alert('Failed to save breakfasts: ' + err.message); }

      if (saveToScriptJsCheckbox && saveToScriptJsCheckbox.checked) {
        try {
          await fetch(`${API_PREFIX}/append-to-scriptjs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newB)
          }).then(r => r.json()).then(res => { if (!res.ok) console.warn('append-to-scriptjs:', res); });
        } catch (e) { console.warn('append-to-scriptjs error', e); }
      }

      closeAddModal();
      alert('Breakfast added and saved.');
    });
  }

  /* ----- Core functions ----- */

  async function loadDataFromServer() {
    try {
      const dresp = await fetch(`${API_PREFIX}/data`);
      breakfasts = dresp.ok ? await dresp.json() : [];
    } catch (e) {
      console.warn('Could not load /data, using defaults', e);
      breakfasts = [
        { id: genId(), name: "Pancakes", image: "images/pancakes.jpg", notes: "" },
        { id: genId(), name: "Omelette", image: "images/omelette.jpg", notes: "" },
        { id: genId(), name: "French Toast", image: "images/french-toast.jpg", notes: "" }
      ];
    }

    try {
      const delResp = await fetch(`${API_PREFIX}/deleted`);
      deletedBreakfasts = delResp.ok ? await delResp.json() : [];
    } catch (e) {
      deletedBreakfasts = [];
    }
  }

  async function saveBreakfastsToServer() {
    const resp = await fetch(`${API_PREFIX}/save-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(breakfasts)
    });
    const j = await resp.json();
    if (!j.ok) throw new Error(j.error || 'save-data failed');
  }

  async function saveDeletedToServer() {
    const resp = await fetch(`${API_PREFIX}/save-deleted`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deletedBreakfasts)
    });
    const j = await resp.json();
    if (!j.ok) throw new Error(j.error || 'save-deleted failed');
  }

  function openAddModal() {
    if (!addModal) return;
    addModal.classList.add('show');
    if (nameInput) nameInput.value = "";
    if (previewWrapper) previewWrapper.style.display = "none";
    if (previewImage) { previewImage.src = ""; previewImage._file = null; }
    if (fileInput) fileInput.value = "";
    if (saveToScriptJsCheckbox) saveToScriptJsCheckbox.checked = false;
  }
  function closeAddModal() { if (addModal) addModal.classList.remove('show'); }

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
    if (candidate.image && breakfastImageEl) {
      breakfastImageEl.src = candidate.image;
      breakfastImageEl.style.display = "block";
    } else if (breakfastImageEl) {
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
  }

  async function openDeletedModal() {
    if (!deletedModal || !deletedListEl) return;
    try {
      const delResp = await fetch(`${API_PREFIX}/deleted`);
      deletedBreakfasts = delResp.ok ? await delResp.json() : deletedBreakfasts || [];
    } catch (e) { deletedBreakfasts = deletedBreakfasts || []; }

    deletedListEl.innerHTML = "";
    (deletedBreakfasts || []).forEach((b) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(b.name)}</strong>`;
      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.style.marginLeft = "8px";
      restoreBtn.addEventListener('click', async () => {
        breakfasts.push(b);
        deletedBreakfasts = deletedBreakfasts.filter(x => x.id !== b.id);
        await saveBreakfastsToServer();
        await saveDeletedToServer();
        openDeletedModal();
        alert('Restored ' + b.name);
      });
      const delForeverBtn = document.createElement("button");
      delForeverBtn.textContent = "Delete forever";
      delForeverBtn.style.marginLeft = "8px";
      delForeverBtn.addEventListener('click', async () => {
        if (!confirm('Permanently delete "'+b.name+'"? This cannot be undone.')) return;
        deletedBreakfasts = deletedBreakfasts.filter(x => x.id !== b.id);
        await saveDeletedToServer();
        openDeletedModal();
        alert('Deleted permanently.');
      });
      li.appendChild(document.createElement("br"));
      li.appendChild(restoreBtn);
      li.appendChild(delForeverBtn);
      deletedListEl.appendChild(li);
    });
    deletedModal.classList.add('show');
  }

  function viewBreakfastPage(id) {
    const b = (breakfasts || []).find(x => x.id === id);
    if (!b) return alert("Breakfast not found.");

    const html = `
      <a href="#" class="back-button" id="back-main">Back</a>
      <div class="breakfast-page">
        <div>
          <h1 id="breakfast-title">${escapeHtml(b.name)}</h1>
          ${b.image ? `<img src="${b.image}" alt="${escapeHtml(b.name)}">` : `<div style="width:320px;height:320px;display:flex;align-items:center;justify-content:center;background:#eee;border-radius:6px;">No image</div>`}
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
      try {
        await saveBreakfastsToServer();
      } catch (err) {
        console.error("Failed to save changes:", err);
        alert("Failed to save changes: " + err.message);
        return;
      }
      titleEl.textContent = b.name;
      titleEl.style.display = "block";
      notesDisplay.textContent = b.notes || "(No notes yet)";
      notesDisplay.style.display = "block";
      nameEditor.style.display = "none";
      notesEditor.style.display = "none";
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      alert("Saved changes.");
    });

    // re-select newly created confirm modal/buttons from the new DOM
    const newConfirmModal = document.getElementById("confirm-modal");
    const newConfirmYes = document.getElementById("confirm-yes");
    const newConfirmNo = document.getElementById("confirm-no");
    const deleteBtn = document.getElementById("delete-btn");

    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        // If the confirm modal exists in DOM, use it; otherwise use window.confirm as a fallback.
        if (newConfirmModal && newConfirmYes && newConfirmNo) {
          confirmText.textContent = `Confirm deletion of "${b.name}"? This will move it to Recently Deleted.`;
          newConfirmModal.classList.add('show');

          const onYes = async () => {
            // perform deletion
            deletedBreakfasts.push(b);
            breakfasts = breakfasts.filter(x => x.id !== b.id);

            try {
              await saveBreakfastsToServer();
              await saveDeletedToServer();
            } catch (err) {
              console.error("Failed to save during delete:", err);
              alert("Failed to delete: " + err.message);
              if (newConfirmYes) newConfirmYes.removeEventListener("click", onYes);
              return;
            }

            newConfirmModal.classList.remove('show');
            alert(`"${b.name}" moved to Recently Deleted.`);
            location.reload();

            if (newConfirmYes) newConfirmYes.removeEventListener("click", onYes);
          };

          newConfirmYes.removeEventListener("click", onYes); // safe no-op
          newConfirmYes.addEventListener("click", onYes);

          const onNo = () => {
            newConfirmModal.classList.remove('show');
            newConfirmYes.removeEventListener("click", onYes);
            newConfirmNo.removeEventListener("click", onNo);
          };
          newConfirmNo.removeEventListener("click", onNo);
          newConfirmNo.addEventListener("click", onNo);

        } else {
          // Fallback: use browser confirm dialog so delete still works even when modal markup is absent
          const ok = window.confirm(`Delete "${b.name}"? This will move it to Recently Deleted.`);
          if (!ok) return;
          deletedBreakfasts.push(b);
          breakfasts = breakfasts.filter(x => x.id !== b.id);

          try {
            await saveBreakfastsToServer();
            await saveDeletedToServer();
          } catch (err) {
            console.error("Failed to save during delete:", err);
            alert("Failed to delete: " + err.message);
            return;
          }

          alert(`"${b.name}" moved to Recently Deleted.`);
          location.reload();
        }
      });
    }


  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

}); // DOMContentLoaded end
