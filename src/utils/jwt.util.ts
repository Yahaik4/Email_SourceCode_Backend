import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';

export function generateToken(res: Response, jwtService: JwtService, user: { id: string; email: string }) {
    const payload = {
        sub: user.id,
        email: user.email,
    };

    const token = jwtService.sign(payload);

    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
        path: '/',
        domain: 'localhost',
    });

    return token;
}

export function getUserIdFromToken(req: Request, jwtService: JwtService): string | null {
    // Check Authorization header first
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim();
        if (token) {
            try {
                const payload = jwtService.decode(token) as { sub: string };
                return payload?.sub || null;
            } catch {
                return null;
            }
        }
    }

    // Fallback to cookie if Authorization header is not present
    const tokenFromCookie = req.cookies?.token;
    if (tokenFromCookie) {
        try {
            const payload = jwtService.decode(tokenFromCookie) as { sub: string };
            return payload?.sub || null;
        } catch {
            return null;
        }
    }

    return null;
}