const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfP0QcA1KvhycRJB2OXyeRKkF5eGK1X-PdxhyVvPVWUnGmCYlFAs1JeRTQZxUuz3vq/exec"; // <--- INCOLLA QUI IL TUO URL!
let localArchive = [];

function mostraPagina(target) {
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + target).style.display = 'block';
    document.getElementById('btn-' + (target === 'registrazione' ? 'reg' : 'arc')).classList.add('active');
    if(target === 'archivio') fetchFromCloud();
}

// Funzione per pulire la data (YYYY-MM-DD -> DD/MM/YYYY)
function formatDate(dateStr) {
    if (!dateStr || dateStr === "" || dateStr === "-") return "-";
    if (dateStr.includes("T")) dateStr = dateStr.split("T")[0]; // Rimuove ore se presenti
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function salvaPersona() {
    const btn = document.getElementById('btnSave');
    const isEdit = document.getElementById('editMode').value === "true";
    const fields = ['idNumber','tarNo','no201','organization','husbandSurname','surname','firstName','middleName','dob','pob','sex','civilStatus','marriageDate','citizenship','occupation','telNo','religion','address','city','province','fatherName','motherName','indoctrinatedBy','baptismDate','baptismPlace','status'];
    
    let data = { action: isEdit ? "edit" : "create" };
    fields.forEach(f => { 
        data[f] = document.getElementById(f).value.trim().toUpperCase(); 
    });

    if(!data.surname || !data.firstName || !data.idNumber) return alert("ERROR: ID, Surname and First Name are mandatory!");

    btn.disabled = true; btn.innerText = "SAVING...";
    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(data) });
        alert(isEdit ? "DATA UPDATED!" : "REGISTERED!");
        cancelEdit();
        mostraPagina('archivio');
    } catch (e) { alert("CONNECTION ERROR!"); } 
    finally { btn.disabled = false; btn.innerText = "🚀 REGISTER TO CLOUD"; }
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

    // ORDINE ALFABETICO: Husband Surname se presente, altrimenti Surname
    localArchive.sort((a, b) => {
        const nameA = (a.husbandSurname || a.surname || "").toUpperCase();
        const nameB = (b.husbandSurname || b.surname || "").toUpperCase();
        return nameA.localeCompare(nameB);
    });

    let lastLIn = "", lastLOut = "";

    localArchive.forEach(p => {
        const sortName = (p.husbandSurname || p.surname || "?");
        const letter = sortName[0].toUpperCase();
        
        const cardHtml = `
            <div class="replica-card" data-filter="${p.surname} ${p.husbandSurname} ${p.firstName} ${p.idNumber} ${p.tarNo} ${p.organization}">
                <div class="card-header-main">
                    <span>ID: ${p.idNumber}</span><span>TAR: ${p.tarNo}</span><span>201: ${p.no201}</span>
                </div>
                
                <div class="card-section-title">PERSONAL IDENTITY</div>
                <div class="card-row">
                    <div class="card-cell"><label>HUSBAND SURNAME</label><div class="val">${p.husbandSurname || '-'}</div></div>
                    <div class="card-cell"><label>SURNAME</label><div class="val">${p.surname}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>NAME</label><div class="val">${p.firstName} ${p.middleName || ''}</div></div>
                    <div class="card-cell"><label>ORG</label><div class="val" style="color:red">${p.organization}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>DOB / POB</label><div class="val">${formatDate(p.dob)} / ${p.pob || '-'}</div></div>
                    <div class="card-cell"><label>SEX / CIVIL STATUS</label><div class="val">${p.sex} / ${p.civilStatus}</div></div>
                </div>

                <div class="card-section-title">FAMILY & CONTACTS</div>
                <div class="card-row">
                    <div class="card-cell"><label>FATHER</label><div class="val">${p.fatherName || '-'}</div></div>
                    <div class="card-cell"><label>MOTHER</label><div class="val">${p.motherName || '-'}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>RELIGION</label><div class="val">${p.religion || '-'}</div></div>
                    <div class="card-cell"><label>TEL / OCCUPATION</label><div class="val">${p.telNo || '-'} / ${p.occupation || '-'}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>FULL ADDRESS</label><div class="val">${p.address || '-'}, ${p.city || '-'} (${p.province || '-'})</div></div>
                </div>

                <div class="card-section-title">CHURCH DATA</div>
                <div class="card-row">
                    <div class="card-cell"><label>BAPTISM DATE / PLACE</label><div class="val">${formatDate(p.baptismDate)} / ${p.baptismPlace || '-'}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>MARRIAGE DATE</label><div class="val">${formatDate(p.marriageDate)}</div></div>
                    <div class="card-cell"><label>INDOCTRINATED BY</label><div class="val">${p.indoctrinatedBy || '-'}</div></div>
                </div>

                <div class="card-actions">
                    <button class="btn-action btn-edit" onclick="prepEdit('${p.idNumber}')">EDIT</button>
                    <button class="btn-action btn-move" onclick="moveStatus('${p.idNumber}','${p.status==='IN'?'OUT':'IN'}')">MOVE</button>
                    <button class="btn-action btn-delete" onclick="deleteEntry('${p.idNumber}','${p.surname}')">DEL</button>
                </div>
            </div>`;

        if(p.status === "IN") {
            if(letter !== lastLIn) { listIn.innerHTML += `<div class="letter-divider">${letter}</div>`; lastLIn = letter; }
            listIn.innerHTML += cardHtml;
        } else {
            if(letter !== lastLOut) { listOut.innerHTML += `<div class="letter-divider">${letter}</div>`; lastLOut = letter; }
            listOut.innerHTML += cardHtml;
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
    document.getElementById('form-title').innerText = "EDITING: " + p.surname;
    document.getElementById('editMode').value = "true";
    document.getElementById('idNumber').readOnly = true; 
    document.getElementById('btnSave').innerText = "💾 UPDATE DATA";
    document.getElementById('btnCancelEdit').style.display = "block";

    const fields = ['idNumber','tarNo','no201','organization','husbandSurname','surname','firstName','middleName','dob','pob','sex','civilStatus','marriageDate','citizenship','occupation','telNo','religion','address','city','province','fatherName','motherName','indoctrinatedBy','baptismDate','baptismPlace','status'];
    
    fields.forEach(f => {
        let input = document.getElementById(f);
        if (input) {
            let val = p[f] || "";
            // Se è un campo data, puliamo il valore per il modulo (YYYY-MM-DD)
            if (input.type === "date" && val.includes("T")) val = val.split("T")[0];
            input.value = val;
        }
    });
    window.scrollTo(0,0);
}

function cancelEdit() {
    document.getElementById('editMode').value = "false";
    document.getElementById('idNumber').readOnly = false;
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
    if(!confirm("DANGER: Delete " + n + " permanently?")) return;
    await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "delete", idNumber: id }) });
    fetchFromCloud();
}
fetchFromCloud();