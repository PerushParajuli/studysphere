# StudySphere Project Context

## Project Goal
To implement a secure, hierarchical file and folder management system for course resources within the StudySphere application. The system needs to support three distinct user roles: Students, Teachers, and Admins, each with specific permissions.

### Role-Based Permissions
*   **Students**: Can view the folder structure, navigate through folders, and download files. They have read-only access.
*   **Teachers**: Have full control over their own resources. They can create, delete, and rename folders and files.
*   **Admins**: Have global control over all resources from all teachers, with the same management capabilities as teachers.

## Implementation Summary

To achieve this, the following steps have been completed:

1.  **Database Schema and Security**: A new database table named `resources` was designed and a SQL migration script (`supabase/migrations/20250730180346_create_resources_table.sql`) was created. This script includes:
    *   The schema for the `resources` table to store file and folder metadata, including `path`, `type`, and `name`.
    *   Row Level Security (RLS) policies to enforce the specified access rules for each user role, ensuring data is secure at the database level.

2.  **Frontend Development**: The main resource management interface (`src/app/resources/page.js`) was significantly refactored:
    *   **UI Overhaul**: The previous flat file list was replaced with a dynamic, hierarchical view that supports folder navigation.
    *   **File and Folder Operations**: Functionality was added for creating folders, uploading files into the current directory, and deleting both files and folders.
    *   **User Experience**: `react-icons` was added to visually distinguish between files and folders, and navigation controls (e.g., a "Back" button) were implemented.

3.  **Debugging and Refinement**: We addressed several issues that arose during development:
    *   **Infinite Loop**: Fixed a critical bug causing the application to repeatedly fetch resources due to an incorrect dependency in a `useEffect` hook. This was resolved by removing the unstable dependency and optimizing the data-fetching function with `useCallback`.
    *   **Initialization Errors**: Corrected a JavaScript hoisting issue where a function was called before it was defined by reordering the code.
    *   **Database Errors**: Diagnosed and provided solutions for errors related to the database schema, which occurred because the migration script had not yet been applied in the user's Supabase project.

## Current Project Status

The core functionality for the resources management system has been implemented. The frontend code is in place, and the database migration script is ready.

The immediate next step is for the user to **apply the SQL migration** in their Supabase project. This will create the necessary `resources` table and apply the security policies, which should resolve the final outstanding errors related to the schema cache.

