import {
    Refine,
} from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";

import {
    ErrorComponent,
    useNotificationProvider,
    ThemedLayout,
    ThemedSider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import dataProvider from "@refinedev/simple-rest";
import { App as AntdApp } from "antd";
import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, {
    NavigateToResource,
    UnsavedChangesNotifier,
    DocumentTitleHandler,
} from "@refinedev/react-router";

import { TaskList } from "./pages/tasks/list";
import { TaskCreate } from "./pages/tasks/create";
import { TaskEdit } from "./pages/tasks/edit";
import { TaskShow } from "./pages/tasks/show";

import { ColorModeContextProvider } from "./contexts/color-mode";
import { Header } from "./components/header";

function App() {
    return (
        <BrowserRouter>
            <ColorModeContextProvider>
                <AntdApp>
                    <DevtoolsProvider>
                        <Refine
                            dataProvider={dataProvider("https://api.fake-rest.refine.dev")}
                            notificationProvider={useNotificationProvider}
                            routerProvider={routerProvider}
                            resources={[
                                {
                                    name: "tasks",
                                    list: "/tasks",
                                    create: "/tasks/create",
                                    edit: "/tasks/edit/:id",
                                    show: "/tasks/show/:id",
                                    meta: { 
                                      apiResource: "posts" 
                                    },
                                },
                                 {
                                    name: "projects",
                                    list: "/projects",
                                    create: "/projects/create",
                                    edit: "/projects/edit/:id",
                                    show: "/projects/show/:id",
                                    meta: {
                                      apiResource: "categories",
                                    },
                                  },
                                  {
                                    name: "team",
                                    list: "/team",
                                    edit: "/team/edit/:id",
                                    show: "/team/show/:id",
                                    meta: {
                                      apiResource: "users",
                                    },
                                  },
                            ]}
                            options={{
                                syncWithLocation: true,
                                warnWhenUnsavedChanges: true,
                                projectId: "cqpuAU-wkSlBx-EyXy1i",
                            }}
                        >
                            <Routes>
                                <Route
                                    element={
                                        <ThemedLayout
                                            Header={() => <Header sticky />}
                                            Sider={(props) => <ThemedSider {...props} fixed />}
                                        >
                                            <Outlet />
                                        </ThemedLayout>
                                    }
                                >
                                    {/* Default route goes to tasks */}
                                    <Route
                                        index
                                        element={<NavigateToResource resource="tasks" />}
                                    />

                                    {/* TASK ROUTES */}
                                    <Route path="tasks">
                                        <Route index element={<TaskList />} />
                                        <Route path="create" element={<TaskCreate />} />
                                        <Route path="edit/:id" element={<TaskEdit />} />
                                        <Route path="show/:id" element={<TaskShow />} />
                                    </Route>

                                    <Route path="*" element={<ErrorComponent />} />
                                </Route>
                            </Routes>

                            <UnsavedChangesNotifier />
                            <DocumentTitleHandler />
                        </Refine>
                        <DevtoolsPanel />
                    </DevtoolsProvider>
                </AntdApp>
            </ColorModeContextProvider>
        </BrowserRouter>
    );
}

export default App;
