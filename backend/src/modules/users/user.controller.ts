import { Request, Response } from 'express';
import { UserService } from './user.service';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    getProfile = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const user = await this.userService.getProfile(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };

    updateProfile = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const user = await this.userService.updateProfile(userId, req.body);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };

    changePassword = async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Current and new passwords are required' });
            }

            const success = await this.userService.changePassword(userId, currentPassword, newPassword);
            if (!success) {
                return res.status(400).json({ message: 'Invalid current password or update failed' });
            }

            res.json({ message: 'Password updated successfully' });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    };
}
