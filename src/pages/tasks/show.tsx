import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";

export const TaskShow = () => {
  const { query } = useShow();
  const record = query?.data?.data;

  if (query.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Show>
      <p><b>Title:</b> {record?.title}</p>
      <p><b>Description:</b> {record?.description}</p>
    </Show>
  );
};
