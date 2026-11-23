import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DATA_PATH =
    process.env.DATA_FILE ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/fuwafuwacon.json');

export const HORARIO_EVENTO = '12:00 a 19:00';
export const UBICACION_EVENTO = 'Av. Eva Perón 1400';
const TOTAL_MESAS = 110;
const MESAS_INTERIORES = { desde: 42, hasta: 69 };
const PRECIO_MESA_INTERIOR = 50000;
const PRECIO_MESA_EXTERIOR = 30000;

function proximaFechaEvento() {
    const hoy = new Date();
    const anio = hoy.getFullYear() + (hoy.getMonth() >= 6 ? 1 : 0);
    return `${anio}-07-12`;
}

function precioMesa(numero) {
    const esInterior = numero >= MESAS_INTERIORES.desde && numero <= MESAS_INTERIORES.hasta;
    return esInterior ? PRECIO_MESA_INTERIOR : PRECIO_MESA_EXTERIOR;
}

function crearDatosIniciales() {
    return {
        version: 1,
        secuencias: {
            usuario: 1,
            evento: 1,
            stand: 1,
            concurso: 1,
            reserva: 1,
            inscripcion: 1,
            novedad: 1,
        },
        usuarios: [],
        eventos: [
            {
                id: 1,
                nombre: 'FuwaFuwaCon',
                tematica: '',
                mes: proximaFechaEvento().slice(0, 7),
                fechas: [proximaFechaEvento()],
                horario: HORARIO_EVENTO,
                descripcion: 'Fecha indicada en el boceto del proyecto.',
                ubicacion: UBICACION_EVENTO,
            },
        ],
        stands: [],
        concursos: [
            {
                id: 1,
                eventoId: 1,
                nombre: 'Concurso de cosplay',
                descripcion: 'Inscripciones sujetas a cupo.',
                cupo: 20,
            },
        ],
        reservas: [],
        inscripciones: [],
        novedades: [],
    };
}

export class SistemaRepository {
    constructor(dataPath = DEFAULT_DATA_PATH) {
        this.dataPath = dataPath;
        mkdirSync(path.dirname(this.dataPath), { recursive: true });

        try {
            this.datos = JSON.parse(readFileSync(this.dataPath, 'utf8'));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }

            this.datos = crearDatosIniciales();
            this.guardar();
        }

        this.migrarDatos();
    }

    migrarDatos() {
        const iniciales = crearDatosIniciales();
        this.datos.version = 1;
        this.datos.secuencias ??= iniciales.secuencias;
        this.datos.usuarios ??= [];
        this.datos.eventos ??= iniciales.eventos;
        this.datos.stands ??= iniciales.stands;
        this.datos.concursos ??= iniciales.concursos;
        this.datos.reservas ??= [];
        this.datos.inscripciones ??= [];
        this.datos.novedades ??= [];

        for (const [tipo, propiedad] of [
            ['usuario', 'usuarios'],
            ['evento', 'eventos'],
            ['stand', 'stands'],
            ['concurso', 'concursos'],
            ['reserva', 'reservas'],
            ['inscripcion', 'inscripciones'],
            ['novedad', 'novedades'],
        ]) {
            const idMaximo = this.datos[propiedad].reduce((maximo, elemento) => Math.max(maximo, elemento.id), 0);
            this.datos.secuencias[tipo] = Math.max(this.datos.secuencias[tipo] ?? 1, idMaximo + 1);
        }

        for (const evento of this.datos.eventos) {
            evento.fechas ??= [evento.fecha];
            delete evento.fecha;
            evento.mes = evento.fechas[0].slice(0, 7);
            evento.horario = HORARIO_EVENTO;
            evento.ubicacion = UBICACION_EVENTO;
        }
        for (const stand of this.datos.stands) {
            stand.fecha ??= this.datos.eventos.find((evento) => evento.id === stand.eventoId)?.fechas[0];
        }
        for (const reserva of this.datos.reservas) {
            reserva.fecha ??= this.datos.stands.find((stand) => stand.id === reserva.standId)?.fecha;
        }
        for (const evento of this.datos.eventos) {
            for (const fecha of evento.fechas) {
                this.asegurarMesas(evento.id, fecha);
            }
        }

        this.guardar();
    }

    asegurarMesas(eventoId, fecha) {
        for (let numero = 1; numero <= TOTAL_MESAS; numero += 1) {
            const nombre = `Mesa ${String(numero).padStart(2, '0')}`;
            const precio = precioMesa(numero);
            const stand = this.datos.stands.find(
                (item) => item.eventoId === eventoId && item.fecha === fecha && item.nombre === nombre
            );
            if (stand) {
                stand.precio = precio;
            } else {
                this.datos.stands.push({ id: this.siguienteId('stand'), eventoId, fecha, nombre, precio });
            }
        }
    }

    guardar() {
        const temporal = `${this.dataPath}.${process.pid}.tmp`;
        writeFileSync(temporal, JSON.stringify(this.datos, null, 2), { mode: 0o600 });
        renameSync(temporal, this.dataPath);
    }

    siguienteId(tipo) {
        const id = this.datos.secuencias[tipo];
        this.datos.secuencias[tipo] += 1;
        return id;
    }
}

export default new SistemaRepository();
