import { createRoute, redirect, RootRoute } from "@tanstack/react-router";
import React from "react";

export function Dashboard() {
  return <div>dashboard</div>;
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/dashboard",
    component: Dashboard,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
