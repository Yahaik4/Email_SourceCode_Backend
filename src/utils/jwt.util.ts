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
    const token = req.cookies?.token;
    if (!token){
        return null;
    } 
    try {
        const payload = jwtService.decode(token) as { sub: string };
        return payload?.sub || null;
    }catch {
        return null;
    }
}
