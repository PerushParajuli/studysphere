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

  // Helper function to get display name for resources based on user role
  const getResourceDisplayName = (resourceName, user, currentPath) => {
    // Only rename folders to role-specific names at root level
    if (currentPath === './') {
      if ((user?.role === 'teacher' || user?.role === 'student' || user?.role === 'admin') && resourceName.toLowerCase() === 'teachers') {
        return 'Teachers';
      }
      if (user?.role === 'admin' && resourceName === 'Admin') {
        return 'My Folder';
      }
    }
    return resourceName;
  };

// Helper function to get role-based path
const getRoleBasedPath = (user, currentPath, fileName = '') => {
  if (!user) return currentPath;
  
  // For admins, they can upload anywhere they currently are
  if (user.role === 'admin') {
    const cleanPath = currentPath.replace('./', '');
    if (currentPath === './') {
      // If admin is at root, default to Admin folder
      return fileName ? `Admin/${fileName}` : 'Admin';
    } else {
      // If admin is in a subfolder, upload there
      return fileName ? `${cleanPath}/${fileName}` : cleanPath;
    }
  }
  
  // For teachers, they can only upload to their own folder
  if (user.role === 'teacher') {
    const basePath = `Teachers/${user.name || 'unknown'}`;
    
    // If we're at root level, use the teacher's folder
    if (currentPath === './') {
      return fileName ? `${basePath}/${fileName}` : basePath;
    }
    
    // If we're already in a role-based path, append to current path
    const cleanPath = currentPath.replace('./', '');
    return fileName ? `${cleanPath}/${fileName}` : cleanPath;
  }
  
  // Students can't upload, but for safety
  return currentPath;
};

