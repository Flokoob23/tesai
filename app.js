const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQxkxBdNKWZIpxjaS0H38fGSjGe8rS6xP3yLzTpAhdDe0ZZEFgjQQm2GAVjYdEpJn8_t3Ar_J3_vDcw/pub?gid=0&single=true&output=csv';
const scriptUrl = 'https://script.google.com/macros/s/AKfycbybFdeB13NvnFJRx15ctBwhrE36mTKyyMTLEPoKVYNiCVck_xdy_DZ58cAyPw6an9-wwg/exec';

document.addEventListener('DOMContentLoaded', () => {
  Papa.parse(sheetUrl, {
    download: true,
    header: true,
    complete: function(results) {
      renderAthletes(results.data);
    }
  });
});

function renderAthletes(data) {
  const container = document.getElementById('athletesContainer');
  container.innerHTML = ''; // limpiar antes de renderizar
  data.forEach((row) => {
    if (!row.Nombre) return;

    const card = document.createElement('div');
    card.className = 'athlete-card';
    card.innerHTML = `<h3>${row.Nombre}</h3>`;
    card.addEventListener('click', () => openModal(row));
    container.appendChild(card);
  });
}

function openModal(row) {
  const modal = document.getElementById('modal');
  const fecha = row.Fecha || new Date().toLocaleDateString();

  const entrenamientoHtml = Object.keys(row)
    .filter(k => k.toLowerCase().includes('ejercicio') && row[k])
    .map(e => `
      <li>
        ${row[e]}
        <button onclick="buscarEjercicio('${row[e]}')">🔍</button>
      </li>`).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <img src="${row.Foto || './assets/placeholder.jpg'}" alt="Foto de ${row.Nombre}" />
      <h2>${row.Nombre}</h2>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <ul>${entrenamientoHtml}</ul>

      <a href="https://api.whatsapp.com/send?phone=543584328924&text=Hola Coach, tengo dudas con el entrenamiento de hoy (${fecha}). Mi nombre es ${row.Nombre}" target="_blank">
        <button>Contactar por WhatsApp</button>
      </a>

      <button onclick="registrarEntrenamiento('${row.Nombre}', '${fecha}', ${JSON.stringify(row)})" style="background-color:green; color:white; margin-top:1rem;">
        Entrenamiento culminado, avisar al coach
      </button>

      <button onclick="cerrarModal()" style="margin-top:1rem;">Cerrar</button>
    </div>
  `;
  modal.classList.remove('hidden');
}

function cerrarModal() {
  document.getElementById('modal').classList.add('hidden');
}

function buscarEjercicio(ejercicio) {
  const url = `https://www.google.com/search?tbm=vid&q=ejercicio+${encodeURIComponent(ejercicio)}`;
  window.open(url, '_blank');
}

function registrarEntrenamiento(nombre, fecha, row) {
  const ejercicios = Object.keys(row)
    .filter(k => k.toLowerCase().includes('ejercicio') && row[k])
    .map(k => row[k]);

  fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify({
      nombre,
      fecha,
      ejercicios
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(res => res.text())
  .then(txt => {
    alert("✅ Entrenamiento registrado con éxito");
    cerrarModal();
  })
  .catch(err => {
    alert("❌ Error al registrar entrenamiento");
    console.error(err);
  });
}

