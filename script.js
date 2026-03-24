const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzA61wP0vWToVdFARdJxxUy0A8o-TwadDJrJXZvEwdY2CSrUXrj21MY1hS3JSaYvmEa/exec";

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
    const fields = ['idNumber','tarNo','no201','organization','husbandSurname','surname','firstName','middleName','dob','pob','city','province','sex','marriageDate','civilStatus','citizenship','occupation','telNo','religion','address','fatherName','motherName','indoctrinatedBy','baptismPlace','baptismDate','status'];
    
    let data = { action: "create", id: Date.now() };
    fields.forEach(f => {
        let val = document.getElementById(f).value;
        data[f] = val ? val.trim().toUpperCase() : '';
    });

    if(!data.surname || !data.firstName) return alert("Surname and First Name are mandatory!");

    btn.disabled = true;
    btn.innerText = "⌛ SENDING TO CLOUD...";

    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(data) });
        alert("Registration Successful!");
        // Reset form
        document.querySelectorAll('input, select').forEach(i => i.value = (i.tagName === 'SELECT' ? i.options[0].value : ''));
    } catch (e) {
        alert("Connection Error.");
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 REGISTER TO CLOUD DATABASE";
    }
}

async function fetchFromCloud() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
    try {
        const response = await fetch(SCRIPT_URL);
        localArchive = await response.json();
        renderArchive();
    } catch (e) {
        console.error(e);
    } finally {
        spinner.style.display = 'none';
    }
}

function renderArchive() {
    const listIn = document.getElementById('list-in');
    const listOut = document.getElementById('list-out');
    listIn.innerHTML = ''; listOut.innerHTML = '';

    localArchive.sort((a, b) => (a.surname || "").localeCompare(b.surname || ""));

    let lastLIn = "", lastLOut = "";

    localArchive.forEach(p => {
        const letter = (p.surname || "?").charAt(0).toUpperCase();
        
        const cardHtml = `
            <div class="replica-card" data-filter="${p.surname} ${p.firstName} ${p.idNumber} ${p.tarNo}">
                <div class="card-header">
                    <span>ID: ${p.idNumber || '---'}</span>
                    <span>TAR: ${p.tarNo || '---'}</span>
                </div>
                
                <div class="card-section-title">PERSONAL IDENTITY</div>
                <div class="card-row">
                    <div class="card-cell"><label>HUSBAND SURNAME</label><div class="val">${p.husbandSurname || '-'}</div></div>
                    <div class="card-cell"><label>SURNAME</label><div class="val">${p.surname || '-'}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>FIRST NAME</label><div class="val">${p.firstName || '-'}</div></div>
                    <div class="card-cell"><label>MIDDLE NAME</label><div class="val">${p.middleName || '-'}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>BIRTH DATE / PLACE</label><div class="val">${p.dob || '-'} / ${p.pob || '-'}</div></div>
                    <div class="card-cell"><label>SEX</label><div class="val">${p.sex || '-'}</div></div>
                </div>

                <div class="card-section-title">CHURCH & STATUS</div>
                <div class="card-row">
                    <div class="card-cell"><label>ORG</label><div class="val">${p.organization || '-'}</div></div>
                    <div class="card-cell"><label>CIVIL STATUS</label><div class="val">${p.civilStatus || '-'}</div></div>
                    <div class="card-cell"><label>201 NO.</label><div class="val">${p.no201 || '-'}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>BAPTISM DATE</label><div class="val">${p.baptismDate || '-'}</div></div>
                    <div class="card-cell"><label>BAPTISM PLACE</label><div class="val">${p.baptismPlace || '-'}</div></div>
                </div>

                <div class="card-section-title">CONTACTS & PARENTS</div>
                <div class="card-row">
                    <div class="card-cell"><label>ADDRESS</label><div class="val">${p.address || '-'}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>FATHER</label><div class="val">${p.fatherName || '-'}</div></div>
                    <div class="card-cell"><label>MOTHER</label><div class="val">${p.motherName || '-'}</div></div>
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
    const term = document.getElementById('searchBox').value.toUpperCase();
    document.querySelectorAll('.replica-card').forEach(c => {
        c.style.display = c.getAttribute('data-filter').toUpperCase().includes(term) ? 'block' : 'none';
    });
}

fetchFromCloud();