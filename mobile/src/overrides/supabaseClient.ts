import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

interface CapacitorWindow {
  Capacitor?: {
    Plugins?: {
      Preferences?: {
        get: (opts: { key: string }) => Promise<{ value: string | null }>;
        set: (opts: { key: string; value: string }) => Promise<void>;
        remove: (opts: { key: string }) => Promise<void>;
      };
    };
  };
}

/**
 * Mobile-safe persistent storage adapter for Supabase Auth.
 * Bridges native Capacitor Preferences (SharedPreferences on Android / UserDefaults on iOS)
 * with robust local storage fallbacks so authentication sessions survive app backgrounding,
 * kills, and WebView cache clears.
 */
class MobileStorageAdapter {
  private memoryCache = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    try {
      // Check in-memory cache first
      if (this.memoryCache.has(key)) {
        return this.memoryCache.get(key) || null;
      }

      // Check Capacitor Preferences bridge if available on window
      const cap = (window as unknown as CapacitorWindow).Capacitor;
      if (cap?.Plugins?.Preferences?.get) {
        const { value } = await cap.Plugins.Preferences.get({ key });
        if (value !== null && value !== undefined) {
          this.memoryCache.set(key, value);
          return value;
        }
      }

      // Fallback to localStorage
      const value = localStorage.getItem(key);
      if (value !== null) {
        this.memoryCache.set(key, value);
      }
      return value;
    } catch (err) {
      console.warn("[MobileStorageAdapter] Failed to getItem:", err);
      return localStorage.getItem(key);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      this.memoryCache.set(key, value);
      localStorage.setItem(key, value);

      const cap = (window as unknown as CapacitorWindow).Capacitor;
      if (cap?.Plugins?.Preferences?.set) {
        await cap.Plugins.Preferences.set({ key, value });
      }
    } catch (err) {
      console.warn("[MobileStorageAdapter] Failed to setItem:", err);
      localStorage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      localStorage.removeItem(key);

      const cap = (window as unknown as CapacitorWindow).Capacitor;
      if (cap?.Plugins?.Preferences?.remove) {
        await cap.Plugins.Preferences.remove({ key });
      }
    } catch (err) {
      console.warn("[MobileStorageAdapter] Failed to removeItem:", err);
      localStorage.removeItem(key);
    }
  }
}

export const mobileAuthStorage = new MobileStorageAdapter();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: mobileAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
