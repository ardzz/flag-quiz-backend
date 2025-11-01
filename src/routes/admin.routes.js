const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/users', adminController.getAllUsers);

router.put(
  '/users/:id/role',
  [
    param('id').isUUID().withMessage('Invalid user ID'),
    body('role').isIn(['player', 'admin']).withMessage('Invalid role'),
  ],
  validate,
  adminController.updateUserRole
);

router.delete(
  '/users/:id',
  [param('id').isUUID().withMessage('Invalid user ID')],
  validate,
  adminController.deleteUser
);

router.post('/countries/import', adminController.importCountries);

router.put(
  '/countries/:id',
  [param('id').isInt().withMessage('Invalid country ID')],
  validate,
  adminController.updateCountry
);

router.delete(
  '/countries/:id',
  [param('id').isInt().withMessage('Invalid country ID')],
  validate,
  adminController.deactivateCountry
);

router.get('/statistics', adminController.getStatistics);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
