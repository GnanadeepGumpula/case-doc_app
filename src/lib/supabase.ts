import { createClient } from "@supabase/supabase-js";

// Look into both Vite meta variables and standard environment contexts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Alert the developer dynamically inside the browser if the environment variables failed to bundle
if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  alert(
    "CRITICAL: Your .env credentials are not loading! The application cannot connect to your database. Please verify your environment configurations."
  );
}

// Fall back to a structural string to satisfy the compiler without generating broken requests
export const supabase = createClient(
  supabaseUrl || "https://your-project-id.supabase.co", 
  supabaseAnonKey || "placeholder"
);

export async function uploadAssetToBucket(file: File, folder: string = "cases") {
  if (!supabaseUrl) return null;
  
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}