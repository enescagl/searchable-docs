<script setup lang="ts">
import { motion } from "motion-v";

const route = useRoute();
</script>

<template>
  <div class="min-h-screen">
    <header
      class="mx-auto flex max-w-sm items-center justify-between px-4 py-4 sm:max-w-lg md:max-w-2xl lg:max-w-4xl"
    >
      <NuxtLink to="/">
        <div>logo</div>
      </NuxtLink>
      <div>
        <Button variant="outline" as-child rounded="full" class="group">
          <NuxtLink :to="route.path === '/login' ? '/register' : '/login'">
            <Icon class="text-muted-foreground" name="heroicons:user-circle" />
            <motion.div
              class="[--animation-width: 0] overflow-hidden group-hover:w-[var(--animation-width)]"
              :initial="{ '--animation-width': 0 }"
              :animate="{ '--animation-width': 'auto' }"
              :exit="{ '--animation-width': 0 }"
              :transition="{ duration: 0.3 }"
            >
              {{ route.path === "/login" ? "Register" : "Login" }}
            </motion.div>
          </NuxtLink>
        </Button>
      </div>
    </header>
    <main
      class="mx-auto h-full max-w-sm px-4 sm:max-w-lg md:max-w-2xl lg:max-w-4xl"
    >
      <slot />
    </main>
  </div>
</template>
