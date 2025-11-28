import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";

export const TaskShow = () => {
    const { query } = useShow();
    const record = query?.data?.data;

    if (query?.isLoading) return <div>Loading...</div>;

    const meta = record?.meta || {};

    return (
        <Show>
            <p><b>Title:</b> {record?.title}</p>
            <p><b>Description:</b> {record?.body}</p>
            <p><b>Status:</b> {meta.status}</p>
            <p><b>Priority:</b> {meta.priority}</p>
        </Show>
    );
};
