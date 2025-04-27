<script setup lang="ts">
import type { Repository } from "~/shared/types";
import { debouncedRef } from "@vueuse/core";
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
import { Icon, NuxtLink } from "#components";

const searchParam = useRouteQuery<string>("s");

const repoUrl = shallowRef("");
const debouncedSearch = debouncedRef<string>(searchParam, 250, {
  maxWait: 1000,
});

const {
  data,
  status: searchStatus,
  refresh,
} = await useFetch<Repository[]>(`/api/search`, {
  key: debouncedSearch.value,
  query: {
    s: debouncedSearch,
  },
});

const { execute: addRepository, status: addRepositoryStatus } = await useFetch<
  Repository[]
>(`/api/repo/add`, {
  method: "POST",
  immediate: false,
  lazy: true,
  body: { url: repoUrl.value },
  onResponse: () => refresh(),
});

const columnHelper = createColumnHelper<Repository>();

const columns = [
  columnHelper.display({
    id: "name",
    header: "Name",
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
    cell: (props) => `${props.row.original.owner}/${props.row.original.repo}`,
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated At",
    cell: (props) => props.row.original.updatedAt,
  }),
  columnHelper.accessor("isProcessed", {
    header: "Processed",
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
];
const table = useVueTable({
  data:
    searchStatus.value === "success" && data.value !== null ? data.value : [],
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  manualPagination: true,
});
</script>

<template>
  <div class="flex h-full flex-col justify-end gap-4">
    <div class="flex gap-2">
      <Input v-model="repoUrl" placeholder="Repo URL" />
      <Button
        :disabled="addRepositoryStatus === 'pending'"
        @click="addRepository"
      >
        {{ addRepositoryStatus === "pending" ? "Adding..." : "Add Repository" }}
      </Button>
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
                    cell.column.getIsPinned() === 'left' ? 'left-0' : 'right-0',
                  )
                "
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
</template>
