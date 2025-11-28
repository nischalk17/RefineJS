import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Input, Button, notification } from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigation, BaseRecord, useDelete } from "@refinedev/core";
import { useState } from "react";
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { tableProps } = useTable<TaskRecord>({
    syncWithLocation: true,
  });

  return (
    <List title="Tasks">
      <Table {...tableProps} rowKey="id">

        {/* ID Column (from minimal version) */}
            <Table.Column<TaskRecord>
              dataIndex="id"
              title="ID"
              sorter={(a, b) => Number(a.id ?? 0) - Number(b.id ?? 0)}
            />

        {/* TITLE */}
            <Table.Column<TaskRecord>
          dataIndex="title"
          title="Title"
          sorter={(a, b) => String(a.title ?? "").toLowerCase().localeCompare(String(b.title ?? "").toLowerCase())}
          filterDropdown={({ setSelectedKeys, selectedKeys, confirm }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Search title..."
                value={selectedKeys[0]}
                onChange={(e) =>
                  setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => confirm()}
                style={{ width: 200, marginBottom: 8, display: "block" }}
              />
              <Button type="primary" onClick={() => confirm()} size="small">
                Search
              </Button>
            </div>
          )}
          filterIcon={<SearchOutlined />}
        />

        {/* STATUS - take top-level status if present, else parse meta */}
            <Table.Column<TaskRecord>
          title="Status"
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
          sorter={(a, b) => priorityRank(getPriorityForSorting(a)) - priorityRank(getPriorityForSorting(b))}
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

