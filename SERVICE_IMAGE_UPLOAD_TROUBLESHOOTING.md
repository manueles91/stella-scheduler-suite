# Service Image Upload Troubleshooting Guide

## Issue: "Failed to fetch" Error When Updating Service with Image

The "Failed to fetch" error in the Edit Service modal when uploading images can be caused by several issues. Follow this troubleshooting guide step by step.

## Quick Diagnosis Steps

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab for specific error messages when the upload fails. Look for:
- CORS errors
- Authentication errors  
- 403/401 status codes
- Network timeout errors

### 2. Check Network Tab
In Developer Tools > Network tab, watch for failed requests when uploading. Look for:
- Failed requests to Supabase storage endpoints
- 400/500 status codes
- Request timeouts

## Common Causes and Solutions

### Solution 1: Verify Bucket Exists and Configuration

Even though you mentioned creating the bucket, let's verify it's properly configured:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'service-images';

-- Verify bucket is public
SELECT id, name, public FROM storage.buckets WHERE id = 'service-images';
```

If bucket doesn't exist or isn't public:
```sql
-- Create bucket if missing
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true) 
ON CONFLICT (id) DO UPDATE SET public = true;
```

### Solution 2: Check RLS Policies

Verify the storage policies are correctly applied:

```sql
-- Check existing policies on storage.objects
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

Re-apply the policies if needed:
```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow admins and employees to upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to update service images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins and employees to delete service images" ON storage.objects;

-- Recreate policies
CREATE POLICY "Allow admins and employees to upload service images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

CREATE POLICY "Allow public access to service images" ON storage.objects FOR SELECT USING (bucket_id = 'service-images');

CREATE POLICY "Allow admins and employees to update service images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

CREATE POLICY "Allow admins and employees to delete service images" ON storage.objects FOR DELETE USING (
  bucket_id = 'service-images' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);
```

### Solution 3: Verify User Authentication and Role

Check if the current user has the proper role:

```sql
-- Check current user's profile and role
SELECT id, email, role FROM profiles WHERE id = auth.uid();
```

If the user doesn't have admin/employee role, update it:
```sql
-- Update user role (replace 'user-email@example.com' with actual email)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'user-email@example.com';
```

### Solution 4: Test Direct Storage Access

Create a simple test component to verify storage access:

```typescript
// Add this test function to your AdminServices.tsx for debugging
const testStorageAccess = async () => {
  try {
    console.log('Testing storage access...');
    
    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('Buckets:', buckets, 'Error:', bucketsError);
    
    // Test bucket files listing
    const { data: files, error: filesError } = await supabase.storage
      .from('service-images')
      .list();
    console.log('Files in bucket:', files, 'Error:', filesError);
    
    // Test authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user, 'Error:', userError);
    
    // Test profile
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('User profile:', profile, 'Error:', profileError);
    }
    
  } catch (error) {
    console.error('Storage test error:', error);
  }
};

// Add a test button to your component temporarily:
// <Button onClick={testStorageAccess}>Test Storage Access</Button>
```

### Solution 5: Enable RLS on Storage (if disabled)

Ensure RLS is enabled on the storage.objects table:

```sql
-- Enable RLS if it's disabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### Solution 6: Check File Size and Type Restrictions

Your code has these restrictions:
- Max file size: 10MB
- Allowed types: 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'

Verify the file you're uploading meets these criteria.

### Solution 7: Enhanced Error Handling

Add better error logging to the uploadImage function. Replace the existing uploadImage function with this enhanced version:

```typescript
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    setUploadingImage(true);
    setUploadProgress(0);
    
    console.log('Starting upload for file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    
    console.log('Generated filename:', fileName);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 80));
    }, 100);

    // Test authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'No user found'}`);
    }
    console.log('User authenticated:', user.id);

    // Test bucket access
    const { data: bucketTest, error: bucketError } = await supabase.storage
      .from('service-images')
      .list('', { limit: 1 });
    
    if (bucketError) {
      console.error('Bucket access test failed:', bucketError);
      throw new Error(`Bucket access failed: ${bucketError.message}`);
    }
    console.log('Bucket access confirmed');

    // Upload to Supabase storage
    console.log('Starting file upload...');
    const { data, error } = await supabase.storage
      .from('service-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (error) {
      console.error('Upload error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error
      });
      
      // Provide specific error messages for common issues
      let errorMessage = `Error al subir la imagen: ${error.message}`;
      
      if (error.message.includes('bucket') && error.message.includes('not found')) {
        errorMessage = "El bucket de almacenamiento no existe. Contacta al administrador para configurar el almacenamiento de imágenes.";
      } else if (error.message.includes('row-level security')) {
        errorMessage = "No tienes permisos para subir imágenes. Asegúrate de tener rol de administrador.";
      } else if (error.message.includes('file size')) {
        errorMessage = "La imagen es demasiado grande. Reduce el tamaño e intenta nuevamente.";
      } else if (error.message.includes('policy')) {
        errorMessage = "Error de permisos. Verifica que tengas rol de administrador o empleado.";
      }
      
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error('No se recibió respuesta del servidor al subir la imagen');
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('service-images')
      .getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error('No se pudo obtener la URL pública de la imagen');
    }

    console.log('Public URL generated:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('Image upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir la imagen';
    toast({
      title: "Error de subida",
      description: errorMessage,
      variant: "destructive",
    });
    return null;
  } finally {
    setUploadingImage(false);
    setUploadProgress(0);
  }
};
```

## Step-by-Step Debugging Process

1. **Open Browser DevTools** and go to Console tab
2. **Try uploading an image** and note any error messages
3. **Check Network tab** for failed requests
4. **Run the storage test function** (Solution 4) to verify access
5. **Check your user role** in the Supabase dashboard
6. **Verify bucket exists** in Supabase Storage dashboard
7. **Apply the enhanced error handling** (Solution 7) for better diagnostics

## Quick Fixes to Try First

1. **Refresh your browser** and try again
2. **Check if you're properly logged in** as an admin/employee
3. **Try a smaller image file** (under 1MB) to test
4. **Clear browser cache** and cookies for your site

## Prevention Tips

- Always check browser console for errors during development
- Test with different file sizes and types
- Regularly verify your Supabase policies are active
- Keep error logging comprehensive for easier debugging

If none of these solutions work, please share the specific error messages from the browser console for more targeted assistance.