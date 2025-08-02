# StudySphere - Student Learning Management System

StudySphere is a comprehensive learning management system built with Next.js and Supabase, designed for educational institutions to manage students, teachers, and administrators.

## Features

### User Management
- **Role-based authentication**: Students, Teachers, and Admins
- **Admin dashboard**: User approval and management system
- **Profile management**: User profiles with role-based permissions

### Resources Management System
The resources system implements a hierarchical folder structure where:

#### Student Experience
- View subjects as folders (similar to mobile/desktop folder structure)
- Browse through folder hierarchy
- Download files and resources
- Read-only access to all resources

#### Teacher Experience
- Create and delete folders
- Upload files to any folder
- Delete their own files and folders
- Rename resources
- Full CRUD operations on their content

#### Admin Experience
- Full access to all resources from all teachers
- Same CRUD capabilities as teachers
- Can manage any teacher's resources
- Global resource management

### Resource Structure Example
```
./resources/
├── Network Programming/
│   └── Unit 1/
│       ├── random.pdf
│       └── definition.docx
├── Advanced Java Programming/
│   └── Images/
│       └── image.png
├── Admin/
│   └── guidelines.txt
├── Machine Learning/
└── Image Vision/
```

## Technology Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Supabase (Database + Authentication + Storage)
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: React Icons (Folder and File icons)

## Database Schema

### Existing Tables
- `profiles`: User profiles with roles (student, teacher, admin, pending)
- `profile_with_email`: View combining profiles with auth.users email

### New Tables
- `resources`: File and folder metadata with hierarchical structure
  - `id`: UUID primary key
  - `path`: Current directory path
  - `type`: 'file' or 'folder'
  - `name`: Resource name
  - `owner_id`: References auth.users(id)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

## Row Level Security (RLS) Policies

### Resources Table Policies
1. **Students**: Read-only access to all resources
2. **Teachers**: Full CRUD on their own resources
3. **Admins**: Full CRUD on all resources

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Migration
Run the following SQL in your Supabase SQL editor:

```sql
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
```

### 4. Storage Configuration
Ensure your Supabase Storage bucket named `resources` is created and properly configured with appropriate policies.

**IMPORTANT**: Storage policies must be created via Supabase Dashboard > Storage > Policies interface, NOT via SQL Editor.
Refer to: `/home/perush/Desktop/storage_policies_dashboard_guide.md` for detailed instructions.

### 5. Run the Application
```bash
npm run dev
```

## Project Structure
```
src/
├── app/
│   ├── admin-dashboard/     # Admin user management
│   ├── components/          # Reusable UI components
│   ├── dashboard/           # Main dashboard
│   ├── resources/           # Resources management (NEW)
│   ├── login/              # Authentication
│   └── register/           # User registration
├── lib/
│   └── supabase.js         # Supabase client configuration
└── supabase/
    └── migrations/         # Database migration files
```

## Recent Updates (Context)

**User Request**: Implement a hierarchical folder-based resources system with role-specific permissions:
- Students: View and download only
- Teachers: Full management of their resources
- Admins: Full management of all resources

**Implementation Aug 2, 2025**:
- Introduced comprehensive role-based resource management.
- Automatic folder structuring for resource uploads.
- Mirrored structure for students with read-only functionality.
- Teachers can manage specific resource areas.
- Updated Supabase policies to reinforce these structures.

**Policies Added**:
- Full access for Admins.
- Teacher-specific folder management with Admin folder read-only.
- Student read-only access to everything.

**Dependencies Added**:
- Updated Supabase functions for dynamic folder checks.

The system now supports a sophisticated hierarchical file management system, ensuring controlled access per user role.
