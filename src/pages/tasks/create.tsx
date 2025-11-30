import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, notification } from "antd";
import type { FormInstance } from "antd";
import { useCallback, useEffect } from "react";
import { useList, BaseRecord, usePermissions } from "@refinedev/core";
import { useNavigate } from "react-router";

// Role-based redirection moved inside the component

type TaskRecord = {
  id?: number;
  title?: string;
  body?: string;
  status?: string;
  meta?: { status?: string; priority?: string };
};

export const TaskCreate = () => {
  const { data: role } = usePermissions({});
  const navigate = useNavigate();
  useEffect(() => {
    if (role && role !== "admin") {
      navigate("/tasks");
    }
  }, [role, navigate]);
  const { formProps, saveButtonProps } = useForm<TaskRecord>();
  const { result } = useList({ resource: "tasks", pagination: { pageSize: 10000 } });

  const form = (formProps as unknown as { form?: FormInstance })?.form;

  // Intercept submit to normalize payload
  const handleFinish = useCallback(
    async (values: Partial<TaskRecord>) => {
      const meta = (values.meta ?? { status: values.status }) as TaskRecord["meta"];
      if (meta?.status === 'completed') {
        meta.priority = 'completed';
      }
      const updated: Partial<TaskRecord> = { ...values, meta };
      // Keep top-level status in sync for compatibility
      if (meta?.status) {
        updated.status = meta.status;
      }

      // Keep the body as plain description string in production
      if (values.body) {
        updated.body = values.body as string;
      }

      // In development: if the server doesn't generate numeric ids, assign a sequential numeric id locally.
      if (process.env.NODE_ENV !== "production") {
        if (updated.id === undefined || updated.id === null) {
          const items = (result?.data ?? []) as BaseRecord[];
          let max = 0;
          items.forEach((it: BaseRecord) => {
            const idVal = it?.id;
            if (typeof idVal === "number") {
              max = Math.max(max, idVal);
            } else if (typeof idVal === "string") {
              const numeric = Number(idVal);
              if (!Number.isNaN(numeric)) {
                max = Math.max(max, numeric);
              }
            }
          });
          updated.id = max + 1;
        }
      }

      const onFinish = (formProps as unknown as { onFinish?: (vals: Partial<TaskRecord>) => Promise<void> | void })?.onFinish;
      if (onFinish) {
        try {
          await onFinish(updated);
          notification.success({ message: "Task created" });
        } catch (err) {
          notification.error({ message: "Failed to create task" });
          throw err;
        }
      }
    },
    [formProps, result?.data],
  );

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}> 
          <Input />
        </Form.Item>

        <Form.Item name="body" label="Description">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item label="Status" name={["meta", "status"]} rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Todo", value: "todo" },
              { label: "In Progress", value: "in-progress" },
              { label: "Completed", value: "completed" },
            ]}
          />
        </Form.Item>

        {/* Show Priority unless status === 'completed' */}
        <Form.Item shouldUpdate={(prevValues, curValues) => {
          const prevStatus = (prevValues?.meta || {})?.status;
          const curStatus = (curValues?.meta || {})?.status;
          return prevStatus !== curStatus;
        }}>
          {({ getFieldValue, setFieldsValue }) => {
            const status = getFieldValue(["meta", "status"]);
            if (status === "completed") {
              // Clear priority when status is completed, only if it was set
              const currentPriority = getFieldValue(["meta", "priority"]);
              if (currentPriority !== undefined && currentPriority !== null) {
                setFieldsValue({ meta: { ...(form?.getFieldValue(["meta"]) ?? {}), priority: undefined } });
              }
              return null;
            }
            return (
                <Form.Item label="Priority" name={["meta", "priority"]} rules={[{ required: true }]}>                
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
    </Create>
  );
};

export default TaskCreate;
