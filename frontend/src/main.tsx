import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import "leaflet/dist/leaflet.css";

import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

import App from "./App.tsx";

import DashboardRoute from "./pages/Dashboard.tsx";
import PostRoomRoute from "./pages/PostRoom.tsx";
import SearchRoomRoute from "./pages/SearchRoom.tsx";
import RoomRoute from "./pages/Room.tsx";
import MyRoomsRoute from "./pages/MyRooms.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditRoomRoute from "./pages/EditRoom.tsx";
import ChatWithSidebarRoute from "./pages/ChatWithSidebar.tsx";
import ProfileRoute from "./pages/Profile.tsx";
const queryClient = new QueryClient();
const rootRoute = createRootRoute({
  component: () => (
    <>
      <QueryClientProvider client={queryClient}>
        {/* <Header /> */}
        <Outlet />
        {/* <TanStackRouterDevtools /> */}
        {/* <TanstackQueryLayout /> */}
      </QueryClientProvider>
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  DashboardRoute(rootRoute),
  PostRoomRoute(rootRoute),
  SearchRoomRoute(rootRoute),
  MyRoomsRoute(rootRoute),
  RoomRoute(rootRoute),
  EditRoomRoute(rootRoute),
  ChatWithSidebarRoute(rootRoute),
  ProfileRoute(rootRoute),
]);

const router = createRouter({
  routeTree,
  context: {
    ...TanstackQuery.getContext(),
    auth: {
      isAuthenticated: () => {
        return Boolean(localStorage.getItem("token"));
      },
    },
  },
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TanstackQuery.Provider>
        <RouterProvider router={router} />
      </TanstackQuery.Provider>
    </StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
