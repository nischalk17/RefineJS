import { List, useTable } from "@refinedev/antd";
import { Table } from "antd";

export const TaskList = () => {
  const { tableProps } = useTable();

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="title" title="Task Title" />
        <Table.Column dataIndex="status" title="Status" />
      </Table>
    </List>
  );
};
