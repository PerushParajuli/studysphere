-- Create the resources table
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path TEXT NOT NULL,
  type TEXT NOT NULL, -- 'file' or 'folder'
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for the resources table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow students to view all resources
CREATE POLICY "Allow students to view all resources"
ON resources
FOR SELECT
TO authenticated
USING (true);

-- Allow teachers to manage their own resources
CREATE POLICY "Allow teachers to manage their own resources"
ON resources
FOR ALL
TO authenticated
WITH CHECK (
  auth.uid() = owner_id AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
);

-- Allow admins to manage all resources
CREATE POLICY "Allow admins to manage all resources"
ON resources
FOR ALL
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
