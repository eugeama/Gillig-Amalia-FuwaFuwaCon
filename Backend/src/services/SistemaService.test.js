import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { SistemaRepository } from '../repositories/SistemaRepository.js';
import { SistemaService } from './SistemaService.js';

function crearSistema(t) {
    const directorio = mkdtempSync(path.join(tmpdir(), 'fuwafuwacon-'));
    t.after(() => rmSync(directorio, { recursive: true, force: true }));
    return new SistemaService(new SistemaRepository(path.join(directorio, 'datos.json')));
}

function fijarFechaEvento(sistema, fecha) {
    const evento = sistema.datos.eventos[0];
    evento.fechas = [fecha];
    evento.mes = fecha.slice(0, 7);
    for (const stand of sistema.datos.stands) stand.fecha = fecha;
    for (const reserva of sistema.datos.reservas) reserva.fecha = fecha;
    sistema.guardar();
    return evento;
}

function fechaDentroDe(dias) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, '0'),
        String(fecha.getDate()).padStart(2, '0'),
    ].join('-');
}

function nuevoUsuario(email, tipo = 'cliente') {
    return {
        nombre: 'Persona de prueba',
        email,
        contrasena: 'abcdefgh12!',
        fechaNacimiento: '1998-05-15',
        tipo,
        ...(tipo === 'emprendedor' ? { nombreEmprendimiento: 'Mi emprendimiento' } : {}),
    };
}

test('registra usuarios con contraseña hasheada y no permite reutilizar el email entre roles', (t) => {
    const sistema = crearSistema(t);
    const cliente = sistema.registrar(nuevoUsuario('PERSONA@example.com'));
    assert.equal(cliente.usuario.email, 'persona@example.com');
    assert.equal('contrasenaHash' in cliente.usuario, false);
    assert.equal('contrasena' in cliente.usuario, false);
    assert.equal(sistema.obtenerSesion(cliente.token).tipo, 'cliente');
    assert.throws(() => sistema.registrar(nuevoUsuario('persona@example.com', 'emprendedor')), /Ya existe/);
});

test('exige el formato acordado y el nombre del emprendimiento', (t) => {
    const sistema = crearSistema(t);
    for (const contrasena of ['abcdefgh1!', 'abcdefgh12', 'abcdefg12!']) {
        assert.throws(() => sistema.registrar({ ...nuevoUsuario(`${contrasena}@example.com`), contrasena }), /contraseña/);
    }
    assert.throws(() => sistema.registrar({ ...nuevoUsuario('comercio@example.com', 'emprendedor'), nombreEmprendimiento: '' }), /emprendimiento/);
    assert.throws(() => sistema.registrar({ ...nuevoUsuario('fecha@example.com'), fechaNacimiento: '2000-02-31' }), /fecha/);
});

test('permite una solicitud activa por persona y evento y bloquea un stand ocupado', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('emprendedor@example.com', 'emprendedor')).usuario;
    const [evento] = sistema.listarEventos();
    const [primerStand, segundoStand] = sistema.listarStands(evento.id);

    const reserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: primerStand.id });
    assert.equal(reserva.estado, 'pendiente');
    assert.equal(sistema.listarStands(evento.id).find((stand) => stand.id === primerStand.id).disponible, false);
    assert.throws(() => sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: segundoStand.id }), /un stand por persona/);

    const otraEmprendedora = sistema.registrar(nuevoUsuario('otra@example.com', 'emprendedor')).usuario;
    assert.throws(() => sistema.solicitarReserva(otraEmprendedora, { eventoId: evento.id, standId: primerStand.id }), /ocupado/);
});

test('el emprendedor puede borrar su reserva confirmada o pendiente con más de 24 horas de anticipación', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('borrar@example.com', 'emprendedor')).usuario;
    const evento = fijarFechaEvento(sistema, fechaDentroDe(30));
    const stand = sistema.datos.stands[0];
    const reserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: stand.id });
    sistema.resolverReserva(reserva.id, 'confirmada');

    sistema.eliminarReservaPropia(emprendedor, reserva.id);
    assert.equal(sistema.datos.reservas.some((item) => item.id === reserva.id), false);
    assert.equal(sistema.listarStands(evento.id).find((item) => item.id === stand.id).disponible, true);
});

