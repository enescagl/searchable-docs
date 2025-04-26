<script setup lang="ts">
import { debouncedRef } from "@vueuse/core";
import { useRouteParams, useRouteQuery } from "@vueuse/router";
import type { EmbeddingResponse } from "~/server/services/embedding";
import { MDC } from "#components";

const owner = useRouteParams("owner");
const repo = useRouteParams("repo");

const search = useRouteQuery<string>("s");
const debouncedSearch = debouncedRef<string>(search, 250, {
  maxWait: 1000,
});

const { data, status } = await useFetch<EmbeddingResponse[]>(
  `/api/${owner.value}/${repo.value}/search`,
  {
    query: {
      s: debouncedSearch,
    },
  },
);
</script>

<template>
  <div>
    <h1>
      Search
      <span class="text-muted-foreground font-mono"
        >{{ owner }}/{{ repo }}</span
      >
    </h1>
    <div>
      <Input v-model="search" placeholder="Search" />
    </div>
    <div>
      <div v-if="status === 'pending'">Loading...</div>
      <div v-else-if="status === 'error'">Error</div>
      <div v-else>
        <div
          v-for="item in data"
          :key="item.id"
          class="prose dark:prose-invert"
        >
          <MDC :value="item.heading" tag="h2" />
          <MDC :value="item.text" tag="code" />
        </div>
      </div>
    </div>
  </div>
</template>
