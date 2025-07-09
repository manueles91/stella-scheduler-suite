# Service Image Bucket Issue Analysis

## Issue Description
Users are getting a "bucket not found" error when clicking "Actualizar Servicio" (Update Service) while trying to update a service with an uploaded image in the Edit Service modal.

## Root Cause Analysis

### 1. The Problem
The error occurs in `src/components/admin/AdminServices.tsx` in the `uploadImage` function (line ~257):

```typescript
const { data, error } = await supabase.storage
  .from('service-images')  // ← This bucket doesn't exist
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });
```

### 2. Expected Setup
The migration file `supabase/migrations/20250708092023-add-service-images.sql` should create the `service-images` bucket:

```sql
-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('service-images', 'service-images', true) ON CONFLICT (id) DO NOTHING;
```

### 3. Why It's Not Working
The bucket doesn't exist, which means either:
- The migration hasn't been applied to the production database
- The migration was applied but failed during the bucket creation
- The bucket was created but later deleted or doesn't exist for some reason

## Solutions

### Solution 1: Apply the Migration (Recommended)
If using Supabase CLI:
```bash
# Apply all pending migrations
supabase db push

# Or specifically apply the migration
supabase migration up
```

### Solution 2: Manually Create the Bucket
If you have access to the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "Storage" section
3. Click "Create bucket"
4. Name it: `service-images`
5. Set as Public bucket: Yes
6. Create the bucket

### Solution 3: Create Bucket Programmatically
Add this one-time setup code to create the bucket:

```typescript
// Add this to your initialization code or run once
const createServiceImagesBucket = async () => {
  const { data, error } = await supabase.storage.createBucket('service-images', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 10485760 // 10MB
  });
  
  if (error && error.message !== 'Bucket already exists') {
    console.error('Error creating bucket:', error);
  }
};
```

### Solution 4: Update RLS Policies
After creating the bucket, ensure these policies exist in your database:

```sql
-- Policy to allow admins to upload service images
CREATE POLICY "Allow admins to upload service images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy to allow public access to service images
CREATE POLICY "Allow public access to service images" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');

-- Policy to allow admins to update service images
CREATE POLICY "Allow admins to update service images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy to allow admins to delete service images
CREATE POLICY "Allow admins to delete service images" ON storage.objects FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Verification Steps

After implementing the solution, verify:

1. **Check bucket exists**: In Supabase Dashboard > Storage, confirm `service-images` bucket exists
2. **Test image upload**: Try uploading an image when editing a service
3. **Verify permissions**: Ensure the user has admin role in the profiles table
4. **Check policies**: Confirm RLS policies are active on the storage.objects table

## Prevention

To prevent this issue in the future:

1. **Always apply migrations**: Ensure all migrations are applied to production
2. **Add error handling**: Improve error messages in the upload function
3. **Health checks**: Add startup checks to verify required buckets exist
4. **Documentation**: Keep track of required infrastructure (buckets, policies, etc.)

## Quick Fix for Immediate Resolution

The fastest solution is to manually create the bucket through the Supabase Dashboard:

1. Go to https://app.supabase.com/project/{your-project-id}/storage/buckets
2. Click "Create bucket"
3. Name: `service-images`
4. Public: Yes
5. Create

This should immediately resolve the "bucket not found" error when updating services with images.