test('el emprendedor no puede borrar su reserva durante las 24 horas previas al evento', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('tarde@example.com', 'emprendedor')).usuario;
    const evento = fijarFechaEvento(sistema, fechaDentroDe(30));
    const stand = sistema.datos.stands[0];
    const reserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: stand.id });

    const manana = fechaDentroDe(1);
    evento.fechas = [manana];
    evento.horario = '00:00 a 23:59';
    sistema.datos.reservas.find((item) => item.id === reserva.id).fecha = manana;
    assert.throws(() => sistema.eliminarReservaPropia(emprendedor, reserva.id), /24 horas/);
    assert.equal(sistema.datos.reservas.some((item) => item.id === reserva.id), true);
});

test('elimina las reservas confirmadas una semana antes del evento', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('contacto@example.com', 'emprendedor')).usuario;
    const evento = fijarFechaEvento(sistema, fechaDentroDe(8));
    const stand = sistema.datos.stands[0];
    const reserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: stand.id });
    sistema.resolverReserva(reserva.id, 'confirmada');

    sistema.listarEventos();
    assert.equal(sistema.datos.reservas.some((item) => item.id === reserva.id), true);

    sistema.datos.reservas.find((item) => item.id === reserva.id).fecha = fechaDentroDe(6);
    sistema.listarEventos();
    assert.equal(sistema.datos.reservas.some((item) => item.id === reserva.id), false);
    assert.equal(sistema.listarStands(evento.id).find((item) => item.id === stand.id).disponible, true);
});

test('el administrador solo confirma solicitudes pendientes y libera las rechazadas', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('admin-flow@example.com', 'emprendedor')).usuario;
    const evento = fijarFechaEvento(sistema, '2035-07-12');
    const stand = sistema.datos.stands[0];
    const reserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: stand.id });

    assert.equal(sistema.resolverReserva(reserva.id, 'confirmada').estado, 'confirmada');
    assert.throws(() => sistema.resolverReserva(reserva.id, 'cancelada'), /pendientes/);
    const otra = sistema.solicitarReserva(
        sistema.registrar(nuevoUsuario('segunda-emprendedora@example.com', 'emprendedor')).usuario,
        { eventoId: evento.id, standId: sistema.datos.stands[1].id }
    );
    assert.equal(sistema.resolverReserva(otra.id, 'cancelada').estado, 'cancelada');
    assert.equal(
        sistema.listarStands(evento.id, '2035-07-12').find((item) => item.id === sistema.datos.stands[1].id).disponible,
        true
    );
});

test('el concurso tiene cupos por fecha y no acepta duplicados ni inscripciones una vez lleno', (t) => {
    const sistema = crearSistema(t);
    const evento = sistema.datos.eventos[0];
    evento.fechas = ['2099-01-10', '2099-01-11'];
    const [primeraFecha, segundaFecha] = evento.fechas;
    const concurso = sistema.datos.concursos[0];
    concurso.cupos = { [primeraFecha]: 1, [segundaFecha]: 2 };
    const cliente = sistema.registrar(nuevoUsuario('concurso@example.com')).usuario;

    assert.equal(sistema.inscribirEnConcurso(cliente, concurso.id, primeraFecha).concurso.id, concurso.id);
    const cuposEn = (fecha) => sistema.listarConcursos(evento.id, fecha).find((item) => item.id === concurso.id).cuposDisponibles;
    assert.equal(cuposEn(primeraFecha), 0);
    assert.equal(cuposEn(segundaFecha), 2);
    assert.throws(() => sistema.inscribirEnConcurso(cliente, concurso.id, primeraFecha), /Ya estás inscripto/);
    assert.throws(
        () => sistema.inscribirEnConcurso(sistema.registrar(nuevoUsuario('completo@example.com')).usuario, concurso.id, primeraFecha),
        /completó sus cupos/
    );
    assert.equal(sistema.inscribirEnConcurso(cliente, concurso.id, segundaFecha).fecha, segundaFecha);
});

test('elimina el evento, sus stands y reservas automáticamente después de la última fecha', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('fin-evento@example.com', 'emprendedor')).usuario;
    const evento = fijarFechaEvento(sistema, '2000-07-12');
    sistema.datos.reservas.push({
        id: sistema.repository.siguienteId('reserva'),
        emprendedorId: emprendedor.id,
        eventoId: evento.id,
        standId: sistema.datos.stands[0].id,
        fecha: '2000-07-12',
        estado: 'confirmada',
    });

    assert.equal(sistema.listarEventos().length, 0);
    assert.equal(sistema.datos.stands.length, 0);
    assert.equal(sistema.datos.reservas.length, 0);
});

