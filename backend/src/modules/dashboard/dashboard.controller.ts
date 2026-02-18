import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
    async getStats(req: Request, res: Response) {
        try {
            const stats = await dashboardService.getStats();
            res.json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
