import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DATA_PATH =
    process.env.DATA_FILE ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/fuwafuwacon.json');

function proximaFechaEvento() {
    const hoy = new Date();
    const anio = hoy.getFullYear() + (hoy.getMonth() >= 6 ? 1 : 0);
    return `${anio}-07-12`;
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
        },
        usuarios: [],
        eventos: [
            {
                id: 1,
                nombre: 'FuwaFuwaCon',
                tematica: 'A confirmar',
                fecha: proximaFechaEvento(),
                horario: 'A confirmar',
                descripcion: 'Fecha indicada en el boceto del proyecto.',
                ubicacion: 'A confirmar',
            },
        ],
        stands: Array.from({ length: 9 }, (_, indice) => ({
            id: indice + 1,
            eventoId: 1,
            nombre: `Mesa ${String(indice + 1).padStart(2, '0')}`,
            precio: null,
        })),
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

        for (const [tipo, propiedad] of [
            ['usuario', 'usuarios'],
            ['evento', 'eventos'],
            ['stand', 'stands'],
            ['concurso', 'concursos'],
            ['reserva', 'reservas'],
            ['inscripcion', 'inscripciones'],
        ]) {
            const idMaximo = this.datos[propiedad].reduce((maximo, elemento) => Math.max(maximo, elemento.id), 0);
            this.datos.secuencias[tipo] = Math.max(this.datos.secuencias[tipo] ?? 1, idMaximo + 1);
        }

        this.guardar();
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
