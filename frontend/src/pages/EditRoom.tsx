import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sun, Moon } from "lucide-react"; // Import Sun and Moon icons

// Assuming you have these types or similar defined elsewhere
interface Room {
  _id: string;
  title: string;
  description: string;
  location: string;
  rent: number | string; // Allow string for initial form state
  deposit: number | string; // Allow string for initial form state
  roomType: string;
  amenities: {
    wifi: boolean;
    ac: boolean;
    parking: boolean;
    furnished: boolean;
    washingMachine: boolean;
  };
  images: string[];
}

export function EditRoom() {
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Room>({
    title: "",
    description: "",
    rent: "",
    deposit: "",
    location: "",
    roomType: "",
    amenities: {
      wifi: false,
      ac: false,
      parking: false,
      furnished: false,
      washingMachine: false,
    },
    images: [],
    _id: "", // Add _id to formData state
  });

  const [theme, setTheme] = useState<string>(
    localStorage.getItem("theme") || "light"
  );

  // Effect to sync theme with localStorage and apply class to document element
  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem("theme") || "light");
    };
    window.addEventListener("storage", handleStorageChange);

    // Apply theme class on mount
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [theme]); // Dependency on theme ensures the effect reruns if theme state changes

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const {
    data: room,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const res = await fetch(
        `https://homies-oqpt.onrender.com/api/room/${roomId}`
      );
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch room");
      return data.data;
    },
  });

  useEffect(() => {
    if (room) {
      setFormData({
        ...room, // Spread existing room data including _id
        rent: String(room.rent), // Ensure rent and deposit are strings for input value
        deposit: String(room.deposit),
        amenities: room.amenities || {
          // Ensure amenities is an object
          wifi: false,
          ac: false,
          parking: false,
          furnished: false,
          washingMachine: false,
        },
        images: room.images || [], // Ensure images is an array
      });
    }
  }, [room]);

  function getPublicIdFromUrl(url: string): string {
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    return `${folder}/${fileWithExt.split(".")[0]}`;
  }

  async function handleImageUpload(files: File[]) {
    try {
      const res = await fetch(
        "https://homies-oqpt.onrender.com/api/cloud/get-signature",
        {
          method: "POST",
        }
      );
      const { signature, timestamp, cloudName, apiKey } = await res.json();

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", "mine");

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await uploadRes.json();
        uploadedUrls.push(uploadData.secure_url);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error uploading images.");
    }
  }

  async function handleDeleteImage(imgUrl: string) {
    try {
      const publicId = getPublicIdFromUrl(imgUrl);
      const res = await fetch(
        "https://homies-oqpt.onrender.com/api/cloud/image",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        }
      );
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to delete image");

      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== imgUrl),
      }));
    } catch (error: any) {
      alert("Error deleting image: " + error.message);
    }
  }

  const updateMutation = useMutation({
    mutationFn: async (updatedRoom: Room) => {
      const res = await fetch(
        `https://homies-oqpt.onrender.com/api/room/${roomId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedRoom),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Update failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRooms"] });
      navigate({ to: "/my-rooms" });
    },
    onError: (error: any) => {
      alert("Update failed: " + error.message);
    },
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleAmenityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [name]: checked },
    }));
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-600 dark:text-gray-300">
        Loading room...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold text-red-600 dark:text-red-400">
        Error loading room: {error.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-4 md:py-6 md:px-8 lg:px-12 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto">
        {/* Header with Back Navigation and Theme Toggle */}
        <div className="flex justify-between items-center mb-4">
          {" "}
          {/* Reduced margin */}
          <button
            onClick={() => navigate({ to: "/my-rooms" })}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition dark:text-gray-400 dark:hover:text-blue-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Rooms
          </button>
          {/* Theme Toggle Icon */}
          <button
            onClick={toggleTheme}
            className="p-1 rounded-full text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={
              theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
            }
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Edit Room
        </h1>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 space-y-4">
            {/* Basic fields */}
            {[
              "title",
              "description",
              "location",
              "rent",
              "deposit",
              "roomType",
            ].map((field) =>
              typeof formData[field as keyof Room] === "string" ||
              typeof formData[field as keyof Room] === "number" ? (
                <div key={field}>
                  <Label
                    htmlFor={field}
                    className="text-gray-700 dark:text-gray-300 text-sm"
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Label>
                  <Input
                    id={field}
                    name={field}
                    value={formData[field as keyof Room] as string | number}
                    onChange={handleChange}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm h-8"
                  />
                </div>
              ) : null
            )}

            {/* Amenities checkboxes */}
            <div>
              <Label className="block mb-1 text-gray-700 dark:text-gray-300 text-sm">
                Amenities
              </Label>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(formData.amenities).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-1 capitalize text-gray-700 dark:text-gray-300 text-sm"
                  >
                    <input
                      type="checkbox"
                      name={key}
                      checked={value}
                      onChange={handleAmenityChange}
                      className="form-checkbox h-3 w-3 text-blue-600 transition duration-150 ease-in-out dark:text-blue-400"
                    />
                    {key}
                  </label>
                ))}
              </div>
            </div>

            {/* Upload new images */}
            <div className="mt-2">
              <Label className="block mb-1 text-gray-700 dark:text-gray-300 text-sm">
                Upload New Images
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload([...e.target.files!])} // Use non-null assertion
                className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 file:dark:text-gray-200 text-sm h-8"
              />
            </div>

            {/* Preview images */}
            {formData.images?.length > 0 && (
              <div>
                <Label className="block mb-1 text-gray-700 dark:text-gray-300 text-sm">
                  Room Images
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Room image ${idx + 1}`}
                        className="h-16 w-full object-cover rounded"
                      />
                      <button
                        onClick={() => handleDeleteImage(img)}
                        title="Delete image"
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity dark:bg-red-700"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button
              onClick={() => updateMutation.mutate(formData)}
              disabled={updateMutation.isPending || isLoading} // Disable if loading room or updating
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white disabled:bg-gray-400 dark:disabled:bg-gray-600 text-sm h-8"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            {updateMutation.isError && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                Error saving changes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 🔗 Route Definition
export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/edit-room/$roomId",
    getParentRoute: () => parentRoute,
    component: EditRoom,
    beforeLoad: (ctx: {
      context: { auth?: { isAuthenticated: () => boolean } };
      location: { href: string };
    }) => {
      // Assuming auth is managed by context and redirects unauthenticated users
      if (!ctx.context.auth?.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: ctx.location.href } });
      }
    },
  });
