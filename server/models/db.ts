import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  headline?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IBulletImprovement {
  original: string;
  improved: string;
  reason?: string;
}

export interface IAISuggestions {
  ats_compatibility_score: number;
  executive_summary: string;
  matched_skills: string[];
  missing_skills: string[];
  optimization_tips: string[];
  bullet_point_improvements: IBulletImprovement[];
  section_scores: {
    keyword_alignment: number;
    impact_metrics: number;
    formatting_readability: number;
    role_fit: number;
  };
}

export interface IResume {
  _id: string;
  userId: string;
  fileName: string;
  jobTitle: string;
  jobDescription: string;
  text: string;
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: IAISuggestions;
  createdAt: string;
}

interface DatabaseShape {
  users: IUser[];
  resumes: IResume[];
}

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), ".data"));
const DB_FILE = path.join(DATA_DIR, "codeflow_db.json");

// Fresh empty data: NO mock or sample resumes or fake accounts!
const INITIAL_EMPTY_DATA: DatabaseShape = {
  users: [],
  resumes: [],
};

const PASSWORD_HASH_PREFIX = "scrypt$";
const PASSWORD_KEY_LENGTH = 64;

function loadDb(): DatabaseShape {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_EMPTY_DATA, null, 2), "utf-8");
    return structuredClone(INITIAL_EMPTY_DATA);
  }

  const raw = fs.readFileSync(DB_FILE, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("users" in parsed) ||
    !Array.isArray(parsed.users) ||
    !("resumes" in parsed) ||
    !Array.isArray(parsed.resumes)
  ) {
    throw new Error(`Database file has an invalid format: ${DB_FILE}`);
  }
  return parsed as DatabaseShape;
}

function saveDb(db: DatabaseShape): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = `${DB_FILE}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tempFile, DB_FILE);
}

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await derivePassword(password, salt);
  return `${PASSWORD_HASH_PREFIX}${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  if (storedPassword.startsWith(PASSWORD_HASH_PREFIX)) {
    const [, saltHex, hashHex, ...extra] = storedPassword.split("$");
    if (
      extra.length > 0 ||
      !saltHex ||
      !/^[\da-f]{32}$/i.test(saltHex) ||
      !hashHex ||
      !/^[\da-f]{128}$/i.test(hashHex)
    ) {
      return false;
    }
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = await derivePassword(password, salt);
    return crypto.timingSafeEqual(actual, expected);
  }

  const actual = crypto.createHash("sha256").update(password).digest();
  const expected = crypto.createHash("sha256").update(storedPassword).digest();
  return crypto.timingSafeEqual(actual, expected);
}

const memoryDb: DatabaseShape = loadDb();

export const User = {
  async create(data: {
    name: string;
    email: string;
    password: string;
    headline?: string;
    bio?: string;
    avatar?: string;
  }): Promise<IUser> {
    const normalizedEmail = (data.email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("Email is required");
    }
    const existing = memoryDb.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      throw new Error("An account with this email already exists");
    }
    const now = new Date().toISOString();
    const newUser: IUser = {
      _id: `usr_${crypto.randomBytes(6).toString("hex")}`,
      name: (data.name || normalizedEmail.split("@")[0]).trim(),
      email: normalizedEmail,
      password: await hashPassword(data.password),
      headline: data.headline || "Software Engineer",
      bio: data.bio || "",
      avatar: data.avatar || "",
      createdAt: now,
      updatedAt: now,
    };
    memoryDb.users.push(newUser);
    saveDb(memoryDb);
    return newUser;
  },

  async findOne(query: { email?: string; _id?: string }): Promise<IUser | null> {
    if (query.email) {
      const normalized = query.email.trim().toLowerCase();
      return (
        memoryDb.users.find((u) => u.email.toLowerCase() === normalized) || null
      );
    }
    if (query._id) {
      return memoryDb.users.find((u) => u._id === query._id) || null;
    }
    return null;
  },

  async findById(id: string): Promise<IUser | null> {
    return memoryDb.users.find((u) => u._id === id) || null;
  },

  async verifyPassword(email: string, password: string): Promise<IUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = memoryDb.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user?.password || !(await verifyPassword(password, user.password))) {
      return null;
    }

    if (!user.password.startsWith(PASSWORD_HASH_PREFIX)) {
      user.password = await hashPassword(password);
      saveDb(memoryDb);
    }
    return user;
  },

  async updateProfile(
    id: string,
    updates: Partial<Pick<IUser, "name" | "headline" | "bio" | "avatar">>
  ): Promise<IUser> {
    const user = memoryDb.users.find((u) => u._id === id);
    if (!user) {
      throw new Error("User not found");
    }
    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.headline !== undefined) user.headline = updates.headline.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    user.updatedAt = new Date().toISOString();
    saveDb(memoryDb);
    return user;
  },
};

export const Resume = {
  async create(data: Omit<IResume, "_id" | "createdAt">): Promise<IResume> {
    const newResume: IResume = {
      ...data,
      _id: `res_${crypto.randomBytes(6).toString("hex")}`,
      createdAt: new Date().toISOString(),
    };
    memoryDb.resumes.unshift(newResume);
    saveDb(memoryDb);
    return newResume;
  },

  async find(query: { userId?: string } = {}): Promise<IResume[]> {
    if (query.userId) {
      return memoryDb.resumes.filter((r) => r.userId === query.userId);
    }
    return memoryDb.resumes;
  },

  async findByIdAndDelete(id: string, userId?: string): Promise<boolean> {
    const idx = memoryDb.resumes.findIndex(
      (r) => r._id === id && (!userId || r.userId === userId)
    );
    if (idx === -1) return false;
    memoryDb.resumes.splice(idx, 1);
    saveDb(memoryDb);
    return true;
  },
};
