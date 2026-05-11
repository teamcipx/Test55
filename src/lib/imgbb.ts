/// <reference types="vite/client" />
import { supabase } from "./supabase";

export async function uploadToImgBB(file: File): Promise<string | null> {
  let apiKeys: string[] = [];

  // Try to fetch multiple API keys from Database Settings
  if (supabase) {
    try {
      const { data, error } = await supabase.from('settings').select('value').eq('id', 'imgbb_keys').single();
      if (!error && data?.value && Array.isArray(data.value)) {
        apiKeys = data.value;
      }
    } catch (err) {
      console.warn("Failed to fetch ImgBB keys from settings:", err);
    }
  }

  const envKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (envKey && !apiKeys.includes(envKey)) {
    apiKeys.push(envKey);
  }

  if (apiKeys.length === 0) {
    console.error("ImgBB API key is missing. Please set VITE_IMGBB_API_KEY or configure in Admin Panel.");
    return null;
  }

  const formData = new FormData();
  formData.append('image', file);

  // Try keys sequentially until one succeeds
  for (const apiKey of apiKeys) {
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        return data.data.url;
      } else {
        console.warn(`ImgBB Upload Failed with key ${apiKey.substring(0,4)}...:`, data.error?.message);
        // continue to next key
      }
    } catch (error) {
      console.warn(`Error uploading image with key ${apiKey.substring(0,4)}...:`, error);
      // continue to next key
    }
  }

  console.error("All ImgBB API keys failed.");
  return null;
}

