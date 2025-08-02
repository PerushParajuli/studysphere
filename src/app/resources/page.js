'use client';

import { useEffect, useState, useCallback } from 'react';
import supabase from '@/lib/supabase';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../components/ui/toast';
import { FaFolder, FaFile, FaFilePdf, FaFileWord, FaFileImage, FaFileAlt } from 'react-icons/fa';

// File type restrictions matching Supabase bucket configuration
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Helper function to get appropriate icon for file type
const getFileIcon = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return <FaFilePdf className="mr-2 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FaFileWord className="mr-2 text-blue-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <FaFileImage className="mr-2 text-green-500" />;
    case 'txt':
      return <FaFileAlt className="mr-2 text-gray-500" />;
    default:
      return <FaFile className="mr-2" />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get role-based path
const getRoleBasedPath = (user, currentPath, fileName = '') => {
  if (!user) return currentPath;
  
  let basePath = '';
  if (user.role === 'admin') {
    basePath = 'Admin';
  } else if (user.role === 'teacher') {
    basePath = `teachers/${user.name || 'unknown'}`;
  } else {
    // Students can't upload, but for safety
    return currentPath;
  }
  
  // If we're at root level, use the role-based path
  if (currentPath === './') {
    return fileName ? `${basePath}/${fileName}` : basePath;
  }
  
  // If we're already in a role-based path, append to current path
  const cleanPath = currentPath.replace('./', '');
  return fileName ? `${cleanPath}/${fileName}` : cleanPath;
};

// Helper function to get initial path based on user role
const getInitialPath = (user) => {
  if (!user) return './';
  
  // Students and teachers start at root to see all resources
  // This allows teachers to see both Admin folder and their own teacher folder
  if (user.role === 'student' || user.role === 'teacher') {
    return './';
  }
  
  // Only admins start directly in Admin folder
  if (user.role === 'admin') {
    return './Admin';
  }
  
  return './';
};

// Helper function to check if user can manage files in current path
const canManageInPath = (user, currentPath) => {
  if (!user) return false;
  
  if (user.role === 'admin') {
    return true; // Admins can manage everywhere
  }
  
  if (user.role === 'teacher') {
    const cleanPath = currentPath.replace('./', '');
    const pathParts = cleanPath.split('/');
    
    // Teachers can manage in their own folder
    if (pathParts[0] === 'teachers' && pathParts[1] === (user.name || 'unknown')) {
      return true;
    }
    
    // Teachers cannot manage in Admin folder (read-only)
    if (pathParts[0] === 'Admin') {
      return false;
    }
  }
  
  return false; // Students cannot manage
};

