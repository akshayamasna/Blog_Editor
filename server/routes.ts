import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertBlogSchema, updateBlogSchema, searchBlogsSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    });
  });

  // Blog routes
  app.get("/api/blogs", authenticateToken, async (req: any, res) => {
    try {
      const blogs = await storage.getBlogsByAuthor(req.user.id);
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Search blogs endpoint - place before parameterized routes
  app.get("/api/blogs/search", authenticateToken, async (req: any, res) => {
    try {
      const { query } = searchBlogsSchema.parse(req.query);
      const blogs = await storage.searchBlogs(req.user.id, query);
      res.json(blogs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid search query", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/blogs/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const blog = await storage.getBlog(id);
      
      if (!blog || blog.authorId !== req.user.id) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json(blog);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/blogs/save-draft", authenticateToken, async (req: any, res) => {
    try {
      const blogData = insertBlogSchema.parse({
        ...req.body,
        authorId: req.user.id,
        status: "draft"
      });

      const blog = await storage.createBlog(blogData);
      res.json(blog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/blogs/publish", authenticateToken, async (req: any, res) => {
    try {
      const blogData = insertBlogSchema.parse({
        ...req.body,
        authorId: req.user.id,
        status: "published"
      });

      const blog = await storage.createBlog(blogData);
      res.json(blog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/blogs/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const updates = updateBlogSchema.parse({ ...req.body, id });

      const existingBlog = await storage.getBlog(id);
      if (!existingBlog || existingBlog.authorId !== req.user.id) {
        return res.status(404).json({ message: "Blog not found" });
      }

      const { id: blogId, ...updateData } = updates;
      const updatedBlog = await storage.updateBlog(id, updateData);
      
      if (!updatedBlog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json(updatedBlog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/blogs/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = req.params.id;
      const blog = await storage.getBlog(id);
      
      if (!blog || blog.authorId !== req.user.id) {
        return res.status(404).json({ message: "Blog not found" });
      }

      const deleted = await storage.deleteBlog(id);
      if (!deleted) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.json({ message: "Blog deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
