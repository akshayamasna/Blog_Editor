import { z } from "zod";

// MongoDB Document Interfaces
export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface Blog {
  _id?: string;
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published';
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod Schemas
export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const insertBlogSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  authorId: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

export const updateBlogSchema = insertBlogSchema.partial().extend({
  id: z.string(),
});

export const searchBlogsSchema = z.object({
  query: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBlog = z.infer<typeof insertBlogSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type UpdateBlogRequest = z.infer<typeof updateBlogSchema>;
export type SearchBlogsRequest = z.infer<typeof searchBlogsSchema>;
