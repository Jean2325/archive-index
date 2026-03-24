const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfP0QcA1KvhycRJB2OXyeRKkF5eGK1X-PdxhyVvPVWUnGmCYlFAs1JeRTQZxUuz3vq/exec"; // <--- METTI IL TUO URL!
let localArchive = [];

function mostraPagina(target) {
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + target).style.display = 'block';
    document.getElementById('btn-' + (target === 'registrazione' ? 'reg' : 'arc')).classList.add('active');
    if(target === 'archivio') fetchFromCloud();
}

async function salvaPersona() {
    const btn = document.getElementById('btnSave');
    const isEdit = document.getElementById('editMode').value === "true";
    const fields = ['idNumber','tarNo','no201','organization','husbandSurname','surname','firstName','middleName','dob','pob','sex','civilStatus','marriageDate','citizenship','occupation','address','city','province','fatherName','motherName','baptismDate','baptismPlace','status'];
    
    let data = { action: isEdit ? "edit" : "create" };
    fields.forEach(f => { data[f] = document.getElementById(f).value.trim().toUpperCase(); });

    if(!data.surname || !data.firstName || !data.idNumber) return alert("Missing mandatory fields!");

    btn.disabled = true; btn.innerText = "SAVING...";
    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(data) });
        alert(isEdit ? "Updated!" : "Registered!");
        cancelEdit(); // Reset form
        if(isEdit) mostraPagina('archivio');
    } catch (e) { alert("Error!"); } 
    finally { btn.disabled = false; btn.innerText = isEdit ? "💾 UPDATE DATA" : "🚀 REGISTER TO CLOUD"; }
}

async function fetchFromCloud() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
    try {
        const response = await fetch(SCRIPT_URL);
        localArchive = await response.json();
        renderArchive();
    } catch (e) { console.error(e); } finally { spinner.style.display = 'none'; }
}

function renderArchive() {
    const listIn = document.getElementById('list-in');
    const listOut = document.getElementById('list-out');
    listIn.innerHTML = ''; listOut.innerHTML = '';
    localArchive.sort((a,b) => (a.surname || "").localeCompare(b.surname || ""));
    let lastLIn = "", lastLOut = "";

    localArchive.forEach(p => {
        const letter = (p.surname || "?")[0].toUpperCase();
        const card = `
            <div class="replica-card" data-filter="${p.surname} ${p.husbandSurname} ${p.firstName} ${p.idNumber} ${p.tarNo} ${p.organization}">
                <div class="card-header-main">
                    <span>ID: ${p.idNumber}</span><span>TAR: ${p.tarNo}</span><span>201: ${p.no201}</span>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>HUSBAND SURNAME</label><div class="val">${p.husbandSurname || '-'}</div></div>
                    <div class="card-cell"><label>SURNAME</label><div class="val">${p.surname}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>NAME</label><div class="val">${p.firstName}</div></div>
                    <div class="card-cell"><label>ORG</label><div class="val" style="color:red">${p.organization}</div></div>
                </div>
                <div class="card-section-title">CHURCH & CONTACT</div>
                <div class="card-row">
                    <div class="card-cell"><label>BAPTISM</label><div class="val">${p.baptismDate || '-'}</div></div>
                    <div class="card-cell"><label>CIVIL STATUS</label><div class="val">${p.civilStatus || '-'}</div></div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-edit" onclick="prepEdit('${p.idNumber}')">EDIT</button>
                    <button class="btn-action btn-move" onclick="moveStatus('${p.idNumber}','${p.status==='IN'?'OUT':'IN'}')">MOVE</button>
                    <button class="btn-action btn-delete" onclick="deleteEntry('${p.idNumber}','${p.surname}')">DEL</button>
                </div>
            </div>`;
        if(p.status === "IN") {
            if(letter !== lastLIn) { listIn.innerHTML += `<div class="letter-divider">${letter}</div>`; lastLIn = letter; }
            listIn.innerHTML += card;
        } else {
            if(letter !== lastLOut) { listOut.innerHTML += `<div class="letter-divider">${letter}</div>`; lastLOut = letter; }
            listOut.innerHTML += card;
        }
    });
}

function filtraCards() {
    const val = document.getElementById('searchBox').value.toUpperCase();
    document.querySelectorAll('.replica-card').forEach(c => {
        c.style.display = c.dataset.filter.toUpperCase().includes(val) ? 'block' : 'none';
    });
}

function prepEdit(id) {
    const p = localArchive.find(x => x.idNumber == id);
    if(!p) return;
    mostraPagina('registrazione');
    document.getElementById('form-title').innerText = "EDIT MODE: " + p.surname;
    document.getElementById('editMode').value = "true";
    document.getElementById('idNumber').disabled = true; // L'ID non si cambia
    document.getElementById('btnSave').innerText = "💾 UPDATE DATA";
    document.getElementById('btnCancelEdit').style.display = "block";
    // Riempi i campi
    Object.keys(p).forEach(k => { if(document.getElementById(k)) document.getElementById(k).value = p[k]; });
}

function cancelEdit() {
    document.getElementById('editMode').value = "false";
    document.getElementById('idNumber').disabled = false;
    document.getElementById('form-title').innerText = "NEW INDEX CARD";
    document.getElementById('btnSave').innerText = "🚀 REGISTER TO CLOUD";
    document.getElementById('btnCancelEdit').style.display = "none";
    document.querySelectorAll('input, select').forEach(i => i.value = (i.tagName==='SELECT' ? i.options[0].value : ''));
}

async function moveStatus(id, s) {
    if(!confirm("Move to " + s + "?")) return;
    await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "move", idNumber: id, newStatus: s }) });
    fetchFromCloud();
}

async function deleteEntry(id, n) {
    if(!confirm("Delete " + n + "?")) return;
    await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "delete", idNumber: id }) });
    fetchFromCloud();
}
fetchFromCloud();