const ResourcesPage = () => {
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPath, setCurrentPath] = useState('./');
  const { toast } = useToast();

  const fetchResources = useCallback(async (path) => {
    console.log('Fetching resources for path:', path);
    setLoading(true);
    
    try {
      const listPath = path === './' ? '' : path.replace('./', '');
      console.log('Supabase listPath:', listPath);
      
      const { data, error } = await supabase.storage.from('resources').list(listPath);

      if (error) {
        console.error('Storage error:', error);
        toast.error(`Could not fetch resources: ${error.message}`);
        setResources([]);
      } else {
        console.log('Raw storage data:', data);
        const formattedResources = data
          .filter(item => item.name !== '.keep')
          .map(item => ({
            id: item.id || item.name,
            name: item.name,
            type: item.id ? 'file' : 'folder',
            path: listPath ? `${listPath}/${item.name}` : item.name,
          }));
        console.log('Formatted resources:', formattedResources);
        setResources(formattedResources);
      }
    } catch (error) {
      console.error('Fetch resources error:', error);
      toast.error('Failed to load resources');
      setResources([]);
    }
    
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, name')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('Profile fetch error:', error);
            toast.error('Failed to load user profile');
            setLoading(false);
            return;
          }
          
          console.log('User profile loaded:', profile);
          setUser({ ...user, ...profile });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('User fetch error:', error);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Initialize proper path based on user role and fetch resources
  useEffect(() => {
    if (user) {
      console.log('User loaded, initializing resources for role:', user.role);
      
      // For students and teachers, start at root to see all resources (including Admin folder)
      if (user.role === 'student' || user.role === 'teacher') {
        if (currentPath === './') {
          console.log('Loading root resources for', user.role);
          fetchResources('./');
        } else {
          fetchResources(currentPath);
        }
      } else if (user.role === 'admin') {
        // For admins, set initial path to Admin folder if still at root
        if (currentPath === './') {
          const initialPath = getInitialPath(user);
          console.log('Setting admin initial path:', initialPath);
          setCurrentPath(initialPath);
        } else {
          fetchResources(currentPath);
        }
      }
    }
  }, [user, currentPath, fetchResources]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
      toast.error('Invalid file type. Allowed types: PDF, DOC, DOCX, images, text files.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large. Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    // Frontend validation for hierarchical access
    if (!canManageInPath(user, currentPath)) {
      toast.error('You do not have permission to upload files in this location.');
      return;
    }

    setUploading(true);
    const storagePath = getRoleBasedPath(user, currentPath, file.name);
    const { error } = await supabase.storage.from('resources').upload(storagePath, file, {
      upsert: true,
    });

    setUploading(false);

    if (error) {
      if (error.message.includes('policy')) {
        toast.error('You do not have permission to upload files.');
      } else if (error.message.includes('duplicate')) {
        toast.error('A file with this name already exists.');
      } else if (error.message.includes('size')) {
        toast.error('File is too large.');
      } else {
        toast.error(`Failed to upload file: ${error.message}`);
      }
    } else {
      toast.success('File uploaded successfully!');
      fetchResources(currentPath);
    }
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Are you sure you want to delete "${resource.name}"?`)) {
      return;
    }

    if (resource.type === 'file') {
      const { error } = await supabase.storage.from('resources').remove([resource.path]);
      if (error) {
        if (error.message.includes('policy')) {
          toast.error('You do not have permission to delete this file.');
        } else {
          toast.error(`Failed to delete file: ${error.message}`);
        }
      } else {
        toast.success('File deleted successfully!');
        fetchResources(currentPath);
      }
    } else if (resource.type === 'folder') {
      const { data: files, error: listError } = await supabase.storage.from('resources').list(resource.path);

      if (listError) {
        toast.error(`Could not list files in folder: ${listError.message}`);
        return;
      }

      const filePathsToRemove = files.map(file => `${resource.path}/${file.name}`);
      filePathsToRemove.push(`${resource.path}`);

      if (filePathsToRemove.length > 0) {
        const { error: removeError } = await supabase.storage.from('resources').remove(filePathsToRemove);
        if (removeError) {
          if (removeError.message.includes('policy')) {
            toast.error('You do not have permission to delete this folder.');
          } else {
            toast.error(`Failed to delete folder: ${removeError.message}`);
          }
          return;
        }
      }
      
      toast.success('Folder deleted successfully!');
      fetchResources(currentPath);
    }
  };

  const handleCreateFolder = async () => {
    // Frontend validation for hierarchical access
    if (!canManageInPath(user, currentPath)) {
      toast.error('You do not have permission to create folders in this location.');
      return;
    }

    const folderName = prompt('Enter folder name:');
    if (!folderName || folderName.includes('/')) {
      toast.error('Invalid folder name.');
      return;
    }

    const folderPath = currentPath === './' ? `${folderName}/.keep` : `${currentPath.replace('./', '')}/${folderName}/.keep`;

    // Create a .keep file with supported MIME type to represent the folder
    const keepFile = new File([''], '.keep', { type: 'text/plain' });
    
    const { error } = await supabase.storage
      .from('resources')
      .upload(folderPath, keepFile, { 
        contentType: 'text/plain',
        upsert: false 
      });

    if (error) {
      if (error.message.includes('duplicate')) {
        toast.error('Folder with this name already exists.');
      } else if (error.message.includes('policy')) {
        toast.error('You do not have permission to create folders.');
      } else {
        toast.error(`Failed to create folder: ${error.message}`);
      }
    } else {
      toast.success('Folder created successfully!');
      fetchResources(currentPath);
    }
  };

  const handleNavigate = (resource) => {
    if (resource.type === 'folder') {
      setCurrentPath(`./${resource.path}`);
    }
  };

  const handleGoBack = () => {
    const pathParts = currentPath.replace('./', '').split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? './' : `./${pathParts.join('/')}`;
    setCurrentPath(newPath);
  };

  const handleDownload = async (resource) => {
    try {
      const { data, error } = await supabase.storage
        .from('resources')
        .createSignedUrl(resource.path, 3600); // URL valid for 1 hour

      if (error) {
        toast.error(`Failed to generate download link: ${error.message}`);
        return;
      }

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = resource.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Failed to download file.');
      console.error('Download error:', error);
    }
  };

  return (
    <DashboardLayout user={user}>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <CardTitle>Course Resources</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Supported files: PDF, DOC, DOCX, Images (JPG, PNG), Text files (max 10MB)
            </p>
          </div>
          <div>
            {currentPath !== './' && (
              <Button onClick={handleGoBack} className="mr-2">Back</Button>
            )}
            {user?.role === 'student' && (
              <Button onClick={() => setCurrentPath('./')} className="mr-2">All Resources</Button>
            )}
            {user?.role === 'teacher' && currentPath === './' && (
              <Button 
                onClick={() => setCurrentPath(`./teachers/${user.name || 'unknown'}`)} 
                className="mr-2"
              >
                My Folder
              </Button>
            )}
            {user?.role === 'teacher' && currentPath !== './' && (
              <Button onClick={() => setCurrentPath('./')} className="mr-2">All Resources</Button>
            )}
            {canManageInPath(user, currentPath) && (
              <>
                <Button onClick={handleCreateFolder} className="mr-2">Create Folder</Button>
                <Button 
                  onClick={() => document.getElementById('file-upload').click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </Button>
                <Input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={uploading} 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading resources...</p>
          ) : (
            <ul className="space-y-2">
              {resources.map(resource => (
                <li key={resource.id} className="flex justify-between items-center p-2 border rounded-md">
                  <div className="flex items-center cursor-pointer" onClick={() => handleNavigate(resource)}>
                    {resource.type === 'folder' ? <FaFolder className="mr-2 text-yellow-500" /> : getFileIcon(resource.name)}
                    {resource.name}
                  </div>
                  <div>
                    {resource.type === 'file' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => handleDownload(resource)}
                      >
                        Download
                      </Button>
                    )}
                    {(user?.role === 'teacher' || user?.role === 'admin') && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(resource)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ResourcesPage;

