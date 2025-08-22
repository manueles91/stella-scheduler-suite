import { supabase } from "@/integrations/supabase/client";

export type UploadOptions = {
  upsert?: boolean;
  cacheControlSeconds?: number;
};

export const uploadToBucket = async (
  bucket: string,
  folder: string,
  file: File,
  options?: UploadOptions
): Promise<string> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const objectKey = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(objectKey, file, {
    cacheControl: String(options?.cacheControlSeconds ?? 3600),
    upsert: options?.upsert ?? false,
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(objectKey);
  return publicUrl;
};

export const uploadToExactPath = async (
  bucket: string,
  objectKey: string,
  file: File,
  options?: UploadOptions
): Promise<string> => {
  const { error } = await supabase.storage.from(bucket).upload(objectKey, file, {
    cacheControl: String(options?.cacheControlSeconds ?? 3600),
    upsert: options?.upsert ?? false,
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(objectKey);
  return publicUrl;
};


