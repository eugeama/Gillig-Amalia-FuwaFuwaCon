import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import SistemaRepository, { HORARIO_EVENTO, UBICACION_EVENTO } from '../repositories/SistemaRepository.js';
import {
    BadRequestError,
    ConflictError,
    AuthenticationError,
    NotFoundError,
} from '../exceptions/AppError.js';

const ESTADOS_ACTIVOS = new Set(['pendiente', 'confirmada']);
const HORAS_SIN_CANCELACION = 24;
const TIPOS_USUARIO = new Set(['cliente', 'emprendedor']);

function finFecha(fecha) {
    return new Date(`${fecha}T23:59:59`);
}

function limiteContactoReserva(fecha) {
    return new Date(`${fecha}T00:00:00`).getTime() - 7 * 24 * 60 * 60 * 1000;
}

function inicioFecha(fecha, horario) {
    const hora = /^(\d{2}:\d{2})/.exec(horario ?? '')?.[1] ?? '00:00';
    return new Date(`${fecha}T${hora}:00`);
}

function esFechaValida(fecha) {
    if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return false;
    }
    const fechaLocal = new Date(`${fecha}T00:00:00`);
    return !Number.isNaN(fechaLocal.getTime()) && fechaLocal.toISOString().slice(0, 10) === fecha;
}

function cupoEnFecha(concurso, fecha) {
    return concurso.cupos?.[fecha] ?? 0;
}

function normalizarFechas(fechas) {
    if (!Array.isArray(fechas) || !fechas.length || !fechas.every(esFechaValida)) {
        throw new BadRequestError('Ingresá al menos una fecha válida');
    }
    const ordenadas = [...new Set(fechas)].sort();
    if (new Set(ordenadas.map((fecha) => fecha.slice(0, 7))).size !== 1) {
        throw new BadRequestError('Todas las fechas del evento deben ser del mismo mes');
    }
    if (ordenadas.some((fecha) => finFecha(fecha).getTime() < Date.now())) {
        throw new BadRequestError('No se pueden cargar fechas que ya pasaron');
    }
    return ordenadas;
}

