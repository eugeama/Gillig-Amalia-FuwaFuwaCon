import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import SistemaRepository from '../repositories/SistemaRepository.js';
import {
    BadRequestError,
    ConflictError,
    AuthenticationError,
    NotFoundError,
    ServiceUnavailableError,
} from '../exceptions/AppError.js';

const ESTADOS_ACTIVOS = new Set(['pendiente', 'confirmada']);
const TIPOS_USUARIO = new Set(['cliente', 'emprendedor']);

function finEvento(evento) {
    const fechaFin = new Date(`${evento.fecha}T23:59:59`);
    if (Number.isNaN(fechaFin.getTime())) {
        return new Date(`${evento.fecha}T23:59:59`);
    }
    return fechaFin;
}

function inicioEvento(evento) {
    const horario = /^\d{2}:\d{2}$/.test(evento.horario ?? '') ? evento.horario : '00:00';
    return new Date(`${evento.fecha}T${horario}:00`);
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

    iniciarAdministrador(datos = {}) {
        const { email, nombre, contrasena, clave } = datos ?? {};
        if (!process.env.ADMIN_SETUP_KEY) {
            throw new ServiceUnavailableError('La configuración de la cuenta inicial de administrador no está habilitada');
        }
        if (clave !== process.env.ADMIN_SETUP_KEY) {
            throw new BadRequestError('La clave de configuración no es válida');
        }
        if (this.datos.usuarios.some((usuario) => usuario.tipo === 'administrador')) {
            throw new ConflictError('La cuenta inicial de administrador ya fue creada');
        }
        validarDatosUsuario({ email, nombre, contrasena, fechaNacimiento: '1900-01-01' }, {
            exigirTipo: false,
        });
        const emailNormalizado = normalizarEmail(email);
        if (this.datos.usuarios.some((usuario) => usuario.email === emailNormalizado)) {
            throw new ConflictError('Ya existe una cuenta con ese email');
        }
        const usuario = {
            id: this.repository.siguienteId('usuario'),
            nombre: nombre.trim(),
            email: emailNormalizado,
            contrasenaHash: crearHash(contrasena),
            fechaNacimiento: '1900-01-01',
            tipo: 'administrador',
            fechaRegistro: new Date().toISOString(),
        };
        this.datos.usuarios.push(usuario);
        this.guardar();
        return this.iniciarSesionInterno(usuario);
    }

    listarEventos() {
        return this.datos.eventos.map((evento) => ({
            ...evento,
            cantidadStands: this.datos.stands.filter((stand) => stand.eventoId === evento.id).length,
            cantidadConcursos: this.datos.concursos.filter((concurso) => concurso.eventoId === evento.id).length,
        }));
    }

    obtenerEvento(eventoId) {
        const evento = this.datos.eventos.find((item) => item.id === Number(eventoId));
        if (!evento) throw new NotFoundError('El evento no existe');
        return evento;
    }

    listarStands(eventoId) {
        const evento = this.obtenerEvento(eventoId);
        this.finalizarReservasVencidas(evento);
        return this.datos.stands
            .filter((stand) => stand.eventoId === evento.id)
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

    listarConcursos(eventoId) {
        const evento = this.obtenerEvento(eventoId);
        return this.datos.concursos
            .filter((concurso) => concurso.eventoId === evento.id)
            .map((concurso) => {
                const inscriptos = this.datos.inscripciones.filter((inscripcion) => inscripcion.concursoId === concurso.id);
                return {
                    ...concurso,
                    cantidadInscriptos: inscriptos.length,
                    cuposDisponibles: Math.max(0, concurso.cupo - inscriptos.length),
                    completo: inscriptos.length >= concurso.cupo,
                };
            });
    }

    listarReservas(usuarioId) {
        this.finalizarReservasVencidas();
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
                fecha: evento.fecha,
                horario: evento.horario,
                ubicacion: evento.ubicacion,
                tematica: evento.tematica,
            },
            stand: stand ? { id: stand.id, nombre: stand.nombre, precio: stand.precio } : null,
            emprendedor: emprendedor ? { id: emprendedor.id, nombre: emprendedor.nombre, email: emprendedor.email } : null,
        };
    }

    finalizarReservasVencidas(eventoFiltrado = null) {
        const ahora = Date.now();
        let cambio = false;
        for (const reserva of this.datos.reservas) {
            if (!ESTADOS_ACTIVOS.has(reserva.estado)) continue;
            const evento = eventoFiltrado ?? this.datos.eventos.find((item) => item.id === reserva.eventoId);
            if (!evento || evento.id !== reserva.eventoId || finEvento(evento).getTime() >= ahora) continue;
            reserva.estado = 'finalizada';
            reserva.fechaFinalizacion = new Date(ahora).toISOString();
            cambio = true;
        }
        if (cambio) this.guardar();
    }

    solicitarReserva(usuario, { eventoId, standId }) {
        if (usuario.tipo !== 'emprendedor') {
            throw new BadRequestError('Solo las cuentas de emprendedor pueden solicitar un stand');
        }
        const evento = this.obtenerEvento(eventoId);
        if (inicioEvento(evento).getTime() <= Date.now()) {
            throw new ConflictError('No se puede solicitar un stand para un evento que ya comenzó');
        }
        const stand = this.datos.stands.find(
            (item) => item.id === Number(standId) && item.eventoId === evento.id
        );
        if (!stand) throw new NotFoundError('El stand no existe para este evento');

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
        if (!this.listarStands(evento.id).some((item) => item.disponible)) {
            throw new ConflictError('No quedan stands disponibles para este evento');
        }

        const reserva = {
            id: this.repository.siguienteId('reserva'),
            emprendedorId: usuario.id,
            eventoId: evento.id,
            standId: stand.id,
            estado: 'pendiente',
            fechaSolicitud: new Date().toISOString(),
        };
        this.datos.reservas.push(reserva);
        this.guardar();
        return this.reservaCompleta(reserva);
    }

    cancelarReserva(usuario, reservaId) {
        this.finalizarReservasVencidas();
        const reserva = this.datos.reservas.find((item) => item.id === Number(reservaId));
        if (!reserva || (usuario.tipo !== 'administrador' && reserva.emprendedorId !== usuario.id)) {
            throw new NotFoundError('La reserva no existe');
        }
        if (!ESTADOS_ACTIVOS.has(reserva.estado)) {
            throw new ConflictError('La reserva ya no se puede cancelar');
        }
        const evento = this.obtenerEvento(reserva.eventoId);
        const limite = inicioEvento(evento).getTime() - 24 * 60 * 60 * 1000;
        if (Date.now() >= limite) {
            throw new ConflictError('No se puede cancelar dentro de las 24 horas previas al evento');
        }
        reserva.estado = 'cancelada';
        reserva.fechaCancelacion = new Date().toISOString();
        this.guardar();
        return this.reservaCompleta(reserva);
    }

    listarReservasAdministrador() {
        this.finalizarReservasVencidas();
        return this.datos.reservas
            .map((reserva) => this.reservaCompleta(reserva))
            .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
    }

    resolverReserva(reservaId, estado) {
        this.finalizarReservasVencidas();
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

    inscribirEnConcurso(usuario, concursoId) {
        if (usuario.tipo !== 'cliente') {
            throw new BadRequestError('Solo las cuentas de cliente pueden inscribirse a concursos');
        }
        const concurso = this.datos.concursos.find((item) => item.id === Number(concursoId));
        if (!concurso) throw new NotFoundError('El concurso no existe');
        const evento = this.obtenerEvento(concurso.eventoId);
        if (inicioEvento(evento).getTime() <= Date.now()) {
            throw new ConflictError('No se puede inscribir en un concurso de un evento que ya comenzó');
        }
        const yaInscripto = this.datos.inscripciones.some(
            (item) => item.concursoId === concurso.id && item.clienteId === usuario.id
        );
        if (yaInscripto) throw new ConflictError('Ya estás inscripto en este concurso');
        const cantidad = this.datos.inscripciones.filter((item) => item.concursoId === concurso.id).length;
        if (cantidad >= concurso.cupo) throw new ConflictError('El concurso ya completó sus cupos');

        const inscripcion = {
            id: this.repository.siguienteId('inscripcion'),
            clienteId: usuario.id,
            concursoId: concurso.id,
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
            .map((inscripcion) => {
                const concurso = this.datos.concursos.find((item) => item.id === inscripcion.concursoId);
                return {
                    ...inscripcion,
                    concurso: concurso ? { id: concurso.id, nombre: concurso.nombre, eventoId: concurso.eventoId } : null,
                };
            });
    }

    crearEvento(datos) {
        if (
            !datos ||
            typeof datos.nombre !== 'string' || !datos.nombre.trim() ||
            typeof datos.tematica !== 'string' ||
            typeof datos.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha) ||
            Number.isNaN(new Date(`${datos.fecha}T00:00:00`).getTime()) ||
            new Date(`${datos.fecha}T00:00:00`).toISOString().slice(0, 10) !== datos.fecha
        ) {
            throw new BadRequestError('Completá nombre, temática y una fecha válida');
        }
        const evento = {
            id: this.repository.siguienteId('evento'),
            nombre: datos.nombre.trim(),
            tematica: datos.tematica.trim(),
            fecha: datos.fecha,
            horario: typeof datos.horario === 'string' ? datos.horario.trim() : '',
            descripcion: typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '',
            ubicacion: typeof datos.ubicacion === 'string' ? datos.ubicacion.trim() : '',
        };
        this.datos.eventos.push(evento);
        this.guardar();
        return evento;
    }

    actualizarEvento(eventoId, datos) {
        const evento = this.obtenerEvento(eventoId);
        datos ??= {};
        const fecha = datos.fecha ?? evento.fecha;
        if (
            typeof fecha !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
            Number.isNaN(new Date(`${fecha}T00:00:00`).getTime()) ||
            new Date(`${fecha}T00:00:00`).toISOString().slice(0, 10) !== fecha
        ) {
            throw new BadRequestError('Ingresá una fecha válida');
        }
        for (const campo of ['nombre', 'tematica', 'horario', 'descripcion', 'ubicacion']) {
            if (datos[campo] !== undefined && typeof datos[campo] !== 'string') {
                throw new BadRequestError(`El campo ${campo} debe ser texto`);
            }
        }
        if (datos.nombre !== undefined && !datos.nombre.trim()) {
            throw new BadRequestError('Ingresá el nombre del evento');
        }
        evento.nombre = (datos.nombre ?? evento.nombre ?? '').trim();
        evento.tematica = (datos.tematica ?? evento.tematica ?? '').trim();
        evento.fecha = fecha;
        evento.horario = (datos.horario ?? evento.horario ?? '').trim();
        evento.descripcion = (datos.descripcion ?? evento.descripcion ?? '').trim();
        evento.ubicacion = (datos.ubicacion ?? evento.ubicacion ?? '').trim();
        this.guardar();
        return evento;
    }

    crearStand(eventoId, datos) {
        const evento = this.obtenerEvento(eventoId);
        if (!datos || typeof datos.nombre !== 'string' || !datos.nombre.trim()) {
            throw new BadRequestError('Ingresá el nombre del stand');
        }
        if (
            datos.precio !== null &&
            datos.precio !== undefined &&
            datos.precio !== '' &&
            !['number', 'string'].includes(typeof datos.precio)
        ) {
            throw new BadRequestError('El precio debe ser un número igual o mayor a cero');
        }
        const stand = {
            id: this.repository.siguienteId('stand'),
            eventoId: evento.id,
            nombre: datos.nombre.trim(),
            precio: datos.precio === null || datos.precio === undefined || datos.precio === ''
                ? null
                : Number(datos.precio),
        };
        if (stand.precio !== null && (!Number.isFinite(stand.precio) || stand.precio < 0)) {
            throw new BadRequestError('El precio debe ser un número igual o mayor a cero');
        }
        this.datos.stands.push(stand);
        this.guardar();
        return stand;
    }

    crearConcurso(eventoId, datos) {
        const evento = this.obtenerEvento(eventoId);
        if (
            !datos || typeof datos.nombre !== 'string' || !datos.nombre.trim() ||
            !Number.isInteger(Number(datos.cupo)) || Number(datos.cupo) < 1
        ) {
            throw new BadRequestError('Ingresá el nombre del concurso y un cupo mayor a cero');
        }
        const concurso = {
            id: this.repository.siguienteId('concurso'),
            eventoId: evento.id,
            nombre: datos.nombre.trim(),
            descripcion: typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '',
            cupo: Number(datos.cupo),
        };
        this.datos.concursos.push(concurso);
        this.guardar();
        return concurso;
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
