# Supabase Storage Permissions Debug Guide

## Issue Summary
You're getting the error: "No tienes permisos para subir imágenes. Asegúrate que tienes el rol de Administrador" when trying to upload images to the `service-images` bucket, even though you're signed in as an admin.

## Root Cause Analysis

The error indicates that the Row Level Security (RLS) policies on the `storage.objects` table are blocking your upload. This happens when:

1. **Policy Migration Not Applied**: The updated policies from `20250115000001-update-service-image-policies.sql` haven't been applied
2. **User Role Issues**: Your user profile doesn't have the correct role or there's an auth issue
3. **Database Sync Issues**: Local migrations aren't synced with your Supabase project

## Quick Diagnostic Steps

### 1. Check Your Current User Role
First, let's verify your actual role in the database. In your Supabase SQL Editor, run:

```sql
-- Check your current user and role
SELECT 
  auth.uid() as user_id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p 
WHERE p.id = auth.uid();
```

### 2. Check Current Storage Policies
Verify which policies are currently active:

```sql
-- Check current storage policies for service-images bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%service%';
```

### 3. Check if Bucket Exists and Settings
```sql
-- Check bucket configuration
SELECT 
  id,
  name,
  public,
  allowed_mime_types,
  file_size_limit
FROM storage.buckets 
WHERE id = 'service-images';
```

## Solutions

### Solution 1: Apply Missing Migration (Most Likely Fix)

The updated policies might not be applied. Run this in your Supabase SQL Editor:

```sql
-- Update policy to allow both admins and employees to upload service images
DROP POLICY IF EXISTS "Allow admins to upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to upload service images" ON storage.objects;

CREATE POLICY "Allow admins and employees to upload service images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

-- Update policy to allow both admins and employees to update service images
DROP POLICY IF EXISTS "Allow admins to update service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to update service images" ON storage.objects;

CREATE POLICY "Allow admins and employees to update service images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

-- Update policy to allow both admins and employees to delete service images
DROP POLICY IF EXISTS "Allow admins to delete service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to delete service images" ON storage.objects;

CREATE POLICY "Allow admins and employees to delete service images" ON storage.objects FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);
```

### Solution 2: Fix User Role (If Needed)

If your user doesn't have the admin role, update it:

```sql
-- Update your user role to admin (replace with your actual email)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Solution 3: Create Missing Profile (If Needed)

If no profile exists for your user:

```sql
-- Create admin profile (replace with your actual details)
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (auth.uid(), 'your-email@example.com', 'Your Full Name', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Solution 4: Re-create Bucket (Last Resort)

If the bucket configuration is corrupted:

```sql
-- Delete and recreate bucket
DELETE FROM storage.objects WHERE bucket_id = 'service-images';
DELETE FROM storage.buckets WHERE id = 'service-images';

-- Recreate bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'service-images', 
  'service-images', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

## Using Supabase CLI (Alternative)

If you have the Supabase CLI set up:

```bash
# Check migration status
supabase migration list

# Apply all pending migrations
supabase db push

# Or reset and apply all migrations
supabase db reset
```

## Verification Steps

After applying the fix, verify everything works:

### 1. Test Policy with SQL
```sql
-- Test if your user can upload (should return true)
SELECT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('admin', 'employee')
) as can_upload;
```

### 2. Test Upload in Application
1. Go to Admin → Services
2. Edit any service
3. Try uploading an image
4. Should work without the permission error

### 3. Check Browser Console
If still having issues, check the browser console for detailed error messages when uploading.

## Prevention

To prevent this issue in the future:

1. **Always apply migrations**: Ensure Supabase CLI migrations are synced
2. **Test policies**: Create test scripts to verify RLS policies
3. **Monitor auth state**: Add logging to check `auth.uid()` and user roles
4. **Use environment checks**: Verify policies exist in production

## Emergency Workaround

If you need immediate access, you can temporarily disable RLS on storage:

```sql
-- TEMPORARY: Disable RLS on storage.objects (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable it after fixing policies:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING**: Only use this as a last resort and re-enable RLS immediately after fixing the policies.

## Additional Debug Information

If none of the above solutions work, collect this debug info:

```sql
-- Debug query to understand the issue
SELECT 
  'Current User' as info,
  auth.uid() as user_id,
  auth.email() as email;

SELECT 
  'User Profile' as info,
  id,
  email,
  role,
  created_at
FROM public.profiles 
WHERE id = auth.uid();

SELECT 
  'Storage Policies' as info,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';
```

Run this and share the results if you need further assistance.