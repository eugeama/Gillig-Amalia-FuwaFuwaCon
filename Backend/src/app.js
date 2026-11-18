import express from 'express';
import clienteRoutes from './routes/clienteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import eventoRoutes from './routes/eventoRoutes.js';
import reservaRoutes from './routes/reservaRoutes.js';
import concursoRoutes from './routes/concursoRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/concursos', concursoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clientes', clienteRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Recurso no encontrado (Ruta incorrecta)"
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Servidor de FuwaFuwaCon ejecutándose en el puerto ${PORT}`);
    console.log(`Ruta base del CRUD: http://localhost:${PORT}/api/clientes`);
});

export default app;
