import { auth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PenTool, FileText, Plus, LogOut, ChevronDown } from 'lucide-react';

export function Navbar() {
  const [location, setLocation] = useLocation();
  const user = auth.getUser();

  const handleLogout = () => {
    auth.clearAuth();
    setLocation('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <PenTool className="text-primary-foreground text-lg" />
              </div>
              <h1 className="text-xl font-bold text-foreground">GenWrite</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Button
                variant={location === '/blogs' ? 'default' : 'ghost'}
                onClick={() => setLocation('/blogs')}
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>My Blogs</span>
              </Button>
              <Button
                variant={location === '/editor' ? 'default' : 'ghost'}
                onClick={() => setLocation('/editor')}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Post</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-foreground">
                    {user?.name || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
