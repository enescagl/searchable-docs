<script setup lang="ts">
import type { Repository } from "~/shared/types";
import { debouncedRef, useEventSource } from "@vueuse/core";
import { cn } from "~/lib/utils";
import { useRouteQuery } from "@vueuse/router";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  FlexRender,
} from "@tanstack/vue-table";
import { Button, Icon, NuxtLink } from "#components";
import { onUnmounted } from "vue";

const searchParam = useRouteQuery<string>("s");

const repoUrl = shallowRef("");
const debouncedSearch = debouncedRef<string>(searchParam, 250, {
  maxWait: 1000,
});

const {
  data: searchResult,
  status: searchStatus,
  refresh,
} = await useFetch<Repository[]>(`/api/search`, {
  key: debouncedSearch.value,
  query: {
    s: debouncedSearch,
  },
});

const addRepository = async () => {
  await $fetch(`/api/repo/add`, {
    method: "POST",
    body: { url: repoUrl.value },
    onResponse: () => {
      refresh();
      searchParam.value = "";
    },
  });
};

const startQueue = async (owner: string, repo: string) => {
  await $fetch(`/api/queue/start`, {
    method: "POST",
    body: { owner, repo },
  });
};

const { data: ollamaStatus, close } = useEventSource(`/api/embedding/status`);

const ollamaStatusData = computed(() => {
  try {
    return ollamaStatus.value
      ? JSON.parse(ollamaStatus.value)?.data.isReady
      : false;
  } catch (error) {
    console.error("Error parsing Ollama status:", error);
    return false;
  }
});

watch(ollamaStatusData, (newVal) => {
  if (newVal) {
    close();
  }
});

// Ensure the event source is closed when the component is unmounted
onUnmounted(() => {
  close();
});

const columnHelper = createColumnHelper<Repository>();

const columns = [
  columnHelper.display({
    id: "name",
    header: "Name",
    size: 85,
    cell: (props) => {
      return h(
        NuxtLink,
        {
          to: `/repo/${encodeURIComponent(props.row.original.owner)}/${encodeURIComponent(props.row.original.repo)}`,
          class: "flex items-center gap-2",
        },
        () => [h("span", props.row.original.owner)],
      );
    },
  }),
  columnHelper.display({
    id: "repoName",
    header: "Repo Name",
    size: 200,
    cell: (props) => `${props.row.original.owner}/${props.row.original.repo}`,
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated At",
    cell: (props) => props.row.original.updatedAt,
  }),
  columnHelper.accessor("isProcessed", {
    header: "Processed",
    size: 50,
    cell: (props) =>
      h(
        "div",
        {
          class: "flex items-center justify-center gap-2",
        },
        [
          h(Icon, {
            name: props.row.original.isProcessed
              ? "heroicons:check-circle"
              : "heroicons:x-circle",
            class: cn(
              "size-10",
              props.row.original.isProcessed
                ? "text-green-500"
                : "text-red-500",
            ),
          }),
        ],
      ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 50,
    cell: (props) =>
      h(
        "div",
        {
          class: "flex items-center justify-center gap-2",
        },
        [
          h(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => {
                startQueue(props.row.original.owner, props.row.original.repo);
              },
            },
            "Process",
          ),
        ],
      ),
  }),
];

const data = computed(() => {
  return searchStatus.value === "success" && searchResult.value !== null
    ? searchResult.value
    : [];
});

const table = useVueTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  manualPagination: true,
});
</script>

<template>
  <div>
    <div v-if="!ollamaStatusData">
      <div>
        <Icon name="heroicons:check-circle" class="size-4 text-green-500" />
        <span>Ollama is pulling the model</span>
      </div>
    </div>
    <div v-else class="flex h-full flex-col justify-end gap-4">
      <div class="flex gap-2">
        <Input v-model="repoUrl" placeholder="Repo URL" />
        <Button @click="addRepository">Add Repository</Button>
      </div>
      <Input v-model="searchParam" placeholder="Search" />
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :data-pinned="header.column.getIsPinned()"
              :class="
                cn(
                  { 'bg-background/95 sticky': header.column.getIsPinned() },
                  header.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
                )
              "
              :style="`width: ${header.column.getSize()}px`"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :data-pinned="cell.column.getIsPinned()"
                  :class="
                    cn(
                      { 'bg-background/95 sticky': cell.column.getIsPinned() },
                      cell.column.getIsPinned() === 'left'
                        ? 'left-0'
                        : 'right-0',
                    )
                  "
                  :style="`width: ${cell.column.getSize()}px`"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
              <TableRow v-if="row.getIsExpanded()">
                <TableCell :colspan="row.getAllCells().length">
                  {{ JSON.stringify(row.original) }}
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
