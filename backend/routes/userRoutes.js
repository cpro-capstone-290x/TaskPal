import expres from 'express';

const router = expres.Router();
router.get('/', getUsers);

router.post('/', createUser);
export default router;