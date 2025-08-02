-- StudySphere Storage Policies Migration
-- Created: August 2, 2025
-- Apply via: Supabase Dashboard -> SQL Editor

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated read access to resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers and admins to upload to resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers and admins to delete from resources" ON storage.objects;
DROP POLICY IF EXISTS "Allow students to upload assignments" ON storage.objects;
DROP POLICY IF EXISTS "Allow students to view their own assignments" ON storage.objects;
DROP POLICY IF EXISTS "Allow students to delete their own assignments" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers and admins to view all assignments" ON storage.objects;
DROP POLICY IF EXISTS "Allow teachers and admins to delete any assignment" ON storage.objects;

-- ========================================
-- RESOURCES BUCKET POLICIES
-- ========================================

-- 1. Admin Policy - Full access to resources bucket
CREATE POLICY "Admins full access to resources"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'resources' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  bucket_id = 'resources' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. Teacher Policy - Manage own folder + read Admin folder
CREATE POLICY "Teachers manage their own folder"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'resources' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher' AND
  (
    -- Own teacher folder
    split_part(name, '/', 1) = 'Teachers' AND
    split_part(name, '/', 2) = (
      SELECT COALESCE(name, 'unknown')
      FROM public.profiles 
      WHERE id = auth.uid()
    )
    OR
    -- Read access to Admin folder
    split_part(name, '/', 1) = 'Admin'
  )
)
WITH CHECK (
  bucket_id = 'resources' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher' AND
  -- Teachers can only upload to their own folder (not Admin)
  split_part(name, '/', 1) = 'Teachers' AND
  split_part(name, '/', 2) = (
    SELECT COALESCE(name, 'unknown')
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- 3. Student Policy - Read-only access to all resources
CREATE POLICY "Students read all resources"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resources' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student'
);

-- ========================================
-- ASSIGNMENTS BUCKET POLICIES (EXISTING)
-- ========================================

-- Re-create existing assignment policies
CREATE POLICY "Allow students to upload assignments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignments' AND 
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Allow students to view their own assignments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignments' AND 
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Allow students to delete their own assignments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignments' AND 
  split_part(name, '/', 1) = auth.uid()::text
);

CREATE POLICY "Allow teachers and admins to view all assignments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignments' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'admin')
);

CREATE POLICY "Allow teachers and admins to delete any assignment"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignments' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('teacher', 'admin')
);

-- ========================================
-- HELPER FUNCTIONS FOR FOLDER MANAGEMENT
-- ========================================

-- Function to ensure folder structure exists
CREATE OR REPLACE FUNCTION public.ensure_folder_structure()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This can be called from the application to ensure proper structure
  -- Implementation depends on your specific needs
  RETURN;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.ensure_folder_structure() TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "Admins full access to resources" ON storage.objects IS 
'Allows admins to manage all files in resources bucket. Admin files go to Admin/ folder by default.';

COMMENT ON POLICY "Teachers manage their own folder" ON storage.objects IS 
'Teachers can manage files in their Teachers/{name}/ folder and read Admin/ folder.';

COMMENT ON POLICY "Students read all resources" ON storage.objects IS 
'Students have read-only access to view and download all resources.';
