import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";

export function FindingRoommates() {
  return <div>find Roommates</div>;
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/find-roommates",
    component: FindingRoommates,
    getParentRoute: () => parentRoute,
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
