// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "shadcn-nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/mdc",
    "nuxt-auth-utils",
  ],
  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  colorMode: {
    classSuffix: "",
    preference: "dark",
    fallback: "dark",
  },
  runtimeConfig: {
    githubToken: process.env.NUXT_API_GITHUB_TOKEN,
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: "./components/ui",
  },
  mdc: {
    remarkPlugins: {
      "remark-gfm": {},
    },
  },
  nitro: {
    node: true,
    storage: {
      filesystem: {
        driver: "fs",
        base: "./data",
      },
    },
  },
});
