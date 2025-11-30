// import type { AuthBindings } from "@refinedev/core";

import { AuthProvider } from "@refinedev/core";

export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        const res = await fetch(`http://localhost:3001/users?email=${email}`);
        const users = await res.json();

        if (users.length === 0) {
            return {
                success: false,
                error: { message: "User not found", name: "Invalid Credentials" },
            };
        }

        const user = users[0];

        if (user.password !== password) {
            return {
                success: false,
                error: { message: "Incorrect password", name: "Invalid Credentials" },
            };
        }

        localStorage.setItem("auth", JSON.stringify(user));

        return {
            success: true,
            redirectTo: "/",
        };
    },

    logout: async () => {
        localStorage.removeItem("auth");
        return {
            success: true,
            redirectTo: "/login",
        };
    },

    check: async () => {
        const auth = localStorage.getItem("auth");
        if (auth) {
            return { authenticated: true };
        }
        return {
            authenticated: false,
            redirectTo: "/login",
        };
    },

    getIdentity: async () => {
        const auth = localStorage.getItem("auth");
        if (!auth) return null;
        return JSON.parse(auth);
    },

    getPermissions: async () => {
        const auth = localStorage.getItem("auth");
        if (!auth) return null;
        const user = JSON.parse(auth);
        return user.role; // admin or member
    },
    onError: async (error) => {
        // Basic error handler for Auth provider
        console.error("Auth error:", error);
        // On error, do not force logout by default
        return { logout: false };
    },
};
