import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createRoute, redirect, type RootRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function EditRoom() {
  const { roomId } = useParams({ strict: false }) as { roomId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
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
  });

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:5000/api/room/${roomId}`);
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch room");
      return data.data; // ✅ correct access
    },
  });

  // ⬇️ Set form data once room is fetched
  useEffect(() => {
    if (room) {
      setFormData({
        title: room.title,
        description: room.description,
        rent: room.rent,
        deposit: room.deposit,
        location: room.location,
        roomType: room.roomType,
        amenities: room.amenities || {},
        images: room.images,
      });
    }
  }, [room]);

  function getPublicIdFromUrl(url) {
    // Cloudinary URL example:
    // https://res.cloudinary.com/demo/image/upload/v1620000000/folder_name/image_name.jpg
    // We want 'folder_name/image_name' part without extension
    // Simplified version:
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1]; // e.g. image_name.jpg
    const folder = parts[parts.length - 2]; // e.g. folder_name
    const publicId = `${folder}/${fileWithExt.split(".")[0]}`;
    return publicId;
  }

  async function handleDeleteImage(imgUrl) {
    try {
      const publicId = getPublicIdFromUrl(imgUrl);
      const res = await fetch("http://localhost:5000/api/cloud/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || "Failed to delete image");

      // Remove image from formData.images
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== imgUrl),
      }));
    } catch (error) {
      alert("Error deleting image: " + error.message);
    }
  }

  const updateMutation = useMutation({
    mutationFn: async (updatedRoom) => {
      const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRoom),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Update failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRooms"] });
      navigate({ to: "/my-rooms" });
    },
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleAmenityChange(e) {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [name]: checked },
    }));
  }

  return (
    <div className="min-h-screen py-10 px-6 md:px-12 lg:px-24 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Room</h1>

        {isLoading ? (
          <p>Loading room...</p>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Basic fields */}
              {[
                "title",
                "description",
                "location",
                "rent",
                "deposit",
                "roomType",
              ].map((field) => (
                <div key={field}>
                  <Label htmlFor={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </Label>
                  <Input
                    id={field}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                  />
                </div>
              ))}

              {/* Amenities checkboxes */}
              <div>
                <Label className="block mb-2">Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formData.amenities).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 capitalize"
                    >
                      <input
                        type="checkbox"
                        name={key}
                        checked={value}
                        onChange={handleAmenityChange}
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview images */}
              {formData.images?.length > 0 && (
                <div>
                  <Label className="block mb-2">Room Images</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Room image ${idx + 1}`}
                          className="h-24 w-full object-cover rounded"
                        />
                        {/* Delete button overlay */}
                        <button
                          onClick={() => handleDeleteImage(img)}
                          title="Delete image"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}
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
    beforeLoad: () => {
      const isLoggedIn = !!localStorage.getItem("email");
      if (!isLoggedIn) {
        throw redirect({ to: "/login" });
      }
    },
  });
