import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: number; // Changed to number
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string;
        }
    }

    interface User {
        id: number; // Changed to number
        role?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        id?: number;
    }
}
