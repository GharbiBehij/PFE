import { Role } from '@prisma/client';

export interface SalesmanContext {
    id: number;
    name: string;
    role: Role;
}