function urlImagenValida(url) {
    try {
        return ['http:', 'https:'].includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

function normalizarEmail(email) {
    return email.trim().toLowerCase();
}

function usuarioPublico(usuario) {
    const { contrasenaHash, ...publico } = usuario;
    return publico;
}

function correoValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarDatosUsuario(datos, { exigirNombre = true, exigirTipo = true, exigirContrasena = true } = {}) {
    if (
        !datos ||
        typeof datos.email !== 'string' ||
        !correoValido(datos.email.trim()) ||
        (exigirNombre && (typeof datos.nombre !== 'string' || !datos.nombre.trim())) ||
        (exigirTipo && !TIPOS_USUARIO.has(datos.tipo)) ||
        typeof datos.fechaNacimiento !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(datos.fechaNacimiento)
    ) {
        throw new BadRequestError('Completá los datos del usuario con valores válidos');
    }

    const fechaNacimiento = new Date(`${datos.fechaNacimiento}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (
        Number.isNaN(fechaNacimiento.getTime()) ||
        fechaNacimiento.toISOString().slice(0, 10) !== datos.fechaNacimiento ||
        fechaNacimiento > hoy
    ) {
        throw new BadRequestError('La fecha de nacimiento no es válida');
    }

    if (exigirContrasena || datos.contrasena !== undefined) {
        if (
            typeof datos.contrasena !== 'string' ||
            (exigirContrasena && !datos.contrasena) ||
            (datos.contrasena && !/(?=(?:.*\p{L}){8})(?=(?:.*\d){2})(?=.*[^\p{L}\p{N}\s])[\s\S]+/u.test(datos.contrasena))
        ) {
            throw new BadRequestError('La contraseña requiere al menos ocho letras, dos números y un signo especial');
        }
    }

    if (
        datos.tipo === 'emprendedor' &&
        (typeof datos.nombreEmprendimiento !== 'string' || !datos.nombreEmprendimiento.trim())
    ) {
        throw new BadRequestError('Ingresá el nombre del emprendimiento');
    }
}

function crearHash(contrasena) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(contrasena, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verificarContrasena(contrasena, almacenada) {
    if (typeof contrasena !== 'string' || typeof almacenada !== 'string') {
        return false;
    }

    const [salt, hash] = almacenada.split(':');
    if (!salt || !hash) {
        return false;
    }

    const candidato = scryptSync(contrasena, salt, 64);
    const esperado = Buffer.from(hash, 'hex');
    return candidato.length === esperado.length && timingSafeEqual(candidato, esperado);
}

export class SistemaService {
    constructor(repository = SistemaRepository) {
        this.repository = repository;
        this.sesiones = new Map();
    }

    get datos() {
        return this.repository.datos;
    }

    guardar() {
        this.repository.guardar();
    }

    registrar(datos) {
        validarDatosUsuario(datos);
        const email = normalizarEmail(datos.email);
        if (this.datos.usuarios.some((usuario) => usuario.email === email)) {
            throw new ConflictError('Ya existe una cuenta con ese email');
        }

        const usuario = {
            id: this.repository.siguienteId('usuario'),
            nombre: datos.nombre.trim(),
            email,
            contrasenaHash: crearHash(datos.contrasena),
            fechaNacimiento: datos.fechaNacimiento,
            tipo: datos.tipo,
            ...(datos.tipo === 'emprendedor' ? { nombreEmprendimiento: datos.nombreEmprendimiento.trim() } : {}),
            fechaRegistro: new Date().toISOString(),
        };
        this.datos.usuarios.push(usuario);
        this.guardar();
        return this.iniciarSesionInterno(usuario);
    }

    crearCliente(datos) {
        validarDatosUsuario({ ...datos, tipo: 'cliente' });
        const email = normalizarEmail(datos.email);
        if (this.datos.usuarios.some((usuario) => usuario.email === email)) {
            throw new ConflictError('Ya existe una cuenta con ese email');
        }
        const usuario = {
            id: this.repository.siguienteId('usuario'),
            nombre: datos.nombre.trim(),
            email,
            contrasenaHash: crearHash(datos.contrasena),
            fechaNacimiento: datos.fechaNacimiento,
            tipo: 'cliente',
            fechaRegistro: new Date().toISOString(),
        };
        this.datos.usuarios.push(usuario);
        this.guardar();
        return usuarioPublico(usuario);
    }

    iniciarSesion(datos = {}) {
        const { email, contrasena } = datos ?? {};
        if (typeof email !== 'string' || typeof contrasena !== 'string') {
            throw new BadRequestError('Ingresá el email y la contraseña');
        }
        const usuario = this.datos.usuarios.find((item) => item.email === normalizarEmail(email));
        if (!usuario || !verificarContrasena(contrasena, usuario.contrasenaHash)) {
            throw new AuthenticationError('El email o la contraseña son incorrectos');
        }
        return this.iniciarSesionInterno(usuario);
    }

    iniciarSesionInterno(usuario) {
        const token = randomBytes(32).toString('base64url');
        this.sesiones.set(token, {
            usuarioId: usuario.id,
            vence: Date.now() + 8 * 60 * 60 * 1000,
        });
        return { token, usuario: usuarioPublico(usuario) };
    }

    obtenerSesion(token) {
        const sesion = this.sesiones.get(token);
        if (!sesion) return null;
        if (sesion.vence <= Date.now()) {
            this.sesiones.delete(token);
            return null;
        }
        const usuario = this.datos.usuarios.find((item) => item.id === sesion.usuarioId);
        if (!usuario) {
            this.sesiones.delete(token);
            return null;
        }
        return usuarioPublico(usuario);
    }

    cerrarSesion(token) {
        if (token) this.sesiones.delete(token);
    }

    listarEventos() {
        this.purgarEventosVencidos();
        return this.datos.eventos.map((evento) => ({
            ...evento,
            cantidadStands: this.datos.stands.filter((stand) => stand.eventoId === evento.id).length,
            cantidadConcursos: this.datos.concursos.filter((concurso) => concurso.eventoId === evento.id).length,
        }));
    }

    obtenerEvento(eventoId) {
        this.purgarEventosVencidos();
        const evento = this.datos.eventos.find((item) => item.id === Number(eventoId));
        if (!evento) throw new NotFoundError('El evento no existe');
        return evento;
    }

    listarStands(eventoId, fecha) {
        const evento = this.obtenerEvento(eventoId);
        const fechaSeleccionada = fecha ?? evento.fechas[0];
        if (!evento.fechas.includes(fechaSeleccionada)) {
            throw new BadRequestError('La fecha no corresponde a este evento');
        }
        return this.datos.stands
            .filter((stand) => stand.eventoId === evento.id && stand.fecha === fechaSeleccionada)
            .map((stand) => {
                const reservaActiva = this.datos.reservas.find(
                    (reserva) => reserva.standId === stand.id && ESTADOS_ACTIVOS.has(reserva.estado)
                );
                return {
                    ...stand,
                    disponible: !reservaActiva,
                    estado: reservaActiva?.estado ?? 'disponible',
                };
            });
    }

    listarConcursos(eventoId, fecha) {
        const evento = this.obtenerEvento(eventoId);
        const fechaSeleccionada = fecha ?? evento.fechas[0];
        if (!evento.fechas.includes(fechaSeleccionada)) {
            throw new BadRequestError('La fecha no corresponde a este evento');
        }
        return this.datos.concursos
            .filter((concurso) => concurso.eventoId === evento.id)
            .map((concurso) => {
                const cupo = cupoEnFecha(concurso, fechaSeleccionada);
                const inscriptos = this.datos.inscripciones.filter(
                    (inscripcion) => inscripcion.concursoId === concurso.id && inscripcion.fecha === fechaSeleccionada
                );
                return {
                    ...concurso,
                    fecha: fechaSeleccionada,
                    cupo,
                    cantidadInscriptos: inscriptos.length,
                    cuposDisponibles: Math.max(0, cupo - inscriptos.length),
                    completo: inscriptos.length >= cupo,
                };
            });
    }

    listarReservas(usuarioId) {
        this.purgarEventosVencidos();
        return this.datos.reservas
            .filter((reserva) => reserva.emprendedorId === usuarioId)
            .map((reserva) => this.reservaCompleta(reserva));
    }

    reservaCompleta(reserva) {
        const evento = this.obtenerEvento(reserva.eventoId);
        const stand = this.datos.stands.find((item) => item.id === reserva.standId);
        const emprendedor = this.datos.usuarios.find((item) => item.id === reserva.emprendedorId);
        return {
            ...reserva,
            evento: {
                id: evento.id,
                nombre: evento.nombre,
                fecha: reserva.fecha,
                horario: evento.horario,
                ubicacion: evento.ubicacion,
                tematica: evento.tematica,
            },
            stand: stand ? { id: stand.id, nombre: stand.nombre, precio: stand.precio } : null,
            emprendedor: emprendedor ? { id: emprendedor.id, nombre: emprendedor.nombre, email: emprendedor.email } : null,
        };
    }

    purgarEventosVencidos() {
        const ahora = Date.now();
        this.purgarReservasSinContacto(ahora);
        const vencidos = this.datos.eventos.filter(
            (evento) => evento.fechas.every((fecha) => finFecha(fecha).getTime() < ahora)
        );
        if (!vencidos.length) return;
        this.quitarEventos(new Set(vencidos.map((evento) => evento.id)));
    }

    purgarReservasSinContacto(ahora) {
        const cantidad = this.datos.reservas.length;
        this.datos.reservas = this.datos.reservas.filter(
            (reserva) => reserva.estado !== 'confirmada' || limiteContactoReserva(reserva.fecha) > ahora
        );
        if (this.datos.reservas.length !== cantidad) this.guardar();
    }

    quitarEventos(idsEventos) {
        const idsConcursos = new Set(
            this.datos.concursos.filter((concurso) => idsEventos.has(concurso.eventoId)).map((concurso) => concurso.id)
        );
        this.datos.inscripciones = this.datos.inscripciones.filter((item) => !idsConcursos.has(item.concursoId));
        this.datos.concursos = this.datos.concursos.filter((concurso) => !idsEventos.has(concurso.eventoId));
        this.datos.reservas = this.datos.reservas.filter((reserva) => !idsEventos.has(reserva.eventoId));
        this.datos.stands = this.datos.stands.filter((stand) => !idsEventos.has(stand.eventoId));
        this.datos.eventos = this.datos.eventos.filter((evento) => !idsEventos.has(evento.id));
        this.guardar();
    }

    eliminarEvento(id) {
        const evento = this.datos.eventos.find((item) => item.id === Number(id));
        if (!evento) throw new NotFoundError('El evento no existe');
        this.quitarEventos(new Set([evento.id]));
    }

    eliminarConcurso(id) {
        const concurso = this.datos.concursos.find((item) => item.id === Number(id));
        if (!concurso) throw new NotFoundError('El concurso no existe');
        this.datos.inscripciones = this.datos.inscripciones.filter((item) => item.concursoId !== concurso.id);
        this.datos.concursos = this.datos.concursos.filter((item) => item.id !== concurso.id);
        this.guardar();
    }

    eliminarNovedad(id) {
        const novedad = this.datos.novedades.find((item) => item.id === Number(id));
        if (!novedad) throw new NotFoundError('La publicación no existe');
        this.datos.novedades = this.datos.novedades.filter((item) => item.id !== novedad.id);
        this.guardar();
    }

    solicitarReserva(usuario, { eventoId, standId }) {
        if (usuario.tipo !== 'emprendedor') {
            throw new BadRequestError('Solo las cuentas de emprendedor pueden solicitar un stand');
        }
        const evento = this.obtenerEvento(eventoId);
        const stand = this.datos.stands.find(
            (item) => item.id === Number(standId) && item.eventoId === evento.id
        );
        if (!stand) throw new NotFoundError('El stand no existe para este evento');
        if (inicioFecha(stand.fecha, evento.horario).getTime() <= Date.now()) {
            throw new ConflictError('No se puede solicitar un stand para una fecha que ya comenzó');
        }

        if (this.datos.reservas.some(
            (reserva) =>
                reserva.eventoId === evento.id &&
                reserva.emprendedorId === usuario.id &&
                ESTADOS_ACTIVOS.has(reserva.estado)
        )) {
            throw new ConflictError('Solo se puede solicitar un stand por persona y por evento');
        }
        if (this.datos.reservas.some(
            (reserva) => reserva.standId === stand.id && ESTADOS_ACTIVOS.has(reserva.estado)
        )) {
            throw new ConflictError('Ese stand ya está ocupado');
        }
        if (!this.listarStands(evento.id, stand.fecha).some((item) => item.disponible)) {
            throw new ConflictError('No quedan stands disponibles para esta fecha');
        }

        const reserva = {
            id: this.repository.siguienteId('reserva'),
            emprendedorId: usuario.id,
            eventoId: evento.id,
            standId: stand.id,
            fecha: stand.fecha,
            estado: 'pendiente',
            fechaSolicitud: new Date().toISOString(),
        };
        this.datos.reservas.push(reserva);
        this.guardar();
        return this.reservaCompleta(reserva);
    }

    eliminarReservaPropia(usuario, reservaId) {
        this.purgarEventosVencidos();
        const reserva = this.datos.reservas.find((item) => item.id === Number(reservaId));
        if (!reserva || reserva.emprendedorId !== usuario.id) {
            throw new NotFoundError('La reserva no existe');
        }
        const evento = this.obtenerEvento(reserva.eventoId);
        if (inicioFecha(reserva.fecha, evento.horario).getTime() - Date.now() < HORAS_SIN_CANCELACION * 60 * 60 * 1000) {
            throw new ConflictError('No se puede eliminar la reserva durante las 24 horas previas al evento');
        }
        this.datos.reservas = this.datos.reservas.filter((item) => item.id !== reserva.id);
        this.guardar();
    }

    listarReservasAdministrador() {
        this.purgarEventosVencidos();
        return this.datos.reservas
            .map((reserva) => this.reservaCompleta(reserva))
            .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
    }

    resolverReserva(reservaId, estado) {
        this.purgarEventosVencidos();
        if (!['confirmada', 'cancelada'].includes(estado)) {
            throw new BadRequestError('El estado debe ser confirmada o cancelada');
        }
        const reserva = this.datos.reservas.find((item) => item.id === Number(reservaId));
        if (!reserva) throw new NotFoundError('La reserva no existe');
        if (reserva.estado !== 'pendiente') {
            throw new ConflictError('Solo se pueden resolver solicitudes pendientes');
        }
        if (estado === 'confirmada' && this.datos.reservas.some(
            (item) => item.id !== reserva.id && item.standId === reserva.standId && item.estado === 'confirmada'
        )) {
            throw new ConflictError('Ese stand ya fue confirmado para otra reserva');
        }
        reserva.estado = estado;
        reserva.fechaResolucion = new Date().toISOString();
        this.guardar();
        return this.reservaCompleta(reserva);
    }

    inscribirEnConcurso(usuario, concursoId, fecha) {
        if (usuario.tipo !== 'cliente') {
            throw new BadRequestError('Solo las cuentas de cliente pueden inscribirse a concursos');
        }
        const concurso = this.datos.concursos.find((item) => item.id === Number(concursoId));
        if (!concurso) throw new NotFoundError('El concurso no existe');
        const evento = this.obtenerEvento(concurso.eventoId);
        if (!evento.fechas.includes(fecha)) {
            throw new BadRequestError('La fecha no corresponde a este evento');
        }
        if (finFecha(fecha).getTime() < Date.now()) {
            throw new ConflictError('No se puede inscribir en una fecha que ya pasó');
        }
        const yaInscripto = this.datos.inscripciones.some(
            (item) => item.concursoId === concurso.id && item.clienteId === usuario.id && item.fecha === fecha
        );
        if (yaInscripto) throw new ConflictError('Ya estás inscripto en este concurso para esta fecha');
        const cantidad = this.datos.inscripciones.filter(
            (item) => item.concursoId === concurso.id && item.fecha === fecha
        ).length;
        if (cantidad >= cupoEnFecha(concurso, fecha)) throw new ConflictError('El concurso ya completó sus cupos para esta fecha');

        const inscripcion = {
            id: this.repository.siguienteId('inscripcion'),
            clienteId: usuario.id,
            concursoId: concurso.id,
            fecha,
            fechaInscripcion: new Date().toISOString(),
        };
        this.datos.inscripciones.push(inscripcion);
        this.guardar();
        return {
            ...inscripcion,
            concurso: { id: concurso.id, nombre: concurso.nombre, eventoId: concurso.eventoId },
        };
    }

    listarInscripciones(usuarioId) {
        return this.datos.inscripciones
            .filter((inscripcion) => inscripcion.clienteId === usuarioId)
            .map((inscripcion) => this.inscripcionCompleta(inscripcion));
    }

    listarInscripcionesAdministrador() {
        this.purgarEventosVencidos();
        return this.datos.inscripciones.map((inscripcion) => ({
            ...this.inscripcionCompleta(inscripcion),
            cliente: this.clienteResumen(inscripcion.clienteId),
        }));
    }

    clienteResumen(clienteId) {
        const cliente = this.datos.usuarios.find((usuario) => usuario.id === clienteId);
        return cliente ? { id: cliente.id, nombre: cliente.nombre, email: cliente.email } : null;
    }

    inscripcionCompleta(inscripcion) {
        const concurso = this.datos.concursos.find((item) => item.id === inscripcion.concursoId);
        const evento = concurso ? this.obtenerEvento(concurso.eventoId) : null;
        return {
            ...inscripcion,
            concurso: concurso ? { id: concurso.id, nombre: concurso.nombre, eventoId: concurso.eventoId } : null,
            evento: evento ? { id: evento.id, nombre: evento.nombre, horario: evento.horario, ubicacion: evento.ubicacion } : null,
        };
    }

    cancelarInscripcion(usuario, inscripcionId) {
        this.purgarEventosVencidos();
        const inscripcion = this.datos.inscripciones.find((item) => item.id === Number(inscripcionId));
        if (!inscripcion || inscripcion.clienteId !== usuario.id) {
            throw new NotFoundError('La inscripción no existe');
        }
        const evento = this.obtenerEvento(this.datos.concursos.find((item) => item.id === inscripcion.concursoId).eventoId);
        const limite = inicioFecha(inscripcion.fecha, evento.horario).getTime() - 24 * 60 * 60 * 1000;
        if (Date.now() >= limite) {
            throw new ConflictError('No se puede cancelar la inscripción dentro de las 24 horas previas al evento');
        }
        this.datos.inscripciones = this.datos.inscripciones.filter((item) => item.id !== inscripcion.id);
        this.guardar();
    }

    eliminarInscripcion(id) {
        const inscripcion = this.datos.inscripciones.find((item) => item.id === Number(id));
        if (!inscripcion) throw new NotFoundError('La inscripción no existe');
        this.datos.inscripciones = this.datos.inscripciones.filter((item) => item.id !== inscripcion.id);
        this.guardar();
    }

    eliminarReserva(id) {
        const reserva = this.datos.reservas.find((item) => item.id === Number(id));
        if (!reserva) throw new NotFoundError('La reserva no existe');
        this.datos.reservas = this.datos.reservas.filter((item) => item.id !== reserva.id);
        this.guardar();
    }

    crearEvento(datos) {
        if (
            !datos ||
            typeof datos.nombre !== 'string' || !datos.nombre.trim() ||
            typeof datos.tematica !== 'string'
        ) {
            throw new BadRequestError('Completá nombre y temática');
        }
        const fechas = normalizarFechas(datos.fechas);
        const mes = fechas[0].slice(0, 7);
        if (this.datos.eventos.some((evento) => evento.mes === mes)) {
            throw new ConflictError('Ya existe un evento para ese mes');
        }
        const hoy = new Date();
        const mesCreacion = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
        if (this.datos.eventos.some((evento) => evento.creadoEn === mesCreacion)) {
            throw new ConflictError('Ya creaste un evento este mes. Podrás crear otro cuando termine el mes');
        }
        const evento = {
            id: this.repository.siguienteId('evento'),
            nombre: datos.nombre.trim(),
            tematica: datos.tematica.trim(),
            mes,
            creadoEn: mesCreacion,
            fechas,
            horario: HORARIO_EVENTO,
            descripcion: typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '',
            ubicacion: UBICACION_EVENTO,
        };
        this.datos.eventos.push(evento);
        for (const fecha of fechas) {
            this.repository.asegurarMesas(evento.id, fecha);
        }
        this.guardar();
        return evento;
    }

    actualizarEvento(eventoId, datos) {
        const evento = this.obtenerEvento(eventoId);
        datos ??= {};
        for (const campo of ['nombre', 'tematica', 'descripcion']) {
            if (datos[campo] !== undefined && typeof datos[campo] !== 'string') {
                throw new BadRequestError(`El campo ${campo} debe ser texto`);
            }
        }
        if (datos.nombre !== undefined && !datos.nombre.trim()) {
            throw new BadRequestError('Ingresá el nombre del evento');
        }
        const fechas = datos.fechas === undefined ? evento.fechas : normalizarFechas(datos.fechas);
        if (fechas[0].slice(0, 7) !== evento.mes) {
            throw new BadRequestError('Las fechas deben ser del mes del evento');
        }

        const fechasQuitadas = evento.fechas.filter((fecha) => !fechas.includes(fecha));
        const reservasDeFechasQuitadas = (reserva) =>
            reserva.eventoId === evento.id && fechasQuitadas.includes(reserva.fecha);
        if (this.datos.reservas.some(
            (reserva) => reservasDeFechasQuitadas(reserva) && ESTADOS_ACTIVOS.has(reserva.estado)
        )) {
            throw new ConflictError('No se puede quitar una fecha con reservas activas');
        }
        this.datos.reservas = this.datos.reservas.filter((reserva) => !reservasDeFechasQuitadas(reserva));
        this.datos.stands = this.datos.stands.filter(
            (stand) => !(stand.eventoId === evento.id && fechasQuitadas.includes(stand.fecha))
        );
        const concursosDelEvento = this.datos.concursos.filter((concurso) => concurso.eventoId === evento.id);
        for (const concurso of concursosDelEvento) {
            for (const fecha of fechasQuitadas) delete concurso.cupos[fecha];
        }
        const idsConcursosDelEvento = new Set(concursosDelEvento.map((concurso) => concurso.id));
        this.datos.inscripciones = this.datos.inscripciones.filter(
            (inscripcion) => !(idsConcursosDelEvento.has(inscripcion.concursoId) && fechasQuitadas.includes(inscripcion.fecha))
        );
        for (const fecha of fechas) {
            this.repository.asegurarMesas(evento.id, fecha);
        }

        evento.nombre = (datos.nombre ?? evento.nombre).trim();
        evento.tematica = (datos.tematica ?? evento.tematica).trim();
        evento.descripcion = (datos.descripcion ?? evento.descripcion ?? '').trim();
        evento.fechas = fechas;
        evento.horario = HORARIO_EVENTO;
        evento.ubicacion = UBICACION_EVENTO;
        this.guardar();
        return evento;
    }

    crearConcurso(eventoId, datos) {
        const evento = this.obtenerEvento(eventoId);
        if (!datos || typeof datos.nombre !== 'string' || !datos.nombre.trim()) {
            throw new BadRequestError('Ingresá el nombre del concurso');
        }
        const cupos = {};
        for (const fecha of evento.fechas) {
            const cupo = Number(datos.cupos?.[fecha]);
            if (!Number.isInteger(cupo) || cupo < 1) {
                throw new BadRequestError('Ingresá un cupo mayor a cero para cada fecha del evento');
            }
            cupos[fecha] = cupo;
        }
        const concurso = {
            id: this.repository.siguienteId('concurso'),
            eventoId: evento.id,
            nombre: datos.nombre.trim(),
            descripcion: typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '',
            cupos,
        };
        this.datos.concursos.push(concurso);
        this.guardar();
        return concurso;
    }

    listarNovedades() {
        return [...this.datos.novedades].sort((a, b) => b.id - a.id);
    }

    crearNovedad(datos) {
        const imagen = typeof datos?.imagen === 'string' ? datos.imagen.trim() : '';
        if (
            !datos ||
            typeof datos.titulo !== 'string' || !datos.titulo.trim() ||
            typeof datos.texto !== 'string' || !datos.texto.trim() ||
            (imagen && !urlImagenValida(imagen))
        ) {
            throw new BadRequestError('Completá el título y el texto; la imagen debe ser un link http o https');
        }
        const novedad = {
            id: this.repository.siguienteId('novedad'),
            titulo: datos.titulo.trim(),
            texto: datos.texto.trim(),
            imagen: imagen || null,
            fechaCreacion: new Date().toISOString(),
        };
        this.datos.novedades.push(novedad);
        this.guardar();
        return novedad;
    }

    listarUsuarios() {
        return this.datos.usuarios.map(usuarioPublico);
    }

    actualizarUsuario(id, datos) {
        datos ??= {};
        const usuario = this.datos.usuarios.find((item) => item.id === Number(id));
        if (!usuario) throw new NotFoundError('El usuario no existe');
        const nuevoEmail = typeof datos.email === 'string' ? normalizarEmail(datos.email) : usuario.email;
        if (
            nuevoEmail !== usuario.email &&
            this.datos.usuarios.some((item) => item.id !== usuario.id && item.email === nuevoEmail)
        ) {
            throw new ConflictError('Ya existe una cuenta con ese email');
        }
        const actualizados = {
            nombre: datos.nombre ?? usuario.nombre,
            email: nuevoEmail,
            fechaNacimiento: datos.fechaNacimiento ?? usuario.fechaNacimiento,
            tipo: usuario.tipo,
            contrasena: datos.contrasena,
        };
        validarDatosUsuario(actualizados, {
            exigirNombre: false,
            exigirTipo: false,
            exigirContrasena: false,
        });
        if (typeof actualizados.nombre !== 'string' || !actualizados.nombre.trim()) {
            throw new BadRequestError('Ingresá el nombre del usuario');
        }
        usuario.nombre = actualizados.nombre.trim();
        usuario.email = nuevoEmail;
        usuario.fechaNacimiento = actualizados.fechaNacimiento;
        if (actualizados.contrasena) usuario.contrasenaHash = crearHash(actualizados.contrasena);
        this.guardar();
        return usuarioPublico(usuario);
    }

    asignarAdministrador(id) {
        const usuario = this.datos.usuarios.find((item) => item.id === Number(id));
        if (!usuario) throw new NotFoundError('El usuario no existe');
        if (usuario.tipo === 'administrador') throw new ConflictError('El usuario ya es administrador');
        usuario.tipo = 'administrador';
        this.guardar();
        return usuarioPublico(usuario);
    }

    eliminarUsuario(id) {
        const indice = this.datos.usuarios.findIndex((usuario) => usuario.id === Number(id));
        if (indice < 0) throw new NotFoundError('El usuario no existe');
        const usuario = this.datos.usuarios[indice];
        if (usuario.tipo === 'administrador') {
            throw new ConflictError('No se puede eliminar una cuenta de administrador desde el panel');
        }
        if (usuario.tipo === 'emprendedor' && this.datos.reservas.some(
            (reserva) => reserva.emprendedorId === usuario.id && ESTADOS_ACTIVOS.has(reserva.estado)
        )) {
            throw new ConflictError('No se puede eliminar un emprendedor con reservas activas');
        }
        this.datos.usuarios.splice(indice, 1);
        this.datos.inscripciones = this.datos.inscripciones.filter((item) => item.clienteId !== usuario.id);
        this.guardar();
    }

}

export default new SistemaService();
