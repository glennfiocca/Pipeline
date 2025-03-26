import { Router } from 'express';
import { storage } from '../../storage';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const reportedJobs = await storage.getReportedJobs();
    res.json(reportedJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid job ID' });
  }
  try {
    const reportedJob = await storage.getReportedJob(id);
    if (!reportedJob) {
      return res.status(404).json({ message: 'Reported job not found' });
    }
    res.json(reportedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid job ID' });
  }
  try {
    const data = req.body;
    const reportedJob = await storage.updateReportedJob(id, data);
    res.json(reportedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid job ID' });
  }
  try {
    await storage.deleteReportedJob(id);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 