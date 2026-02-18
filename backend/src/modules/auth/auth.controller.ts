import { Request, Response } from 'express';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const user = await authService.register(req.body);
            res.status(201).json({ message: 'User registered successfully', user });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async getCurrentUser(req: any, res: Response) {
        try {
            res.json(req.user);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
