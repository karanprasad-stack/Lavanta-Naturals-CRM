import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { calendarController } from '../controllers/calendarController.js';

const router = Router();

// All calendar routes require authentication
router.use(authenticate);

// ── Events CRUD ──────────────────────────────
router.get('/calendar/events', calendarController.getEvents);
router.get('/calendar/events/:id', calendarController.getEventById);
router.post('/calendar/events', calendarController.createEvent);
router.patch('/calendar/events/:id', calendarController.updateEvent);
router.delete('/calendar/events/:id', calendarController.deleteEvent);

// ── Participant Response ──────────────────────
router.post('/calendar/events/:id/respond', calendarController.respondToEvent);

// ── Upcoming & Today ─────────────────────────
router.get('/calendar/upcoming', calendarController.getUpcoming);
router.get('/calendar/today', calendarController.getToday);

export default router;
