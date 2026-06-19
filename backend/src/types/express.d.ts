declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string;
        email: string | null;
        role: string | null;
        isAdmin: boolean;
      };
    }
  }
}

export {};
