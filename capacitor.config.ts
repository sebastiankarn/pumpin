import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sebastiankarn.pumpin",
  appName: "Pumpin",
  webDir: "dist",
  server: {
    // Remove this block before submitting to App Store.
    // It lets you test against your live Netlify/Supabase backend during development.
    allowNavigation: ["*.supabase.co"],
  },
};

export default config;
