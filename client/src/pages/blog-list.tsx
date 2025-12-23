import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  FileText, 
  Edit3, 
  Globe, 
  Eye, 
  Calendar,
  Tag,
  Trash2,
  MoreVertical,
  Search,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Blog {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export default function BlogListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: blogs = [], isLoading } = useQuery<Blog[]>({
    queryKey: ['/api/blogs'],
    enabled: !isSearching,
  });

  // Search query
  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery<Blog[]>({
    queryKey: ['/api/blogs/search', searchQuery],
    queryFn: () => api.searchBlogs(searchQuery) as Promise<Blog[]>,
    enabled: isSearching && searchQuery.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
      toast({
        title: "Blog deleted",
        description: "The blog post has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete blog",
        variant: "destructive",
      });
    },
  });

  // Use search results if searching, otherwise use regular blogs
  const displayBlogs = isSearching ? searchResults : blogs;
  const publishedBlogs = displayBlogs.filter((blog: Blog) => blog.status === 'published');
  const draftBlogs = displayBlogs.filter((blog: Blog) => blog.status === 'draft');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getExcerpt = (content: string, length = 150) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > length 
      ? plainText.substring(0, length) + '...'
      : plainText;
  };

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    return `~${time} min read`;
  };

  const handleEdit = (blog: Blog) => {
    setLocation(`/editor?id=${blog.id}`);
  };

  const handleDelete = (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (blogToDelete) {
      deleteMutation.mutate(blogToDelete.id);
    }
  };

  if (isLoading || isSearchLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="w-12 h-12 bg-muted rounded-xl"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-16 mt-1"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Blogs</h1>
              <p className="text-muted-foreground">Manage your published posts and drafts</p>
            </div>
            <Button
              onClick={() => setLocation('/editor')}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Post</span>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isSearching && (
            <div className="mb-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Search results for "{searchQuery}" • {displayBlogs.length} found
              </Badge>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Posts</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{blogs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <FileText className="text-primary text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Published</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">{publishedBlogs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Globe className="text-green-500 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Drafts</p>
                    <p className="text-2xl font-bold text-orange-500 mt-1">{draftBlogs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Edit3 className="text-orange-500 text-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-12">
          {/* Published Blogs Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center">
                <Globe className="text-green-500 mr-2" />
                Published Posts
              </h2>
              <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                {publishedBlogs.length} posts
              </Badge>
            </div>
            
            {publishedBlogs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No published posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start writing and publish your first blog post to share with the world.
                  </p>
                  <Button onClick={() => setLocation('/editor')}>
                    Create Your First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {publishedBlogs.map((blog) => (
                  <Card 
                    key={blog.id} 
                    className="hover:border-primary/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => handleEdit(blog)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors mb-2">
                            {blog.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {getExcerpt(blog.content)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                            Published
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(blog);
                              }}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(blog);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(blog.createdAt)}
                          </span>
                          <span>{getReadingTime(blog.content)}</span>
                        </div>
                        {blog.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span className="max-w-32 truncate">
                              {blog.tags.slice(0, 2).join(', ')}
                              {blog.tags.length > 2 && '...'}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Draft Blogs Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center">
                <Edit3 className="text-orange-500 mr-2" />
                Drafts
              </h2>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
                {draftBlogs.length} drafts
              </Badge>
            </div>
            
            {draftBlogs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No drafts saved</h3>
                  <p className="text-muted-foreground mb-4">
                    Your draft posts will appear here as you write and save them.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {draftBlogs.map((blog) => (
                  <Card 
                    key={blog.id} 
                    className="hover:border-orange-500/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => handleEdit(blog)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-orange-500 transition-colors mb-2">
                            {blog.title || 'Untitled Draft'}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {getExcerpt(blog.content) || 'No content yet...'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/20">
                            Draft
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(blog);
                              }}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(blog);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span>Last edited: {formatDate(blog.updatedAt)}</span>
                          <span>{getReadingTime(blog.content)}</span>
                        </div>
                        {blog.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span className="max-w-32 truncate">
                              {blog.tags.slice(0, 2).join(', ')}
                              {blog.tags.length > 2 && '...'}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{blogToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
