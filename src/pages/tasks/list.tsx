import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Input, Button, Select, notification, TablePaginationConfig } from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigation, BaseRecord, useDelete } from "@refinedev/core";
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { Popconfirm } from "antd";

type TaskRecord = BaseRecord & {
  id: number;
  title: string;
  body?: string; // may contain description + meta JSON
  status?: string; // optional top-level status (minimal version)
  meta?: { status?: string; priority?: string };
};

const parseMetaFromRecord = (record?: TaskRecord) => {
  if (!record) return {};
  if (record.meta) return record.meta;
  if (!record.body) return {};
  try {
    const json = JSON.parse(record.body);
    return json.meta || {};
  } catch {
    return {};
  }
};

const priorityRank = (value: string) => {
  switch (value) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
    case "completed":
      return 3; // completed should be last
    default:
      return 2; // default to low
  }
};

const getPriorityForSorting = (record?: TaskRecord) => {
  if (!record) return "low";
  const meta = parseMetaFromRecord(record);
  const status = record.status || meta.status;
  if (status === "completed") return "completed";
  return (meta.priority || "low") as string;
};

export const TaskList = () => {
  const { show, edit } = useNavigation();
  const { mutate: deleteMutate } = useDelete();
  const navigate = useNavigate();
  const location = useLocation();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<{ status: string[]; priority: string[]; title?: string }>({ status: [], priority: [], title: undefined });
  const titleDebounce = useRef<number | null>(null);
  const { tableProps } = useTable<TaskRecord>({
    syncWithLocation: true,
  });

  // Wrap tableProps.onChange to capture and sync filter state globally
  const wrappedTableProps = {
    ...tableProps,
    onChange: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => {
      const status = (filters?.status ?? []) as string[];
      const priority = (filters?.["meta.priority"] ?? []) as string[];
      const titleFilter = ((filters?.["title_like"] as string[]) ?? (filters?.title as string[]) ?? [])[0];
      setActiveFilters({ status, priority, title: titleFilter });
      const originalOnChange = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
      if (originalOnChange) {
        // convert 'title' to 'title_like' for server-side substring search
        let serverFilters = filters;
        if (filters?.title) {
          serverFilters = { ...filters, title_like: filters.title, title: [] };
        }
        originalOnChange(pagination, serverFilters, sorter);
      }
    },
  } as typeof tableProps;

  return (
    <List title="Tasks">
      {((activeFilters.status.length > 0) || (activeFilters.priority.length > 0) || !!activeFilters.title) && (
        <Space style={{ marginBottom: 8 }}>
          <span>Active filters:</span>
          {activeFilters.status.map((s) => (
            <Tag
              key={`status-${s}`}
              color="blue"
              closable
              onClose={() => {
                const newStatus = activeFilters.status.filter((x) => x !== s);
                setActiveFilters({ ...activeFilters, status: newStatus });
                const onChangeOriginal = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
                if (onChangeOriginal) {
                  onChangeOriginal(undefined, { status: newStatus, 'meta.priority': activeFilters.priority, title: activeFilters.title ? [activeFilters.title] : [] }, undefined);
                }
              }}
            >
              {`Status: ${s}`}
            </Tag>
          ))}
          {activeFilters.priority.map((p) => (
            <Tag
              key={`priority-${p}`}
              color="purple"
              closable
              onClose={() => {
                const newPriority = activeFilters.priority.filter((x) => x !== p);
                setActiveFilters({ ...activeFilters, priority: newPriority });
                const onChangeOriginal = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
                if (onChangeOriginal) {
                  onChangeOriginal(undefined, { 'meta.priority': newPriority, status: activeFilters.status, title: activeFilters.title ? [activeFilters.title] : [] }, undefined);
                }
              }}
            >
              {`Priority: ${p}`}
            </Tag>
          ))}
          {activeFilters.title && (
            <Tag
              closable
              onClose={() => {
                setActiveFilters({ ...activeFilters, title: undefined });
                const onChangeOriginal = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
                if (onChangeOriginal) {
                  onChangeOriginal(undefined, { status: activeFilters.status, 'meta.priority': activeFilters.priority, title: [] }, undefined);
                }
              }}
            >
              {`Title: ${activeFilters.title}`}
            </Tag>
          )}
          <Button disabled={activeFilters.status.length===0 && activeFilters.priority.length===0 && !activeFilters.title} onClick={() => {
            setActiveFilters({ status: [], priority: [], title: undefined });
            // Use router navigate to clear URL query params (useTable syncWithLocation will re-run the list filter)
            if (typeof navigate === "function") {
              navigate(location.pathname, { replace: true });
            }
            // Fallback: call table's onChange with pagination set to first page
            const pagination = (tableProps as unknown as { pagination?: TablePaginationConfig })?.pagination || {};
            const pageSize = (pagination as TablePaginationConfig)?.pageSize;
            const onChangeFn = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
            if (typeof onChangeFn === "function") {
              const paginationParam: TablePaginationConfig = { current: 1 };
              if (typeof pageSize === "number") {
                paginationParam.pageSize = pageSize;
              }
              // explicitly pass empty arrays for known filters (status, meta.priority, and title_like/title)
              onChangeFn(paginationParam, { status: [], 'meta.priority': [], title_like: [], title: [] }, undefined);
            }
          }}>Clear filters</Button>
        </Space>
      )}

      <Table {...wrappedTableProps} rowKey="id">

        {/* ID Column (from minimal version) */}
            <Table.Column<TaskRecord>
              dataIndex="id"
              title="ID"
              sorter={(a, b) => Number(a.id ?? 0) - Number(b.id ?? 0)}
            />

          <Table.Column<TaskRecord>
          dataIndex="title"
          title="Title"
          sorter={(a, b) => String(a.title ?? "").toLowerCase().localeCompare(String(b.title ?? "").toLowerCase())}
          filteredValue={activeFilters.title ? [activeFilters.title] : undefined}
          onFilter={(value, record) => {
            const v = String(value).toLowerCase();
            const titleVal = String(record.title ?? "").toLowerCase();
            return titleVal.includes(v);
          }}
          filterDropdown={({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Search title..."
                value={selectedKeys[0]}
                onChange={(e) => {
                  // Debounced set and confirm
                  setSelectedKeys(e.target.value ? [e.target.value] : []);
                  if (titleDebounce.current !== null) {
                    window.clearTimeout(titleDebounce.current);
                      }
                      titleDebounce.current = window.setTimeout(() => {
                        // Use tableProps.onChange directly with title_like filter for substring server-side match
                        const onChangeFn = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
                        if (typeof onChangeFn === "function") {
                          onChangeFn(undefined, { title_like: e.target.value ? [e.target.value] : [] }, undefined);
                          setActiveFilters((prev) => ({ ...prev, title: e.target.value ? e.target.value : undefined }));
                        }
                      }, 300);
                }}
                onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  confirm();
                  const value = (e.target as HTMLInputElement).value;
                  setActiveFilters((prev) => ({ ...prev, title: value ? value : undefined }));
                  const onChangeFn = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
                  if (typeof onChangeFn === "function") {
                    onChangeFn(undefined, { title_like: value ? [value] : [] }, undefined);
                  }
                }}
                style={{ width: 200, marginBottom: 8, display: "block" }}
              />
              <Button type="primary" onClick={() => {
                confirm();
                const titleVal = selectedKeys?.[0] ? String(selectedKeys?.[0]) : undefined;
                setActiveFilters({ ...activeFilters, title: titleVal });
                const onChangeFn = (tableProps as unknown as { onChange?: (pagination?: unknown, filters?: Record<string, (string | number)[]>, sorter?: unknown) => void })?.onChange;
                if (typeof onChangeFn === "function") {
                    onChangeFn(undefined, { title_like: titleVal ? [titleVal] : [] }, undefined);
                }
              }} size="small">
                Search
              </Button>
            </div>
          )}
          filterIcon={<SearchOutlined />}
        />

        {/* STATUS - take top-level status if present, else parse meta */}
            <Table.Column<TaskRecord>
          title="Status"
          dataIndex="status"
          filters={[
            { text: "Todo", value: "todo" },
            { text: "In Progress", value: "in-progress" },
            { text: "Completed", value: "completed" },
          ]}
          // filterDropdown to make UI consistent with Title filter
          filterDropdown={({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Select
                mode="multiple"
                placeholder="Filter by status"
                style={{ width: 200, marginBottom: 8, display: "block" }}
                value={selectedKeys as string[]}
                onChange={(values: string[]) =>{
                  setSelectedKeys(values && values.length ? values : []);
                  // auto-apply
                  confirm();
                }
                }
              >
                <Select.Option value="todo">Todo</Select.Option>
                <Select.Option value="in-progress">In Progress</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
              </Select>
              <Button type="primary" onClick={() => { confirm(); }} size="small">
                Apply
              </Button>
            </div>
          )}
          filterIcon={<SearchOutlined />}
          filteredValue={activeFilters.status.length ? activeFilters.status : undefined}
          onFilter={(value, record) => {
            const v = String(value);
            const meta = parseMetaFromRecord(record);
            const recStatus = record.status || meta.status || "";
            return recStatus === v;
          }}
          render={(_, record) => {
            const meta = parseMetaFromRecord(record);
            const value = record.status || meta.status || "todo";

            const color =
              value === "completed"
                ? "green"
                : value === "in-progress"
                ? "blue"
                : "orange";

            return <Tag color={color}>{value.toUpperCase()}</Tag>;
          }}
        />

        {/* PRIORITY */}
            <Table.Column<TaskRecord>
          title="Priority"
          dataIndex="meta.priority"
          filters={[
            { text: "High", value: "high" },
            { text: "Medium", value: "medium" },
            { text: "Low", value: "low" },
            { text: "Completed", value: "completed" },
          ]}
          filterDropdown={({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Select
                mode="multiple"
                placeholder="Filter by priority"
                style={{ width: 200, marginBottom: 8, display: "block" }}
                value={selectedKeys as string[]}
                onChange={(values: string[]) => { setSelectedKeys(values && values.length ? values : []); confirm(); }}
              >
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="low">Low</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
              </Select>
              <Button type="primary" onClick={() => confirm()} size="small">
                Apply
              </Button>
            </div>
          )}
          filterIcon={<SearchOutlined />}
          filteredValue={activeFilters.priority.length ? activeFilters.priority : undefined}
          sorter={(a, b) => priorityRank(getPriorityForSorting(a)) - priorityRank(getPriorityForSorting(b))}
          onFilter={(value, record) => {
            const v = String(value);
            const meta = parseMetaFromRecord(record);
            let priorityVal = meta.priority || "low";
            const status = record.status || meta.status;
            if (status === "completed") {
              priorityVal = "completed";
            }
            return priorityVal === v;
          }}
          render={(_, record) => {
            const meta = parseMetaFromRecord(record);
            let value = meta.priority || "low";
            const status = record.status || meta.status;
            if (status === "completed") {
              value = "completed";
            }

            const color =
              value === "high"
                ? "red"
                : value === "medium"
                ? "gold"
                : value === "completed"
                ? "green"
                : "blue";

            return <Tag color={color}>{value.toUpperCase()}</Tag>;
          }}
        />

        {/* ACTIONS */}
        <Table.Column<TaskRecord>
          title="Actions"
          render={(_, record) => {
            const onConfirmDelete = () => {
              setDeletingId(record.id);
              deleteMutate({ resource: "tasks", id: record.id, mutationMode: "pessimistic" }, {
                onSuccess: () => {
                  notification.success({ message: "Task deleted" });
                  setDeletingId(null);
                },
                onError: () => {
                  notification.error({ message: "Failed to delete task" });
                  setDeletingId(null);
                },
              });
            };

            return (
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => show("tasks", record.id)}
                />
                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit("tasks", record.id)}
                />
                <Popconfirm
                  title="Are you sure you want to delete this task?"
                  onConfirm={onConfirmDelete}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button danger icon={<DeleteOutlined />} loading={deletingId === record.id} />
                </Popconfirm>
              </Space>
            );
          }}
        />

      </Table>
    </List>
  );
};

