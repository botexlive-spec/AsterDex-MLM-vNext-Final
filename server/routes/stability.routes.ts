import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Endpoint to get QA test results
router.get('/qa-results', async (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'QA_TEST_RESULTS.json');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'QA test results not available yet' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading QA results:', error);
    res.status(500).json({ error: 'Failed to load QA test results' });
  }
});

// Endpoint to get system memory map
router.get('/system-map', async (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'SYSTEM_MEMORY_MAP.json');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'System memory map not available yet' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading system map:', error);
    res.status(500).json({ error: 'Failed to load system memory map' });
  }
});

// Endpoint to get dependency analysis
router.get('/dependency-analysis', async (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'DEPENDENCY_ANALYSIS.json');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dependency analysis not available yet' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading dependency analysis:', error);
    res.status(500).json({ error: 'Failed to load dependency analysis' });
  }
});

// Endpoint to get orchestrator state
router.get('/orchestrator-state', async (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'ORCHESTRATOR_STATE.json');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Orchestrator state not available yet' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading orchestrator state:', error);
    res.status(500).json({ error: 'Failed to load orchestrator state' });
  }
});

// Endpoint to get test cycle results
router.get('/test-cycle-results', async (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'TEST_CYCLE_RESULTS.json');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Test cycle results not available yet' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading test cycle results:', error);
    res.status(500).json({ error: 'Failed to load test cycle results' });
  }
});

export default router;
