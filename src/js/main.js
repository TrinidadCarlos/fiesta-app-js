document.addEventListener('DOMContentLoaded', () => {
  asignarEventoNav();
  //cargar la sección de "adornos" por default
  cambiarSeccion('adornos');
  ajustesFormulario();
  permisoNotificacion();
});

let ubicacion = 'adornos'; //muestra el titulo de la pestaña por default
let referenciaServicios = []; //guardara el lote de servicios traidos... ver en función de consultarAPI
let servicioAgregado = []; //guarda los servicios que selecciona el usuario para "comprar"
const contenedorCard = document.querySelector('#contenedorCard');
contenedorCard.addEventListener('click', evaluarServicio); //para detectar el click al boton "seleccionar" pero al ser generado dinámicamente, no se puede asignar el evento directamente al botón, por eso se le asigna al padre (delegacion de eventos)
const contenedorCardResumen = document.querySelector('#contenedorCardResumen');
const formulario = document.querySelector('#formulario');
formulario.addEventListener('submit', revisarFormulario);
const seccionResumen = document.querySelector('#seccionResumen');
const rutaImgErrorApi = '../../build/img/error-servicios.png';
const rutaImgErrorForm = '../../build/img/error-formulario.jpg';
const links = document.querySelectorAll('.navegacion .nav-item');

function permisoNotificacion() {
  if (("Notification" in window)){
    Notification.requestPermission();
  }
  return;
}

function asignarEventoNav() {
  links.forEach(link => {
    link.addEventListener('click', ubicacionNav);
  });
}

function ubicacionNav(e) {
  //da la clase active
  links.forEach(link => {
    if (link.classList.contains('active')) {
      link.classList.remove('active');
    }
  });
  e.target.classList.add('active');

  //SE PASA LA UBICACIÓN CONTENIDO EN EL DATASET.ID DEL ENLACE SELECCIONADO Y ASI PINTAR EL TITULO DE LA SECCIÓN SELECCIONADA
  ubicacion = e.target.dataset.id;
 cambiarSeccion(ubicacion);
}

function cambiarSeccion(nombreSeccion) {
  document.querySelector('#tituloSeccion').textContent = nombreSeccion;
  nombreSeccion === 'resumen' ? mostrarResumen() : consultarAPI(nombreSeccion);
}

async function consultarAPI(seccion) {
  //JSON SERVER DEBE DE INICIARSE EN EL PUERTO 3500 CUALQUIER OTRO PUERTO O RUTA DEBE SER MODIFICADA AQUI
  const rutaBase = 'http://localhost:3500/';
  const seccionApi = seccion;
  const rutaCompleta = rutaBase + seccionApi;

  try {
    const peticion = await fetch(rutaCompleta);
    const data = await peticion.json();
    //referenciaServicios guarda los servicios traidos para que cuando el usuario seleccione un servicio, no se haga la consulta con fetch, solo se realiza un filtrado a al variable referenciaServicios
    referenciaServicios = data;
    //Pinta los datos traidos de la api fake 
    pintarDatos(data);
  } catch (error) {
    alertas('Ouch!!', 'Lo sentimos, algo pasa al consultar nuestros servicios. revise su conexión a internet o intentelo más tarde. Gracias', rutaImgErrorApi);
  }
}

function pintarDatos(data) {
  //SE LIMPIA EL CONTENEDOR DE LAS CARDS PARA MOSTRAR LA NUEVA SELECCIÓN
  limpiarContenido();
  //SE OCULTA FORMULARIO Y SE MUESTRAN LA SECCIÓN CON CARDS
  seccionResumen.classList.add('ocultar');
  contenedorCard.classList.remove('ocultar');

  const fragment = document.createDocumentFragment();
  const tempCard = document.querySelector('#templateCard').content;

  data.forEach(servicio => {
    const {
      idServicio,
      nombre,
      piezas,
      precio,
      detalles
    } = servicio;
    tempCard.querySelector('#cardTitulo').textContent = nombre;
    tempCard.querySelector('#cardCantidad span').textContent = piezas;
    tempCard.querySelector('#cardPrecio span').textContent = precio;
    tempCard.querySelector('#cardSeleccionar').dataset.id = idServicio;
    tempCard.querySelector('#cardDetalle span').textContent = detalles;

    const clone = tempCard.cloneNode(true);
    fragment.appendChild(clone);
  });
  contenedorCard.appendChild(fragment);

}

