const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzA61wP0vWToVdFARdJxxUy0A8o-TwadDJrJXZvEwdY2CSrUXrj21MY1hS3JSaYvmEa/exec";
let localArchive = [];

// Cambia Pagina
function mostraPagina(target) {
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + target).style.display = 'block';
    document.getElementById('btn-' + (target === 'registrazione' ? 'reg' : 'arc')).classList.add('active');
    
    if(target === 'archivio') fetchFromCloud();
}

// Invia Dati a Google Sheets
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
        await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(data)
        });
        alert("Registration Successful!");
        document.querySelectorAll('input').forEach(i => i.value = '');
    } catch (e) {
        alert("Connection Error. Check internet.");
    } finally {
        btn.disabled = false;
        btn.innerText = "🚀 REGISTER TO CLOUD DATABASE";
    }
}

// Carica Dati da Google Sheets
async function fetchFromCloud() {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = 'block';
    try {
        const response = await fetch(SCRIPT_URL);
        localArchive = await response.json();
        renderArchive();
    } catch (e) {
        console.error("Fetch error", e);
    } finally {
        spinner.style.display = 'none';
    }
}

// Disegna le Schede nell'Archivio
function renderArchive() {
    const listIn = document.getElementById('list-in');
    const listOut = document.getElementById('list-out');
    listIn.innerHTML = ''; listOut.innerHTML = '';

    // Ordina per Cognome
    localArchive.sort((a, b) => (a.husbandSurname || a.surname).localeCompare(b.husbandSurname || b.surname));

    let lastLetterIn = "", lastLetterOut = "";

    localArchive.forEach(p => {
        const primaryName = p.husbandSurname || p.surname;
        const letter = primaryName.charAt(0).toUpperCase();
        
        const card = `
            <div class="replica-card" data-filter="${p.surname} ${p.firstName} ${p.idNumber} ${p.tarNo} ${p.no201}">
                <div class="card-header">
                    <span>ID: ${p.idNumber}</span>
                    <span>TAR: ${p.tarNo} | 201: ${p.no201}</span>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>HUSBAND SURNAME</label><div class="val">${p.husbandSurname}</div></div>
                    <div class="card-cell"><label>SURNAME</label><div class="val">${p.surname}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>FIRST NAME</label><div class="val">${p.firstName}</div></div>
                    <div class="card-cell"><label>MIDDLE NAME</label><div class="val">${p.middleName}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>DOB</label><div class="val">${p.dob}</div></div>
                    <div class="card-cell"><label>POB</label><div class="val">${p.pob}</div></div>
                    <div class="card-cell"><label>SEX</label><div class="val">${p.sex}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>CITY/PROVINCE</label><div class="val">${p.city} / ${p.province}</div></div>
                </div>
                <div class="card-row">
                    <div class="card-cell"><label>FULL ADDRESS</label><div class="val">${p.address}</div></div>
                </div>
                <div class="card-row" style="border:none">
                    <div class="card-cell"><label>BAPTISM DATE/PLACE</label><div class="val">${p.baptismDate} @ ${p.baptismPlace}</div></div>
                </div>
            </div>`;

        if(p.status === "IN") {
            if(letter !== lastLetterIn) { listIn.innerHTML += `<div class="letter-divider">${letter}</div>`; lastLetterIn = letter; }
            listIn.innerHTML += card;
        } else {
            if(letter !== lastLetterOut) { listOut.innerHTML += `<div class="letter-divider">${letter}</div>`; lastLetterOut = letter; }
            listOut.innerHTML += card;
        }
    });
}

// Filtro di Ricerca
function filtraCards() {
    const term = document.getElementById('searchBox').value.toUpperCase();
    document.querySelectorAll('.replica-card').forEach(c => {
        c.style.display = c.getAttribute('data-filter').toUpperCase().includes(term) ? 'block' : 'none';
    });
}

// Caricamento iniziale
fetchFromCloud();