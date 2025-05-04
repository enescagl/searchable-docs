<script setup lang="ts">
import { debouncedRef } from "@vueuse/core";
import { useRouteParams, useRouteQuery } from "@vueuse/router";
import type { EmbeddingResponse } from "~/server/services/embedding";
import { MDC } from "#components";

interface JobState {
  id: string;
  state: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface QueueStats {
  active?: number;
  waiting?: number;
  completed?: number;
  failed?: number;
  [key: string]: number | undefined;
}

interface QueueData {
  counts: QueueStats;
  activeJobs: JobState[];
  completedJobs: JobState[];
  failedJobs: JobState[];
}

interface RepoStatusResponse {
  repository: {
    id: number;
    owner: string;
    repo: string;
    isProcessed: boolean;
    processedAt?: string;
  };
  queueStatus: {
    repositoryQueue: QueueData;
    documentQueue: QueueData;
  };
  timestamp: string;
}

const owner = useRouteParams("owner");
const repo = useRouteParams("repo");

const search = useRouteQuery<string>("s");
const debouncedSearch = debouncedRef<string>(search, 250, {
  maxWait: 1000,
});

// Refresh interval in milliseconds (5 seconds)
const REFRESH_INTERVAL = 5000;
const shouldRefresh = ref(true);

// Fetch repository status
const { data: repoStatus, refresh: refreshStatus } =
  await useFetch<RepoStatusResponse>(
    `/api/${owner.value}/${repo.value}/status`,
    { key: "repo-status" },
  );

// Helper to determine if processing is complete
const isProcessingComplete = computed(() => {
  return repoStatus.value?.repository?.isProcessed === true;
});

// Set up polling for status updates when not processed
const pollTimer = ref<NodeJS.Timeout | null>(null);

function startPolling() {
  if (pollTimer.value) return;

  pollTimer.value = setInterval(async () => {
    if (!shouldRefresh.value) return;

    await refreshStatus();

    // If processing is complete, stop polling
    if (isProcessingComplete.value) {
      stopPolling();
    }
  }, REFRESH_INTERVAL);
}

function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
}

// Start/stop polling based on processing status
watchEffect(() => {
  if (repoStatus.value && !isProcessingComplete.value) {
    startPolling();
  } else if (isProcessingComplete.value) {
    stopPolling();
  }
});

// Clean up timer when component is unmounted
onBeforeUnmount(() => {
  stopPolling();
});

// Only fetch search results when repository is processed
const {
  data: searchResults,
  status: searchRequestStatus,
  refresh: refreshSearch,
} = await useFetch<EmbeddingResponse[]>(
  `/api/${owner.value}/${repo.value}/search`,
  {
    immediate: false,
    query: {
      s: debouncedSearch,
    },
    watch: [isProcessingComplete],
    lazy: !isProcessingComplete.value,
  },
);

// Trigger search when processing completes
watch(isProcessingComplete, (newValue) => {
  if (newValue && debouncedSearch.value) {
    refreshSearch();
  }
});

// Format the timestamp for better readability
const formatTimestamp = (timestamp: string | undefined) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString();
};

// Handle manual refresh button click
const handleRefreshClick = () => {
  refreshStatus();
};
</script>

<template>
  <div>
    <h1>
      <span v-if="isProcessingComplete">Search</span>
      <span v-else>Processing</span>
      <span class="text-muted-foreground font-mono"
        >{{ owner }}/{{ repo }}</span
      >
    </h1>

    <!-- Repository is processed - show search interface -->
    <div v-if="isProcessingComplete">
      <div>
        <Input v-model="search" placeholder="Search" />
      </div>
      <div>
        <div v-if="searchRequestStatus === 'pending'">Loading...</div>
        <div v-else-if="searchRequestStatus === 'error'">Error</div>
        <div v-else-if="!search">Type a search query to begin...</div>
        <div v-else-if="searchResults && searchResults.length === 0">
          No results found
        </div>
        <div v-else>
          <div
            v-for="item in searchResults || []"
            :key="item.id"
            class="prose dark:prose-invert"
          >
            <MDC :value="item.heading" tag="h2" />
            <MDC :value="item.text" tag="code" />
          </div>
        </div>
      </div>
    </div>

    <!-- Repository is still being processed - show queue status -->
    <div v-else class="space-y-6">
      <div class="bg-muted/30 rounded-md border p-4">
        <h2 class="mb-2 text-lg font-semibold">Repository Status</h2>
        <div class="space-y-1 text-sm">
          <p>
            Processing:
            <span class="font-mono">{{
              repoStatus?.repository?.isProcessed ? "Complete" : "In Progress"
            }}</span>
          </p>
          <p v-if="repoStatus?.repository?.processedAt">
            Processed at:
            <span class="font-mono">{{
              formatTimestamp(repoStatus.repository.processedAt)
            }}</span>
          </p>
          <p>
            Last updated:
            <span class="font-mono">{{
              formatTimestamp(repoStatus?.timestamp)
            }}</span>
          </p>
        </div>
      </div>

      <div
        v-if="repoStatus?.queueStatus?.repositoryQueue"
        class="bg-muted/30 rounded-md border p-4"
      >
        <h2 class="mb-2 text-lg font-semibold">Repository Queue</h2>
        <div class="mb-4 grid grid-cols-2 gap-4">
          <div
            v-for="(count, status) in repoStatus.queueStatus.repositoryQueue
              .counts"
            :key="status"
            class="text-sm"
          >
            <span class="font-semibold">{{ status }}:</span> {{ count }}
          </div>
        </div>

        <div
          v-if="repoStatus.queueStatus.repositoryQueue.activeJobs?.length"
          class="mb-2"
        >
          <h3 class="text-md font-semibold">Active Jobs</h3>
          <div
            v-for="job in repoStatus.queueStatus.repositoryQueue.activeJobs"
            :key="job.id"
            class="mb-1 rounded border p-2 text-sm"
          >
            <div>
              ID: <span class="font-mono">{{ job.id }}</span>
            </div>
            <div>
              Status: <span class="font-mono">{{ job.state }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="repoStatus?.queueStatus?.documentQueue"
        class="bg-muted/30 rounded-md border p-4"
      >
        <h2 class="mb-2 text-lg font-semibold">Document Queue</h2>
        <div class="mb-4 grid grid-cols-2 gap-4">
          <div
            v-for="(count, status) in repoStatus.queueStatus.documentQueue
              .counts"
            :key="status"
            class="text-sm"
          >
            <span class="font-semibold">{{ status }}:</span> {{ count }}
          </div>
        </div>

        <div
          v-if="repoStatus.queueStatus.documentQueue.activeJobs?.length"
          class="mb-2"
        >
          <h3 class="text-md font-semibold">Active Jobs</h3>
          <div
            v-for="job in repoStatus.queueStatus.documentQueue.activeJobs"
            :key="job.id"
            class="mb-1 rounded border p-2 text-sm"
          >
            <div>
              ID: <span class="font-mono">{{ job.id }}</span>
            </div>
            <div>
              Status: <span class="font-mono">{{ job.state }}</span>
            </div>
            <div>
              File: <span class="font-mono">{{ job.data.filePath }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-sm">Auto-refresh:</span>
        <label class="cursor-pointer">
          <input v-model="shouldRefresh" type="checkbox" class="mr-1" />
          {{ shouldRefresh ? "On" : "Off" }}
        </label>
        <button
          class="bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm"
          @click="handleRefreshClick"
        >
          Refresh Now
        </button>
      </div>
    </div>
  </div>
</template>