test('el administrador elimina un evento con sus concursos e inscripciones, y un concurso o publicación por separado', (t) => {
    const sistema = crearSistema(t);
    const evento = sistema.datos.eventos[0];
    const concurso = sistema.datos.concursos[0];
    concurso.cupos = { [evento.fechas[0]]: 5 };
    const cliente = sistema.registrar(nuevoUsuario('borrado@example.com')).usuario;
    sistema.inscribirEnConcurso(cliente, concurso.id, evento.fechas[0]);
    const novedad = sistema.crearNovedad({ titulo: 'Publicación', texto: 'Texto' });

    sistema.eliminarNovedad(novedad.id);
    assert.equal(sistema.datos.novedades.some((item) => item.id === novedad.id), false);

    sistema.eliminarConcurso(concurso.id);
    assert.equal(sistema.datos.concursos.some((item) => item.id === concurso.id), false);
    assert.equal(sistema.datos.inscripciones.length, 0);

    sistema.eliminarEvento(evento.id);
    assert.equal(sistema.listarEventos().some((item) => item.id === evento.id), false);
    assert.throws(() => sistema.eliminarEvento(evento.id), /no existe/);
});

test('crea eventos con varias fechas del mismo mes y solo uno por mes', (t) => {
    const sistema = crearSistema(t);
    const evento = sistema.crearEvento({
        nombre: 'Agosto',
        tematica: 'Anime',
        fechas: ['2035-08-11', '2035-08-10'],
    });

    assert.equal(evento.mes, '2035-08');
    assert.deepEqual(evento.fechas, ['2035-08-10', '2035-08-11']);
    assert.equal(sistema.listarStands(evento.id, '2035-08-11').length, 110);
    assert.throws(() => sistema.crearEvento({ nombre: 'Otro', tematica: 'Anime', fechas: ['2035-08-20'] }), /Ya existe un evento para ese mes/);
    assert.throws(() => sistema.crearEvento({ nombre: 'Mixto', tematica: 'Anime', fechas: ['2035-09-01', '2035-10-01'] }), /mismo mes/);
});

test('no permite crear otro evento hasta que termine el mes de creación', (t) => {
    const sistema = crearSistema(t);
    const hoy = new Date();
    const fechaFutura = (meses) => {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + meses, 15);
        return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-15`;
    };
    sistema.crearEvento({ nombre: 'Primero', tematica: 'Anime', fechas: [fechaFutura(2)] });
    assert.throws(
        () => sistema.crearEvento({ nombre: 'Segundo', tematica: 'Anime', fechas: [fechaFutura(3)] }),
        /Ya creaste un evento este mes/
    );
});

test('valida que la imagen de una publicación sea un link http o https', (t) => {
    const sistema = crearSistema(t);
    assert.throws(() => sistema.crearNovedad({ titulo: 'Novedad', texto: 'Texto', imagen: 'javascript:alert(1)' }), /link/);
    assert.equal(sistema.crearNovedad({ titulo: 'Novedad', texto: 'Texto', imagen: 'https://example.com/a.png' }).imagen, 'https://example.com/a.png');
});

test('persiste el catálogo y las inscripciones sin guardar sesiones ni contraseñas en claro', (t) => {
    const directorio = mkdtempSync(path.join(tmpdir(), 'fuwafuwacon-persistencia-'));
    t.after(() => rmSync(directorio, { recursive: true, force: true }));
    const archivo = path.join(directorio, 'datos.json');
    const sistema = new SistemaService(new SistemaRepository(archivo));
    const cuenta = sistema.registrar(nuevoUsuario('persistencia@example.com'));
    const reconstruido = new SistemaService(new SistemaRepository(archivo));

    assert.equal(reconstruido.obtenerSesion(cuenta.token), null);
    assert.equal(reconstruido.datos.usuarios[0].email, 'persistencia@example.com');
    assert.notEqual(reconstruido.datos.usuarios[0].contrasenaHash, 'abcdefgh12!');
    assert.equal(reconstruido.listarEventos()[0].cantidadStands, 110);
});
