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

test('cancelar una solicitud libera el stand y el plazo se aplica también en el servidor', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('cancelar@example.com', 'emprendedor')).usuario;
    const evento = sistema.datos.eventos[0];
    evento.fecha = '2035-07-12';
    sistema.guardar();
    const stand = sistema.datos.stands[0];
    const reserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: stand.id });

    const cancelada = sistema.cancelarReserva(emprendedor, reserva.id);
    assert.equal(cancelada.estado, 'cancelada');
    assert.equal(sistema.listarStands(evento.id).find((item) => item.id === stand.id).disponible, true);

    const otraReserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: stand.id });
    evento.fecha = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10);
    sistema.guardar();
    assert.throws(() => sistema.cancelarReserva(emprendedor, otraReserva.id), /24 horas/);
});

test('el administrador solo confirma solicitudes pendientes y libera las rechazadas', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('admin-flow@example.com', 'emprendedor')).usuario;
    const evento = sistema.datos.eventos[0];
    evento.fecha = '2035-07-12';
    const stand = sistema.datos.stands[0];
    const reserva = sistema.solicitarReserva(emprendedor, { eventoId: evento.id, standId: stand.id });

    assert.equal(sistema.resolverReserva(reserva.id, 'confirmada').estado, 'confirmada');
    assert.throws(() => sistema.resolverReserva(reserva.id, 'cancelada'), /pendientes/);
    const otra = sistema.solicitarReserva(
        sistema.registrar(nuevoUsuario('segunda-emprendedora@example.com', 'emprendedor')).usuario,
        { eventoId: evento.id, standId: sistema.datos.stands[1].id }
    );
    assert.equal(sistema.resolverReserva(otra.id, 'cancelada').estado, 'cancelada');
    assert.equal(sistema.listarStands(evento.id).find((item) => item.id === sistema.datos.stands[1].id).disponible, true);
});

test('el concurso no acepta duplicados ni inscripciones una vez lleno', (t) => {
    const sistema = crearSistema(t);
    const evento = sistema.datos.eventos[0];
    const concurso = sistema.datos.concursos[0];
    concurso.cupo = 1;
    const cliente = sistema.registrar(nuevoUsuario('concurso@example.com')).usuario;

    assert.equal(sistema.inscribirEnConcurso(cliente, concurso.id).concurso.id, concurso.id);
    assert.equal(sistema.listarConcursos(evento.id)[0].cuposDisponibles, 0);
    assert.throws(() => sistema.inscribirEnConcurso(cliente, concurso.id), /Ya estás inscripto/);
    assert.throws(
        () => sistema.inscribirEnConcurso(sistema.registrar(nuevoUsuario('completo@example.com')).usuario, concurso.id),
        /completó sus cupos/
    );
});

test('finaliza automáticamente las reservas cuando termina el día del evento', (t) => {
    const sistema = crearSistema(t);
    const emprendedor = sistema.registrar(nuevoUsuario('fin-evento@example.com', 'emprendedor')).usuario;
    const evento = sistema.datos.eventos[0];
    evento.fecha = '2000-07-12';
    const stand = sistema.datos.stands[0];
    const reserva = {
        id: 1,
        emprendedorId: emprendedor.id,
        eventoId: evento.id,
        standId: stand.id,
        estado: 'confirmada',
    };
    sistema.datos.reservas.push(reserva);

    const estado = sistema.listarStands(evento.id).find((item) => item.id === stand.id);
    assert.equal(estado.disponible, true);
    assert.equal(sistema.datos.reservas.find((item) => item.id === reserva.id).estado, 'finalizada');
    assert.equal(sistema.listarReservas(emprendedor.id)[0].estado, 'finalizada');
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
    assert.equal(reconstruido.listarEventos()[0].cantidadStands, 9);
});