// Helper function to get initial path based on user role
const getInitialPath = (user) => {
  if (!user) return './';
  
  // All users (students, teachers, and admins) start at root to see all resources
  // This allows everyone to see all folders, but with different permissions:
  // - Students: read-only access to all
  // - Teachers: read-only to Admin, full access to their own folder
  // - Admins: full CRUD access everywhere
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
    if (pathParts[0] === 'Teachers' && pathParts[1] === (user.name || 'unknown')) {
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
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
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
        let formattedResources = data
          .filter(item => item.name !== '.keep')
          .map(item => ({
            id: item.id || item.name,
            name: item.name,
            type: item.id ? 'file' : 'folder',
            path: listPath ? `${listPath}/${item.name}` : item.name,
          }));
        
        // Filter resources for teachers at root level
        if (user?.role === 'teacher' && currentPath === './') {
          formattedResources = formattedResources.filter(item => {
            return item.name === 'Admin' || item.name === 'Teachers' || item.name === 'teachers';
          });
        }
        
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
    }
    fetchUser();
  }, []);

  // Navigation handler for double-click
  const handleNavigate = (resource) => {
    if (resource.type === 'folder') {
      setCurrentPath(`./${resource.path}`);
    } else if (resource.type === 'file') {
      handleViewFile(resource);
    }
  };

  // Go back to parent directory
  const handleGoBack = () => {
    const pathParts = currentPath.replace('./', '').split('/').filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.length === 0 ? './' : `./${pathParts.join('/')}`;
    setCurrentPath(newPath);
  };

  // Check if file can be viewed inline
  const canViewInline = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    return ['pdf', 'jpg', 'jpeg', 'png', 'txt'].includes(extension);
  };

  // View file content inline
  const handleViewFile = async (resource) => {
    if (!canViewInline(resource.name)) {
      toast.info('File type not supported for preview');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('resources')
        .createSignedUrl(resource.path, 3600);

      if (error) {
        toast.error(`Failed to generate view link: ${error.message}`);
        return;
      }

      const extension = resource.name.toLowerCase().split('.').pop();
      
      if (extension === 'txt') {
        // Fetch text content
        try {
          const response = await fetch(data.signedUrl);
          const text = await response.text();
          setFileContent(text);
        } catch (fetchError) {
          setFileContent('Error loading file content');
        }
      }

      setViewingFile({
        name: resource.name,
        url: data.signedUrl,
        extension,
        path: resource.path
      });
    } catch (error) {
      toast.error('Failed to open file');
    }
  };

  // Close file viewer
  const closeViewer = () => {
    setViewingFile(null);
    setFileContent('');
  };

  // Handle right-click context menu
  const handleContextMenu = (e, resource) => {
    e.preventDefault();
    console.log('Right-click detected on:', resource.name);
    console.log('Can manage in path:', canManageInPath(user, currentPath));
    if (!canManageInPath(user, currentPath)) {
      console.log('No permission to manage files in this path');
      return; // Don't show context menu if user can't manage files
    }
    console.log('Setting context menu at:', e.clientX, e.clientY);
    setSelectedResource(resource);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedResource(null);
  };

  // Handle rename
  const handleRename = async (resource) => {
    const newName = prompt('Enter new name:', resource.name);
    if (!newName || newName === resource.name) {
      closeContextMenu();
      return;
    }

    const pathParts = resource.path.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    try {
      if (resource.type === 'file') {
        // For files, we need to copy and delete
        const { error: copyError } = await supabase.storage
          .from('resources')
          .copy(resource.path, newPath);

        if (copyError) {
          toast.error(`Failed to rename: ${copyError.message}`);
          closeContextMenu();
          return;
        }

        const { error: deleteError } = await supabase.storage
          .from('resources')
          .remove([resource.path]);

        if (deleteError) {
          toast.error(`Failed to delete original: ${deleteError.message}`);
          closeContextMenu();
          return;
        }
      } else {
        // For folders, we need to rename all files inside
        const { data: files, error: listError } = await supabase.storage
          .from('resources')
          .list(resource.path);

        if (listError) {
          toast.error(`Failed to list folder contents: ${listError.message}`);
          closeContextMenu();
          return;
        }

        // Copy all files to new folder path
        for (const file of files) {
          const oldFilePath = `${resource.path}/${file.name}`;
          const newFilePath = `${newPath}/${file.name}`;
          
          const { error: copyError } = await supabase.storage
            .from('resources')
            .copy(oldFilePath, newFilePath);

          if (copyError) {
            toast.error(`Failed to copy file ${file.name}: ${copyError.message}`);
            closeContextMenu();
            return;
          }
        }

        // Delete old folder
        const filesToDelete = files.map(file => `${resource.path}/${file.name}`);
        if (filesToDelete.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from('resources')
            .remove(filesToDelete);

          if (deleteError) {
            toast.error(`Failed to delete old folder: ${deleteError.message}`);
            closeContextMenu();
            return;
          }
        }
      }

      toast.success('Renamed successfully!');
      fetchResources(currentPath);
    } catch (error) {
      toast.error('Failed to rename.');
    }
    closeContextMenu();
  };

  // Initialize proper path based on user role and fetch resources
  useEffect(() => {
    if (user) {
      console.log('User loaded, initializing resources for role:', user.role);
      
      // All user types start at root to see all resources
      // Students: read-only access to all folders
      // Teachers: read-only to Admin, full access to their own teacher folder  
      // Admins: full CRUD access everywhere
      if (currentPath === './') {
        console.log('Loading root resources for', user.role);
        fetchResources('./');
      } else {
        fetchResources(currentPath);
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

  // Handle delete
  const handleDelete = async (resource) => {
    const confirmMessage = resource.type === 'folder' 
      ? `Are you sure you want to delete the folder "${resource.name}" and all its contents?`
      : `Are you sure you want to delete "${resource.name}"?`;
      
    if (!window.confirm(confirmMessage)) {
      closeContextMenu();
      return;
    }

    try {
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
          closeContextMenu();
          return;
        }

        const filePathsToRemove = files.map(file => `${resource.path}/${file.name}`);
        
        if (filePathsToRemove.length > 0) {
          const { error: removeError } = await supabase.storage.from('resources').remove(filePathsToRemove);
          if (removeError) {
            if (removeError.message.includes('policy')) {
              toast.error('You do not have permission to delete this folder.');
            } else {
              toast.error(`Failed to delete folder: ${removeError.message}`);
            }
            closeContextMenu();
            return;
          }
        }
        
        toast.success('Folder deleted successfully!');
        fetchResources(currentPath);
      }
    } catch (error) {
      toast.error('Failed to delete.');
    }
    closeContextMenu();
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
    <div onClick={closeContextMenu}>
      {/* Context Menu */}
      {contextMenu && selectedResource && (
        <div
          className="fixed z-50 w-40 bg-white shadow-lg border border-gray-200 rounded-md py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 transition-colors"
            onClick={() => handleRename(selectedResource)}
          >
            🏷️ Rename
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => handleDelete(selectedResource)}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Full-screen file viewer */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]" onClick={closeViewer}>
          <div className="bg-white rounded-lg max-w-6xl max-h-[95vh] w-full mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">{viewingFile.name}</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={closeViewer}
                className="bg-white hover:bg-gray-100 text-gray-700 border-gray-300"
              >
                ✕ Close
              </Button>
            </div>
            <div className="p-4 max-h-[calc(95vh-8rem)] overflow-auto bg-gray-50">
              {viewingFile.extension === 'pdf' && (
                <div className="bg-white rounded shadow-sm">
                  <iframe 
                    src={viewingFile.url} 
                    className="w-full h-[80vh] rounded" 
                    title={viewingFile.name}
                  />
                </div>
              )}
              {(['jpg', 'jpeg', 'png'].includes(viewingFile.extension)) && (
                <div className="flex justify-center bg-white rounded p-4 shadow-sm">
                  <img 
                    src={viewingFile.url} 
                    alt={viewingFile.name} 
                    className="max-w-full max-h-[80vh] object-contain rounded"
                  />
                </div>
              )}
              {viewingFile.extension === 'txt' && (
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                    {fileContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <DashboardLayout user={user}>
        <div className="h-full bg-gray-50 rounded-t-lg overflow-hidden border border-gray-200">
          {/* File Manager Toolbar */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentPath !== './' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGoBack}
                    className="px-3 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  >
                    ← Back
                  </Button>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <FaFolder className="mr-1 text-amber-500" />
                  <span>{currentPath === './' ? 'Resources' : currentPath.replace('./', '')}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {user?.role === 'teacher' && currentPath === './' && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPath(`./Teachers/${user.name || 'unknown'}`)}
                    className="px-3 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  >
                    My Folder
                  </Button>
                )}
                {canManageInPath(user, currentPath) && (
                  <>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleCreateFolder}
                      className="px-3 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                    >
                      + New Folder
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload').click()}
                      disabled={uploading}
                      className="px-3 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-300 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : '+ Upload'}
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
            </div>
          </div>

          {/* File Grid - Desktop Style */}
          <div className="p-4 bg-gray-50 h-full overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                {resources.map(resource => (
                  <div 
                    key={resource.id}
                    className="flex flex-col items-center p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors duration-200 group"
                    onDoubleClick={() => handleNavigate(resource)}
                    onContextMenu={(e) => handleContextMenu(e, resource)}
                  >
                    <div className="mb-2">
                      {resource.type === 'folder' ? (
                        <FaFolder className="text-5xl text-amber-500 drop-shadow-sm" />
                      ) : (
                        <div className="text-5xl drop-shadow-sm">
                          {getFileIcon(resource.name)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-center leading-tight text-gray-700 group-hover:text-blue-700 max-w-full break-words px-1">
                      {getResourceDisplayName(resource.name, user, currentPath)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </div>
  );
};

export default ResourcesPage;

