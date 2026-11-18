import { Router } from 'express';
import ClienteController from '../controllers/ClienteController.js';
import { requiereSesion, requiereTipo } from '../middlewares/autenticacion.js';

const router = Router();

router.use(requiereSesion, requiereTipo('administrador'));
router.get('/', ClienteController.getAll);
router.get('/:id', ClienteController.getById);
router.post('/', ClienteController.create);
router.put('/:id', ClienteController.update);
router.delete('/:id', ClienteController.delete);

export default router;
