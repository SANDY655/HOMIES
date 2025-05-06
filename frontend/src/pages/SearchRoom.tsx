import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";

export function SearchRoom() {
  return <div>SearchRoom</div>;
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/search-rooms",
    component: SearchRoom,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
