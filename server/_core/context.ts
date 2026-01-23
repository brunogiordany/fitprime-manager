import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import jwt from "jsonwebtoken";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  studentAuth?: {
    studentId: number;
    type: 'student';
  };
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let studentAuth: TrpcContext['studentAuth'] = undefined;

  // Tentar autenticação OAuth (para personal)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Tentar autenticação do aluno via token JWT no header
  const studentToken = opts.req.headers['x-student-token'] as string | undefined;
  if (studentToken) {
    try {
      const decoded = jwt.verify(studentToken, process.env.JWT_SECRET || 'secret') as {
        studentId: number;
        type: 'student';
      };
      if (decoded.type === 'student' && decoded.studentId) {
        studentAuth = {
          studentId: decoded.studentId,
          type: 'student',
        };
      }
    } catch (error) {
      // Token inválido ou expirado - ignorar
      console.log('[Auth] Token do aluno inválido ou expirado');
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    studentAuth,
  };
}
