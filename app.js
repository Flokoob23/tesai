function openModal(row) {
  const modal = document.getElementById('modal');
  const fecha = row.Fecha || new Date().toLocaleDateString();

  // Generar HTML de la lista de ejercicios
  const ejercicios = Object.keys(row)
    .filter(k => k.toLowerCase().includes('ejercicio') && row[k])
    .map(k => row[k]);

  const ejerciciosHtml = ejercicios.map(e => `
    <li>
      ${e}
      <button onclick="buscarEjercicio('${e}')">🔍</button>
    </li>
  `).join('');

  // Generar el contenido del modal
  modal.innerHTML = `
    <div class="modal-content">
      <img src="${row.Foto || './assets/placeholder.jpg'}" alt="Foto de ${row.Nombre}" />
      <h2>${row.Nombre}</h2>
      <p><strong>Fecha:</strong> ${fecha}</p>
      <ul>${ejerciciosHtml}</ul>

      <a href="https://api.whatsapp.com/send?phone=543584328924&text=Hola Coach, tengo dudas con el entrenamiento de hoy (${fecha}). Mi nombre es ${row.Nombre}" target="_blank">
        <button style="background-color: #FFA500; color: white; margin-top: 1rem;">Contactar por WhatsApp</button>
      </a>

      <button onclick="registrarEntrenamiento('${row.Nombre}', '${fecha}', ${JSON.stringify(row)})" 
              style="background-color:green; color:white; margin-top:1rem;">
        ✅ Entrenamiento culminado, avisar al coach
      </button>

      <button onclick="cerrarModal()" style="margin-top:1rem;">Cerrar</button>
    </div>
  `;
  modal.classList.remove('hidden');
}