function mostrarResumen() {
  limpiarContenido();
  //convierte a string el objeto para insertarlo en el textArea oculto y enviarlo en el formData al ejecutar la función enviarDatos
  prepararServiciosForm();
  if (seccionResumen.classList.contains('ocultar')) {
    seccionResumen.classList.remove('ocultar');
    seccionResumen.classList.add('mostrar');
    contenedorCard.classList.add('ocultar');
  }
  //pintar Resumen en HTML
  return pintarResumen();
}

function pintarResumen() {
  const alertaResumen = document.querySelector('#alertaResumen');
  const tempResumen = document.querySelector('#templateResumenCard').content;
  const fragment = document.createDocumentFragment();
  limpiarResumen();

  if (servicioAgregado.length < 1) {
    formulario.classList.add('ocultar');
    alertaResumen.textContent = ' Aún no ha seleccionado servicios...';
    document
    return;
  }
  formulario.classList.remove('ocultar');
  contenedorCardResumen.addEventListener('click', acciones);
  alertaResumen.textContent = '';
  servicioAgregado.forEach(servicio => {
    const {
      idServicio,
      nombre,
      piezas,
      precio,
      detalles,
      totalPiezas,
      totalPrecio,
      cantidad
    } = servicio;
    tempResumen.querySelector('#resumenTitulo').textContent = nombre;
    tempResumen.querySelector('#resumenDetalle span').textContent = detalles;
    tempResumen.querySelector('#resumenPiezas span').textContent = piezas;
    tempResumen.querySelector('#resumenPrecio span').textContent = precio;
    tempResumen.querySelector('#resumenCantidad span').textContent = cantidad;
    tempResumen.querySelector('#resumenPiezasTotal span').textContent = totalPiezas;
    tempResumen.querySelector('#resumenPrecioTotal span').textContent = totalPrecio;
    tempResumen.querySelector('#sumarServicio').dataset.id = idServicio;
    tempResumen.querySelector('#removerServicio').dataset.id = idServicio;

    const clone = tempResumen.cloneNode(true);
    fragment.appendChild(clone);
  });
  contenedorCardResumen.appendChild(fragment);
  return;
}


function evaluarServicio(e) {
  const idSeleccionado = e.target.id;
  if (idSeleccionado !== 'cardSeleccionar') return null;

  //filtrar el servicio seleccionado de entre todos los disponibles
  const servicioArray = referenciaServicios.filter(servicio => servicio.idServicio === e.target.dataset.id);
  const servicioObj = servicioArray.pop();
  //comprobar si ya se eligió anteriormente el servicio o no
  const existe = comprobarExistencia(servicioObj);

  //agregar el servicio si no existe
  //se agrega a "servicioAgregado" y se usa .pop() ya que servicio es [{}] y queremos {}... 
  existe ? actualizarSumarServicio(servicioObj) : agregarServicioNuevo(servicioObj);
  //se notifica al usuario que ya tiene un "resumen" que ver
  notificacionMovimiento();
  return;

}

function comprobarExistencia(servicioObj) {
  if (servicioAgregado.some(ser => ser.idServicio === servicioObj.idServicio)) {
    return true;
  } else {
    return false;
  }
}

function agregarServicioNuevo(servicioObj) {
  servicioObj.totalPrecio = servicioObj.precio;
  servicioObj.totalPiezas = servicioObj.piezas;
  return servicioAgregado = [...servicioAgregado, servicioObj];
}

function actualizarSumarServicio(servicioObj) {
  servicioAgregado.map(s => {
    if (s.idServicio === servicioObj.idServicio) {
      s.cantidad++;
      s.totalPrecio = (s.precio * s.cantidad);
      s.totalPiezas = (s.cantidad * s.piezas);
    }
    return s;
  });
}

function actualizarRestarServicio(servicioObj) {
  servicioAgregado.map(s => {
    if (s.idServicio === servicioObj.idServicio) {
      s.cantidad--;
      s.totalPrecio = (s.cantidad * s.precio);
      s.totalPiezas = (s.cantidad * s.piezas);
      return s;
    }
  });

  servicioAgregado.forEach((servicio, index, serviciosArray) => {
    if (servicio.idServicio === servicioObj.idServicio && servicio.cantidad < 1) {
      servicioActualizado = serviciosArray.filter(s => s.cantidad !== 0);
      return servicioAgregado = servicioActualizado;
    }

  });
}


