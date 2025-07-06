const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQxkxBdNKWZIpxjaS0H38fGSjGe8rS6xP3yLzTpAhdDe0ZZEFgjQQm2GAVjYdEpJn8_t3Ar_J3_vDcw/pub?gid=0&single=true&output=csv';
const scriptUrl = 'https://script.google.com/macros/s/AKfycbzodvHdBCO652XVYgojOCwK0Vkd8fbbNhq23rlaiGwXXAYtX2H1MbHf87jD-9_-D73e/exec';

let atletasRegistrados = {};
let atletasData = [];  // guardar datos completos para filtrar

let sonidoRegistro;

document.addEventListener('DOMContentLoaded', () => {
  Papa.parse(sheetUrl, {
    download: true,
    header: true,
    complete: (results) => {
      atletasData = results.data.filter(row => row.Nombre);
      renderAthletes(atletasData);
    }
  });

  crearModalConfirmacion();
  cargarSonidoRegistro();

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const filtro = searchInput.value.toLowerCase();
    const filtrados = atletasData.filter(atleta =>
      atleta.Nombre.toLowerCase().includes(filtro)
    );
    renderAthletes(filtrados);
  });
});

function renderAthletes(data) {
  const container = document.getElementById('athletesContainer');
  container.innerHTML = '';

  data.forEach(row => {
    if (!row.Nombre) return;
    const card = document.createElement('div');
    card.className = 'athlete-card';
    card.id = `card-${row.Nombre.replace(/\s+/g, '-')}`;
    card.tabIndex = 0;
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Entrenamiento de ${row.Nombre}`);
    card.innerHTML = `<h3>${row.Nombre}</h3>`;
    card.addEventListener('click', () => solicitarClave(row));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        solicitarClave(row);
      }
    });
    container.appendChild(card);
  });
}

function solicitarClave(row) {
  const keys = Object.keys(row);
  const claveKey = keys[keys.length - 1];
  const claveCorrecta = row[claveKey]?.toString().trim();

  const claveIngresada = prompt(`🔒 Ingresá tu clave para acceder a tu entrenamiento, ${row.Nombre}:`);

  if (claveIngresada?.trim() === claveCorrecta) {
    openModal(row);
  } else {
    alert('❌ Clave incorrecta. No podés acceder al entrenamiento.');
  }
}

function openModal(row) {
  const modal = document.getElementById('modal');
  const fecha = row.Fecha || new Date().toLocaleDateString();
  const nombre = row.Nombre;
  const ejercicios = Object.keys(row)
    .filter(k => k.toLowerCase().includes('ejercicio') && row[k])
    .map(k => row[k]);

  const ejerciciosHtml = ejercicios.map(e => `
    <li>
      ${e}
      <button onclick="buscarEjercicio('${e}')" aria-label="Buscar video del ejercicio ${e}">🔍</button>
    </li>
  `).join('');

  const yaRegistrado = atletasRegistrados[nombre + fecha];

  modal.innerHTML = `
    <div class="modal-content" tabindex="0" aria-labelledby="modalTitle">
      <img src="${row.Foto || './assets/placeholder.jpg'}" alt="Foto de ${nombre}" />
      <h2 id="modalTitle">${nombre}</h2>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <ul>${ejerciciosHtml}</ul>

      <a href="https://api.whatsapp.com/send?phone=543584328924&text=${encodeURIComponent('Hola Coach, tengo dudas con el entrenamiento de hoy (' + fecha + '). Mi nombre es ' + nombre)}" target="_blank" rel="noopener noreferrer">
        <button type="button">Contactar por WhatsApp</button>
      </a>

      ${yaRegistrado ? '<p style="color:#4CAF50; font-weight: 700;">✔️ Ya registrado</p>' : `
        <button id="btnRegistrar" type="button" style="background-color:#4CAF50; color:#fff; margin-top:1rem;">
          ✅ Entrenamiento culminado, avisar al coach
        </button>`}

      <button type="button" onclick="cerrarModal()" style="margin-top:1rem; background:#FFA500; color:#fff;">
        Cerrar
      </button>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.querySelector('.modal-content').focus();

  if (!yaRegistrado) {
    document.getElementById('btnRegistrar').addEventListener('click', () => {
      registrarEntrenamiento(nombre, fecha, ejercicios.join(', '));
    });
  }
}

function registrarEntrenamiento(nombre, fecha, ejercicios) {
  const btn = document.getElementById('btnRegistrar');
  btn.disabled = true;
  btn.innerHTML = '⏳ Registrando... <span class="spinner"></span>';

  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('fecha', fecha);
  formData.append('ejercicios', ejercicios);

  fetch(scriptUrl, {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(txt => {
    if (txt.includes("OK")) {
      atletasRegistrados[nombre + fecha] = true;
      mostrarConfirmacion();
      cerrarModal();

      const card = document.getElementById(`card-${nombre.replace(/\s+/g, '-')}`);
      if (card && !card.querySelector('.check-icon')) {
        const check = document.createElement('span');
        check.className = 'check-icon';
        check.innerHTML = ' ✔️';
        card.querySelector('h3').appendChild(check);
      }
    } else if (txt.includes("DUPLICADO")) {
      alert("❗Ya registraste este entrenamiento.");
    } else {
      alert("❌ Error inesperado: " + txt);
    }
  })
  .catch(err => {
    alert("❌ Error de conexión");
    console.error(err);
  })
  .finally(() => {
    btn.disabled = false;
    btn.innerHTML = '✅ Entrenamiento culminado, avisar al coach';
  });
}

function cerrarModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.innerHTML = '';
}

function buscarEjercicio(ejercicio) {
  const url = `https://www.google.com/search?tbm=vid&q=ejercicio+${encodeURIComponent(ejercicio)}`;
  window.open(url, '_blank', 'noopener');
}

function crearModalConfirmacion() {
  const modalConfirm = document.createElement('div');
  modalConfirm.id = 'modalConfirmacion';
  modalConfirm.className = 'hidden';
  modalConfirm.style.position = 'fixed';
  modalConfirm.style.top = '20px';
  modalConfirm.style.right = '20px';
  modalConfirm.style.backgroundColor = '#4CAF50';
  modalConfirm.style.color = 'white';
  modalConfirm.style.padding = '1rem 1.5rem';
  modalConfirm.style.borderRadius = '10px';
  modalConfirm.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  modalConfirm.style.fontWeight = '700';
  modalConfirm.style.fontSize = '1rem';
  modalConfirm.style.userSelect = 'none';
  modalConfirm.innerHTML = '✅ Entrenamiento registrado';
  document.body.appendChild(modalConfirm);
}

function mostrarConfirmacion() {
  const modal = document.getElementById('modalConfirmacion');
  modal.classList.remove('hidden');
  modal.style.transform = 'scale(1.1)';
  sonidoRegistro.play().catch(() => {
    // En caso de bloqueo por autoplay, se ignora el error
  });
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.style.transform = 'scale(1)';
  }, 2300);
}

function cargarSonidoRegistro() {
  sonidoRegistro = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'); // sonido tipo "pinnn"
  sonidoRegistro.load();
}
