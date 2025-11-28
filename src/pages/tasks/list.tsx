import { List, useTable } from "@refinedev/antd";
import { Table, Space, Tag, Input, Button } from "antd";
import {
    SearchOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useNavigation } from "@refinedev/core";

export const TaskList = () => {
    const { show, edit } = useNavigation();

    // useTable fetches from `posts` (because meta.apiResource is set)
    const { tableProps } = useTable({
        syncWithLocation: true,
        resource: "tasks",
    });

    return (
        <List title="Tasks">
            <Table {...tableProps} rowKey="id">
                {/* TITLE COLUMN */}
                <Table.Column
                    dataIndex="title"
                    title="Title"
                    sorter
                    filterDropdown={({ setSelectedKeys, selectedKeys, confirm }) => (
                        <div style={{ padding: 8 }}>
                            <Input
                                placeholder="Search title..."
                                value={selectedKeys[0]}
                                onChange={(e) =>
                                    setSelectedKeys(e.target.value ? [e.target.value] : [])
                                }
                                onPressEnter={() => confirm()}
                                style={{
                                    width: 200,
                                    marginBottom: 8,
                                    display: "block",
                                }}
                            />
                            <Button type="primary" onClick={() => confirm()} size="small">
                                Search
                            </Button>
                        </div>
                    )}
                    filterIcon={<SearchOutlined />}
                />

                {/* STATUS (fake generated since posts don't have this field) */}
                <Table.Column
                    title="Status"
                    render={() => {
                        const statuses = ["todo", "in-progress", "completed"];
                        const value = statuses[Math.floor(Math.random() * 3)];
                        const color =
                            value === "completed"
                                ? "green"
                                : value === "in-progress"
                                ? "blue"
                                : "orange";

                        return <Tag color={color}>{value.toUpperCase()}</Tag>;
                    }}
                />

                {/* PRIORITY (fake for now) */}
                <Table.Column
                    title="Priority"
                    render={() => {
                        const values = ["low", "medium", "high"];
                        const value = values[Math.floor(Math.random() * 3)];

                        const color =
                            value === "high"
                                ? "red"
                                : value === "medium"
                                ? "gold"
                                : "blue";

                        return <Tag color={color}>{value.toUpperCase()}</Tag>;
                    }}
                />

                {/* ACTIONS */}
                <Table.Column
                    title="Actions"
                    render={(record: any) => (
                        <Space>
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => show("tasks", record.id)}
                            />
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => edit("tasks", record.id)}
                            />
                            <Button danger icon={<DeleteOutlined />} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