function notificacionMovimiento() {
  const resumen = document.querySelector('#resumen');
  servicioAgregado.length > 0 ? resumen.classList.add('notificacion') : resumen.classList.remove('notificacion');

  if (Notification.permission === 'granted') {
    let notificar = new Notification('Has agregado un nuevo servicio. Ver resumen');
    setTimeout(notificar.close.bind(notificar), 5000);
  }
  return;
}


function acciones(e) {
  let servicioObj = servicioAgregado.filter(s => s.idServicio === e.target.dataset.id);
  servicioObj = servicioObj.pop();

  if (e.target.id === 'sumarServicio') {
    actualizarSumarServicio(servicioObj);
    prepararServiciosForm();
    return pintarResumen();
  } else if (e.target.id === 'removerServicio') {
    actualizarRestarServicio(servicioObj);
    notificacionMovimiento();
    prepararServiciosForm();
    return pintarResumen();
  }
}

function limpiarContenido() {
  while (contenedorCard.firstChild) {
    contenedorCard.removeChild(contenedorCard.firstChild);
  }
  return;

}

function limpiarResumen() {
  while (contenedorCardResumen.firstElementChild) {
    contenedorCardResumen.removeChild(contenedorCardResumen.firstChild);
  }
  return;
}

function alertas(titulo, texto, ruta) {
  return Swal.fire({
    title: titulo,
    text: texto,
    imageUrl: ruta,
    imageWidth: 350,
    imageHeight: 200,
    confirmButtonText: 'Entendido'
  })
}

//FORMULARIO
function ajustesFormulario() {
  const fecha = new Date();
  let anio = fecha.getFullYear();
  let mes = fecha.getMonth() + 1;
  let dia = fecha.getDate();

  mes = mes < 10 ? 0 + '' + mes : mes;
  dia = dia < 10 ? 0 + '' + dia : dia;

  const fechaActual = `${anio}-${mes}-${dia}`;
  document.querySelector('#fecha').setAttribute('min', fechaActual);
  return;
}


function revisarFormulario(e) {
  e.preventDefault();
  const regexCorreo = /\S+@\S+\.\S+/;

  const datos = new FormData(formulario);
  const campos = Array.from(datos.values());
  //revisa que todos los campos este commpletos
  const datosCompletos = campos.every(c => c.trim() !== '');

  if (datosCompletos) {
    enviarDatos(datos);
  }
  if (!datosCompletos) {
    return alertas('Revisar campos', 'Todos los campos son obligatorios', rutaImgErrorForm);
  }
  if (!regexCorreo.test(datos.get('correo'))) {
    return alertas('Revisar correo', 'El correo no parece ser válido', rutaImgErrorForm);
  }
}

function prepararServiciosForm() {
  const servicios = JSON.stringify(servicioAgregado);
  document.querySelector('#selecciones').textContent = servicios;
  return;
}

function enviarDatos(datos) {
  console.log(Array.from(datos.entries()));

  alertas('AVISO', 'falta agregar ajax para enviar los datos f12 para ver el console log con los datos que se enviarían');
  // const url = 'http://localhost:3500/servicios';
  // fetch(url, {
  //     method: 'POST',
  //     body: new FormData(formulario),
  //     // headers: {
  //     //   "Content-type": "application/json; charset=UTF-8"
  //     // }
  //   })
  //   .then(res => {
  //     console.log(res);
  //   })
  //   .catch(error => {
  //     alertas('Error de envío', 'Ha ocurrido un error al enviar sus datos', rutaImgErrorApi);
  //   })

  // // return;
}











// async function consultarFakeApi() {

//   try {
//     await Promise.all([
//         fetch('http://localhost:3500/adornos'),
//         fetch('http://localhost:3500/bebidas'),
//         fetch('http://localhost:3500/alimentos'),
//         fetch('http://localhost:3500/entretenimiento')
//       ])
//       .then(res => {
//         return Promise.all(res.map(p => p.json()))
//       })
//       .then(data => console.log(data));
//   } catch (error) {
//     errores('Ouch!!', 'Lo sentimos, algo pasa al consultar nuestros servicios. revise su conexión a internet o intentelo más tarde. Gracias', rutaImgErrorApi);
//   }

// }