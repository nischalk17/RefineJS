import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, notification } from "antd";
import type { FormInstance } from "antd";
import { useEffect } from "react";

type TaskRecord = {
  id?: number;
  title?: string;
  body?: string;
  status?: string;
  meta?: {
    status?: string;
    priority?: string;
  };
};

const parseBodyJson = (body?: string) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

export const TaskEdit = () => {
  const { formProps, saveButtonProps, query } = useForm<TaskRecord>();
  const form = (formProps as unknown as { form?: FormInstance })?.form;

  const record = query?.data?.data as TaskRecord | undefined;

  // Map initial data between different shapes (body JSON vs meta at root)
  useEffect(() => {
    if (!record) return;

    const bodyJson = parseBodyJson(record.body);
    // Build defaults
    const initialValues: Partial<TaskRecord> = {
      title: record.title,
      body: typeof bodyJson === "object" && bodyJson !== null ? bodyJson.description ?? "" : record.body,
      status: record.status,
      meta: {
        status: record.meta?.status ?? (bodyJson?.meta?.status ?? undefined),
        priority: record.meta?.priority ?? (bodyJson?.meta?.priority ?? undefined),
      },
    };

    // Set form values using formProps.form (Ant Design Form instance)
    if (form && form.setFieldsValue) {
      form.setFieldsValue(initialValues);
    }
  }, [record, formProps, form]);

  // We intercept the submit so we can normalize values — persist both `meta` and `body` JSON if needed.
  const handleFinish = async (values: Partial<TaskRecord>) => {
    const meta = (values?.meta ?? { status: values.status }) as TaskRecord["meta"];
    if (meta?.status === 'completed') {
      meta.priority = 'completed';
    }

    const updated: Partial<TaskRecord> = { ...values };

    // Ensure top-level meta object is updated
    updated.meta = meta;
    // Keep top-level status in sync
    if (meta?.status) {
      updated.status = meta.status;
    }

    // For production, prefer top-level meta and keep body as plain description string
    if (values.body) {
      updated.body = values.body as string;
    }

    // Include id in payload so servers that expect it get updated value
    if (record?.id !== undefined) {
      updated.id = record.id;
    }

    // Call original onFinish handler provided by useForm
    const onFinish = (formProps as unknown as { onFinish?: (vals: Partial<TaskRecord>) => Promise<void> | void })?.onFinish;
    if (onFinish) {
      try {
        await onFinish(updated);
        notification.success({ message: "Task updated" });
      } catch (err) {
        notification.error({ message: "Failed to update task" });
        throw err;
      }
    }
  };

  return (
    <Edit saveButtonProps={saveButtonProps} title="Edit Task">
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item label="Title" name="title" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="body">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Status" name={["meta", "status"]}>
          <Select
            options={[
              { label: "Todo", value: "todo" },
              { label: "In Progress", value: "in-progress" },
              { label: "Completed", value: "completed" },
            ]}
          />
        </Form.Item>

        {/* Show Priority unless status === 'completed' */}
        <Form.Item shouldUpdate={(prev, cur) => (prev?.meta?.status !== cur?.meta?.status)}>
          {({ getFieldValue, setFieldsValue }) => {
            const status = getFieldValue(["meta", "status"]);
            if (status === 'completed') {
              const currPriority = getFieldValue(["meta", "priority"]);
              if (currPriority !== undefined && currPriority !== null) {
                setFieldsValue({ meta: { ...(form?.getFieldValue(["meta"]) ?? {}), priority: undefined } });
              }
              return null;
            }
            return (
              <Form.Item label="Priority" name={["meta", "priority"]}>
                <Select
                  options={[
                    { label: "High", value: "high" },
                    { label: "Medium", value: "medium" },
                    { label: "Low", value: "low" },
                  ]}
                />
              </Form.Item>
            );
          }}
        </Form.Item>
      </Form>
    </Edit>
  );
};

export default TaskEdit;
