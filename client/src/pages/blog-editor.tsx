import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAutoSave } from '@/hooks/use-auto-save';
import { Navbar } from '@/components/navbar';
import { AutoSaveIndicator } from '@/components/auto-save-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Save, 
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Eye,
  Clock,
  Hash,
  FileText
} from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

type AutoSaveStatus = 'saving' | 'saved' | 'error' | 'idle';

export default function BlogEditorPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract blog ID from URL params
  const blogId = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    console.log('Window location search:', window.location.search);
    console.log('Extracted blog ID:', id);
    return id;
  }, [location]); // Re-run when location changes

  // Debug URL parsing
  console.log('Current location:', location);
  console.log('Extracted blog ID:', blogId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');

  // Load existing blog if editing
  const { data: blog, isLoading: isBlogLoading, error: blogError } = useQuery<Blog>({
  queryKey: [`/api/blogs/${blogId}`],
  enabled: !!blogId,
});

  // Update form when blog data loads
  useEffect(() => {
    if (blog) {
      setTitle(blog.title || '');
      setContent(blog.content || '');
      setTagsInput(blog.tags ? blog.tags.join(', ') : '');
    }
  }, [blog]);

  // Debug: Log blog data when it loads
  useEffect(() => {
    if (blogId) {
      console.log('Loading blog with ID:', blogId);
      console.log('Blog data:', blog);
      console.log('Blog loading state:', isBlogLoading);
      console.log('Blog error:', blogError);
    }
  }, [blogId, blog, isBlogLoading, blogError]);

  // Parse tags from input
  const tags = tagsInput
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);

  // Auto-save hook
  useAutoSave(
    { title, content, tags },
    blogId,
    {
      onSaveStart: () => setAutoSaveStatus('saving'),
      onSaveSuccess: () => setAutoSaveStatus('saved'),
      onSaveError: () => setAutoSaveStatus('error'),
    }
  );

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: () => {
      if (blogId) {
        return api.updateBlog(blogId, { title, content, tags, status: 'draft' });
      } else {
        return api.saveDraft(title, content, tags);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
      if (!blogId) {
        // Navigate to edit mode with the new blog ID
        const result = data as any;
        setLocation(`/editor?id=${result.id}`);
      }
      toast({
        title: "Draft saved",
        description: "Your blog draft has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save draft",
        variant: "destructive",
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: () => {
      if (blogId) {
        return api.updateBlog(blogId, { title, content, tags, status: 'published' });
      } else {
        return api.publishBlog(title, content, tags);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
      toast({
        title: "Blog published!",
        description: "Your blog post has been published successfully.",
      });
      setLocation('/blogs');
    },
    onError: (error) => {
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Failed to publish blog",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing content",
        description: "Please add a title and content before saving.",
        variant: "destructive",
      });
      return;
    }
    saveDraftMutation.mutate();
  };

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing content",
        description: "Please add a title and content before publishing.",
        variant: "destructive",
      });
      return;
    }
    publishMutation.mutate();
  };

  const getWordCount = () => {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = () => {
    const wordsPerMinute = 200;
    const words = getWordCount();
    return Math.ceil(words / wordsPerMinute);
  };

  const formatToolbarButton = (icon: React.ReactNode, action: string) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="p-2 h-8 w-8"
      onClick={() => {
        // Basic text formatting would go here
        // For a production app, you'd integrate with a rich text editor
        console.log(`Format: ${action}`);
      }}
    >
      {icon}
    </Button>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Editor Column */}
          <div className="lg:col-span-8">
            <Card className="animate-slide-up">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation('/blogs')}
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </Button>
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">Blog Editor</h1>
                      <p className="text-muted-foreground text-sm">
                        {blogId ? 'Edit your blog post' : 'Create a new blog post'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AutoSaveIndicator status={autoSaveStatus} />
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={saveDraftMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}</span>
                    </Button>
                    <Button
                      onClick={handlePublish}
                      disabled={publishMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{publishMutation.isPending ? 'Publishing...' : 'Publish'}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Title Input */}
                <div>
                  <Label htmlFor="title" className="text-base font-medium">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your blog title..."
                    className="mt-2 text-xl font-semibold h-12"
                  />
                </div>

                {/* Tags Input */}
                <div>
                  <Label htmlFor="tags" className="text-base font-medium">Tags</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Enter tags separated by commas (e.g., React, JavaScript, Tutorial)"
                    className="mt-2"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-primary/20 text-primary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content Editor */}
                <div>
                  <Label htmlFor="content" className="text-base font-medium">Content</Label>
                  
                  {/* Toolbar */}
                  <div className="mt-2 flex items-center space-x-1 p-3 bg-muted rounded-lg border">
                    {formatToolbarButton(<Bold className="w-4 h-4" />, 'bold')}
                    {formatToolbarButton(<Italic className="w-4 h-4" />, 'italic')}
                    {formatToolbarButton(<Underline className="w-4 h-4" />, 'underline')}
                    <div className="w-px h-6 bg-border mx-2" />
                    {formatToolbarButton(<List className="w-4 h-4" />, 'bullet-list')}
                    {formatToolbarButton(<ListOrdered className="w-4 h-4" />, 'ordered-list')}
                    <div className="w-px h-6 bg-border mx-2" />
                    {formatToolbarButton(<Link className="w-4 h-4" />, 'link')}
                    {formatToolbarButton(<Image className="w-4 h-4" />, 'image')}
                    {formatToolbarButton(<Code className="w-4 h-4" />, 'code')}
                  </div>

                  {/* Content Textarea */}
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your amazing blog post..."
                    className="mt-1 min-h-[400px] resize-none text-base leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Publishing Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge 
                      className={
                        blog?.status === 'published' 
                          ? 'bg-green-500/20 text-green-500 border-green-500/20'
                          : 'bg-orange-500/20 text-orange-500 border-orange-500/20'
                      }
                    >
                      {blog?.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Word Count</Label>
                  <p className="text-sm text-foreground mt-1">{getWordCount()} words</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reading Time</Label>
                  <p className="text-sm text-foreground mt-1">~{getReadingTime()} min read</p>
                </div>

                {blog && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Modified</Label>
                    <p className="text-sm text-foreground mt-1">
                      {new Date(blog.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Writing Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Hash className="w-5 h-5 mr-2 text-primary" />
                  Writing Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Use clear, descriptive headings to structure your content</p>
                <p>• Add relevant tags to help readers find your post</p>
                <p>• Write in short paragraphs for better readability</p>
                <p>• Your changes are automatically saved every 5 seconds</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
