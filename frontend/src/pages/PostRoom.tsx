import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";

export function PostRoom() {
  return <div>PostRoom</div>;
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/post-room",
    component: PostRoom,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
