import mongoose from 'mongoose';
import bcrypt from "bcrypt";
import { type User, type InsertUser, type Blog, type InsertBlog } from "@shared/schema";
import { nanoid } from 'nanoid';

// MongoDB connection
const MONGODB_URI = "YOUR MONGODB CONNECTION STRING";

// User Schema
const userSchema = new mongoose.Schema<User>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Blog Schema
const blogSchema = new mongoose.Schema<Blog>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  authorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for search functionality
blogSchema.index({ title: 'text', content: 'text' });
blogSchema.index({ title: 1 });

const UserModel = mongoose.model<User>('User', userSchema);
const BlogModel = mongoose.model<Blog>('Blog', blogSchema);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blog methods
  getBlogsByAuthor(authorId: string): Promise<Blog[]>;
  getBlog(id: string): Promise<Blog | undefined>;
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: string, updates: Partial<InsertBlog>): Promise<Blog | undefined>;
  deleteBlog(id: string): Promise<boolean>;
  searchBlogs(authorId: string, query: string): Promise<Blog[]>;
}

export class MongoStorage implements IStorage {
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    if (this.isConnected) return;
    
    try {
      await mongoose.connect(MONGODB_URI);
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.connect();
    const user = await UserModel.findOne({ id }).lean();
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.connect();
    const user = await UserModel.findOne({ email }).lean();
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.connect();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const id = nanoid();
    
    const user = new UserModel({
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    });
    
    const savedUser = await user.save();
    return savedUser.toObject();
  }

  async getBlogsByAuthor(authorId: string): Promise<Blog[]> {
    await this.connect();
    const blogs = await BlogModel.find({ authorId }).sort({ updatedAt: -1 }).lean();
    return blogs;
  }

  async getBlog(id: string): Promise<Blog | undefined> {
    await this.connect();
    const blog = await BlogModel.findOne({ id }).lean();
    return blog || undefined;
  }

  async createBlog(insertBlog: InsertBlog): Promise<Blog> {
    await this.connect();
    const id = nanoid();
    const now = new Date();
    
    const blog = new BlogModel({
      ...insertBlog,
      id,
      createdAt: now,
      updatedAt: now,
    });
    
    const savedBlog = await blog.save();
    return savedBlog.toObject();
  }

  async updateBlog(id: string, updates: Partial<InsertBlog>): Promise<Blog | undefined> {
    await this.connect();
    const updatedBlog = await BlogModel.findOneAndUpdate(
      { id },
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).lean();
    
    return updatedBlog || undefined;
  }

  async deleteBlog(id: string): Promise<boolean> {
    await this.connect();
    const result = await BlogModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async searchBlogs(authorId: string, query: string): Promise<Blog[]> {
    await this.connect();
    
    // Create search conditions
    const searchConditions = {
      authorId,
      $or: [
        { id: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    };
    
    const blogs = await BlogModel.find(searchConditions)
      .sort({ updatedAt: -1 })
      .lean();
    
    return blogs;
  }
}

export const storage = new MongoStorage();
