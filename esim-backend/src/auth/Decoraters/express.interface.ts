export declare namespace Express {
    interface Request {
        user?: {
            id: number;
            role: string;
        };
        cookies: {
            [key: string]: string;
        }
    }
}