import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { audit } from "../config/logger.js";
import { Role } from "../generated/prisma/enums.ts";
import { issueSession, clearSession } from "../utils/session.js";

// Compared against when the email does not exist, so "unknown email" and "wrong password"
// take about the same time and cannot be told apart by measuring response latency.
const DUMMY_HASH = await bcrypt.hash(randomBytes(16).toString("hex"), env.BCRYPT_ROUNDS);

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  tokenVersion: true,
};

const toPublic = ({ id, name, email, role }) => ({ id, name, email, role });

// POST /api/auth/register  (public). Always creates a CUSTOMER.
export async function register(req, res) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  let user;
  try {
    // The role is hard-coded here. The request schema is strict, so a "role" field
    // in the body is rejected with 400 before it ever reaches this line.
    user = await prisma.user.create({
      data: { name, email, passwordHash, role: Role.CUSTOMER },
      select: userSelect,
    });
  } catch (err) {
    if (err.code === "P2002") {
      audit("AUTH_REGISTER_FAILURE", req, { email, reason: "EMAIL_EXISTS" });
      return res.status(409).json({ error: "Email is already registered" });
    }
    throw err;
  }

  const jti = issueSession(res, user);
  audit("AUTH_REGISTER_SUCCESS", req, { userId: user.id, email: user.email, role: user.role, jti });
  res.status(201).json({ user: toPublic(user) });
}

// POST /api/auth/login  (public)
export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email }, select: { ...userSelect, passwordHash: true } });

  // Always run bcrypt, even for unknown emails (timing equalization).
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  const failure = !user ? "USER_NOT_FOUND" : !passwordOk ? "BAD_PASSWORD" : !user.isActive ? "ACCOUNT_DISABLED" : null;

  if (failure) {
    // The log gets the precise reason. The client always gets the same generic message.
    audit("AUTH_LOGIN_FAILURE", req, { email, userId: user?.id, reason: failure });
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const jti = issueSession(res, user);
  audit("AUTH_LOGIN_SUCCESS", req, { userId: user.id, email: user.email, role: user.role, jti });
  res.json({ user: toPublic(user) });
}

// POST /api/auth/logout  (authenticated)
export function logout(req, res) {
  clearSession(res);
  audit("AUTH_LOGOUT", req, { email: req.user.email });
  res.status(204).end();
}

// GET /api/auth/me  (authenticated)
export function me(req, res) {
  res.json({ user: req.user });
}
