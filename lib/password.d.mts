export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, saved: string): Promise<boolean>;
