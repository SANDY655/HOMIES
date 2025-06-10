import { useCallback, useState, useEffect } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  TextField,
  Avatar,
  Paper,
  FormControlLabel,
  Checkbox,
  Typography,
  MenuItem,
  Stack,
} from "@mui/material";
import { z } from "zod";
import { ArrowBack, CheckCircleOutline } from "@mui/icons-material";

import {
  createRoute,
  redirect,
  useNavigate,
  type RootRoute,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import axios from "axios";
import { Autocomplete } from "@mui/material";
import debounce from "lodash/debounce";
import { Moon, Sun } from "lucide-react";

// Define the steps
const steps = ["Room Details", "Photos", "Amenities", "Review & Confirm"];
const LOCATIONIQ_API_KEY = "pk.156347b797adf47f459dbb3d2c9ffabd"; // put your key here

// Define Zod schemas for validation
const stepSchemas = [
  z.object({
    title: z.string().min(3, "Title is too short"),
    description: z.string().min(10, "Description is too short"),
    location: z.string().min(2, "Location required"),
    rent: z.coerce.number().min(100, "Minimum rent is 100"),
    deposit: z.coerce.number().min(0, "Deposit can't be negative"),
    availableFrom: z.string().min(1, "Availability date required"),
    roomType: z.string().min(1, "Room type required"),
  }),
  z.object({
    images: z
      .array(z.string().url("Please provide a valid image URL"))
      .min(1, "At least one image URL required"),
  }),
  z.object({
    amenities: z.object({
      wifi: z.boolean(),
      ac: z.boolean(),
      parking: z.boolean(),
      furnished: z.boolean(),
      washingMachine: z.boolean(),
    }),
  }),
  z.object({}),
];

// Default form values
type FormType = {
  title: string;
  description: string;
  location: string;
  rent: number;
  deposit: number;
  availableFrom: string;
  roomType: string;
  images: string[];
  amenities: {
    wifi: boolean;
    ac: boolean;
    parking: boolean;
    furnished: boolean;
    washingMachine: boolean;
  };
};

const defaultForm: FormType = {
  title: "",
  description: "",
  location: "",
  rent: 0,
  deposit: 0,
  availableFrom: "",
  roomType: "",
  images: [],
  amenities: {
    wifi: false,
    ac: false,
    parking: false,
    furnished: false,
    washingMachine: false,
  },
};

// Function to apply or remove dark class on documentElement based on theme
const applyTheme = (theme: "light" | "dark") => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export function PostRoom() {
  const navigate = useNavigate();

  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormType>(defaultForm);
  const [errors, setErrors] = useState<{ [key: string]: string }>({}); // Explicitly type errors
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  // Apply theme on initial load and when theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("amenities.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        amenities: { ...prev.amenities, [key]: checked },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  const handleUpload = async (files: FileList) => {
    try {
      const validFiles = Array.from(files).filter((file) => {
        const isValidType = file.type.startsWith("image/");
        const isValidSize = file.size <= 5 * 1024 * 1024; // Max 5MB
        return isValidType && isValidSize;
      });

      if (validFiles.length === 0) {
        alert("Please upload valid image files under 5MB.");
        return;
      }

      const { data } = await axios.post(
        "https://homies-oqpt.onrender.com/api/cloud/get-signature"
      );

      const uploaders = validFiles.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", data.apiKey);
        formData.append("timestamp", data.timestamp);
        formData.append("signature", data.signature);
        formData.append("folder", "mine");

        return axios.post(
          `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
          formData
        );
      });

      const results = await Promise.all(uploaders);
      const urls = results.map((res) => res.data.secure_url);

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
      }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("Image upload failed.");
    }
  };

  const validateStep = () => {
    const schema = stepSchemas[step];
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path.join(".");
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleReset = () => {
    setStep(0);
    setForm(defaultForm);
    setErrors({});
  };

  const fetchLocationSuggestions = async (query: string) => {
    if (!query) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
          query
        )}&limit=5&format=json`
      );
      if (!res.ok) {
        if (res.status === 401) {
          console.error("LocationIQ API Key is invalid or missing.");
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        setLocationSuggestions([]); // Clear suggestions on error
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setLocationSuggestions(data);
      } else {
        console.error("LocationIQ API returned unexpected data:", data);
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setLocationSuggestions([]);
    }
  };

  const debouncedFetchLocationSuggestions = useCallback(
    debounce((query: string) => {
      // Explicitly type query
      fetchLocationSuggestions(query);
    }, 500),
    []
  );

  const handleSubmit = async () => {
    setLoading(true);
    const userEmail = localStorage.getItem("email")?.replace(/^"|"$/g, "");
    const userId = localStorage.getItem("userId")?.replace(/^"|"$/g, "");
    const formData = { ...form, email: userEmail, userId: userId };

    try {
      const response = await fetch(
        "https://homies-oqpt.onrender.com/api/room/postroom",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to post room: ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      if (result.success) {
        alert("Room posted successfully!");
        handleReset();
        navigate({ to: "/dashboard" });
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error: any) {
      // Explicitly type error
      alert(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <TextField
                label="Room Title"
                name="title"
                fullWidth
                value={form.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                variant="outlined"
                size="small"
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme === "dark" ? "#555" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: theme === "dark" ? "#777" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme === "dark" ? "#999" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme === "dark" ? "#ddd" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    color: theme === "dark" ? "#fff" : undefined,
                  },
                }}
              />
              <TextField
                label="Description"
                name="description"
                fullWidth
                multiline
                rows={5}
                value={form.description}
                onChange={handleChange}
                error={!!errors.description}
                helperText={errors.description}
                variant="outlined"
                size="small"
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme === "dark" ? "#555" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: theme === "dark" ? "#777" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme === "dark" ? "#999" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme === "dark" ? "#ddd" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    color: theme === "dark" ? "#fff" : undefined,
                  },
                }}
              />
              <Autocomplete
                freeSolo
                options={locationSuggestions}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.display_name
                }
                filterOptions={(x) => x}
                inputValue={form.location}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === "input") {
                    setForm((prev) => ({ ...prev, location: newInputValue }));
                    debouncedFetchLocationSuggestions(newInputValue);
                  }
                }}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    setForm((prev) => ({
                      ...prev,
                      location: newValue.display_name,
                    }));
                  } else if (typeof newValue === "string") {
                    setForm((prev) => ({ ...prev, location: newValue }));
                  } else {
                    setForm((prev) => ({ ...prev, location: "" }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={!!errors.location}
                    helperText={errors.location}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: theme === "dark" ? "#555" : undefined,
                        },
                        "&:hover fieldset": {
                          borderColor: theme === "dark" ? "#777" : undefined,
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: theme === "dark" ? "#999" : undefined,
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: theme === "dark" ? "#ddd" : undefined,
                      },
                      "& .MuiInputBase-input": {
                        color: theme === "dark" ? "#fff" : undefined,
                      },
                    }}
                  />
                )}
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme === "dark" ? "#555" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: theme === "dark" ? "#777" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme === "dark" ? "#999" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme === "dark" ? "#ddd" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    color: theme === "dark" ? "#fff" : undefined,
                  },
                }}
              />

              <TextField
                label="Rent (₹)"
                name="rent"
                type="number"
                value={form.rent}
                onChange={handleChange}
                error={!!errors.rent}
                helperText={errors.rent}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme === "dark" ? "#555" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: theme === "dark" ? "#777" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme === "dark" ? "#999" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme === "dark" ? "#ddd" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    color: theme === "dark" ? "#fff" : undefined,
                  },
                }}
              />
              <TextField
                label="Deposit (₹)"
                name="deposit"
                type="number"
                value={form.deposit}
                onChange={handleChange}
                error={!!errors.deposit}
                helperText={errors.deposit}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme === "dark" ? "#555" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: theme === "dark" ? "#777" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme === "dark" ? "#999" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme === "dark" ? "#ddd" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    color: theme === "dark" ? "#fff" : undefined,
                  },
                }}
              />
              <TextField
                label="Available From"
                name="availableFrom"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.availableFrom}
                onChange={handleChange}
                error={!!errors.availableFrom}
                helperText={errors.availableFrom}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme === "dark" ? "#555" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: theme === "dark" ? "#777" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme === "dark" ? "#999" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme === "dark" ? "#ddd" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    color: theme === "dark" ? "#fff" : undefined,
                  },
                }}
              />
              <TextField
                select
                label="Room Type"
                name="roomType"
                value={form.roomType}
                onChange={handleChange}
                error={!!errors.roomType}
                helperText={errors.roomType}
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  marginBottom: 2,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: theme === "dark" ? "#555" : undefined,
                    },
                    "&:hover fieldset": {
                      borderColor: theme === "dark" ? "#777" : undefined,
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme === "dark" ? "#999" : undefined,
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme === "dark" ? "#ddd" : undefined,
                  },
                  "& .MuiInputBase-input": {
                    color: theme === "dark" ? "#fff" : undefined,
                  },
                  "& .MuiMenu-list": {
                    backgroundColor: theme === "dark" ? "#333" : "#fff",
                    color: theme === "dark" ? "#fff" : "#000",
                  },
                  "& .MuiMenuItem-root": {
                    "&:hover": {
                      backgroundColor: theme === "dark" ? "#444" : "#eee",
                    },
                  },
                }}
              >
                <MenuItem value="single">Single</MenuItem>
                <MenuItem value="shared">Shared</MenuItem>
                <MenuItem value="apartment">Apartment</MenuItem>
              </TextField>
            </motion.div>
          </Stack>
        );

      case 1:
        return (
          <Box>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="outlined"
                component="label"
                sx={{
                  mt: 2,
                  mb: 2,
                  color: theme === "dark" ? "#bbb" : undefined,
                  borderColor: theme === "dark" ? "#555" : undefined,
                  "&:hover": {
                    borderColor: theme === "dark" ? "#777" : undefined,
                  },
                }}
              >
                Upload Images
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) handleUpload(e.target.files);
                  }}
                />
              </Button>
              {errors.images && (
                <Typography color="error" variant="caption" display="block">
                  {errors.images}
                </Typography>
              )}
            </motion.div>

            <Stack direction="row" spacing={2} flexWrap="wrap" mt={2}>
              {form.images.map((url, index) => (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    width: 150,
                    height: 150,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: 3,
                    marginBottom: 2,
                  }}
                >
                  <Avatar
                    src={url}
                    variant="rounded"
                    sx={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => handleRemoveImage(index)}
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      minWidth: "initial",
                      padding: "4px",
                      backgroundColor: "rgba(255,255,255,0.7)",
                      color: "black",
                      ":hover": {
                        backgroundColor: "rgba(255,0,0,0.8)",
                        color: "white",
                      },
                    }}
                  >
                    ✕
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={2}
              flexWrap="wrap"
            >
              {Object.keys(form.amenities).map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      name={`amenities.${key}`}
                      checked={
                        form.amenities[key as keyof typeof form.amenities]
                      }
                      onChange={handleChange}
                      sx={{
                        color: theme === "dark" ? "#bbb" : undefined,
                        "&.Mui-checked": {
                          color: theme === "dark" ? "#4caf50" : undefined,
                        },
                      }}
                    />
                  }
                  label={key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    color: theme === "dark" ? "#ddd" : undefined,
                  }}
                />
              ))}
            </Stack>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: theme === "dark" ? "#fff" : undefined }}
            >
              Confirm Your Room Details
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                backgroundColor: theme === "dark" ? "#444" : undefined,
                borderColor: theme === "dark" ? "#666" : undefined,
              }}
            >
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Title:</strong> {form.title}
              </Typography>
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Description:</strong> {form.description}
              </Typography>
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Location:</strong> {form.location}
              </Typography>
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Rent:</strong> ₹{form.rent}
              </Typography>
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Deposit:</strong> ₹{form.deposit}
              </Typography>
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Available From:</strong> {form.availableFrom}
              </Typography>
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Room Type:</strong> {form.roomType}
              </Typography>
              <Typography sx={{ color: theme === "dark" ? "#ddd" : undefined }}>
                <strong>Amenities:</strong>{" "}
                {Object.keys(form.amenities)
                  .filter(
                    (key) => form.amenities[key as keyof typeof form.amenities]
                  )
                  .map((key) =>
                    key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (s) => s.toUpperCase())
                  )
                  .join(", ") || "None"}
              </Typography>
              {form.images.length > 0 && (
                <Box mt={2}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ color: theme === "dark" ? "#fff" : undefined }}
                  >
                    Images:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {form.images.map((url, index) => (
                      <Avatar
                        key={index}
                        src={url}
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        minHeight: "calc(100vh - 64px)", // Adjust based on your header height
        backgroundColor: theme === "dark" ? "#1a202c" : "#f7fafc", // Tailwind gray-900 equivalent
        color: theme === "dark" ? "#fff" : "#000",
        p: 3,
      }}
    >
      {/* Theme Toggle Icon */}

      <div className="flex justify-evenly items-center w-full mb-4">
        <Box
          sx={{
            width: "100%",
            maxWidth: "950px",
            display: "flex",
            justifyContent: "flex-start",
            mb: 3,
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate({ to: "/dashboard" })}
            sx={{
              mb: 3,
              color: theme === "dark" ? "#bbb" : undefined,
              borderColor: theme === "dark" ? "#555" : undefined,
              "&:hover": {
                borderColor: theme === "dark" ? "#777" : undefined,
              },
            }}
            variant="outlined"
          >
            Back
          </Button>
        </Box>

        <Box sx={{ alignSelf: "flex-end", mb: 3 }}>
          <Button
            onClick={toggleTheme}
            sx={{
              p: 1,
              minWidth: "auto",
              borderRadius: "50%",
              backgroundColor: theme === "dark" ? "#4a5568" : "#e2e8f0",
              color: theme === "dark" ? "#e2e8f0" : "#2d3748",
              "&:hover": {
                backgroundColor: theme === "dark" ? "#6a7480" : "#cbd5e0",
              },
            }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon /> : <Sun />}
          </Button>
        </Box>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: "950px",
          width: "100%",
          marginTop: 0,
        }}
      >
        <Paper
          sx={{
            p: 4,
            backgroundColor: theme === "dark" ? "#2d3748" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
            boxShadow:
              theme === "dark"
                ? "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25)"
                : undefined,
          }}
        >
          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{
              mb: 5,
              "& .MuiStepConnector-line": {
                borderColor: theme === "dark" ? "#444" : undefined,
              },
              "& .MuiStepLabel-label": {
                color: theme === "dark" ? "#ddd" : undefined,
                "&.Mui-active": {
                  color: theme === "dark" ? "#fff" : undefined,
                },
                "&.Mui-completed": {
                  color: theme === "dark" ? "#bbb" : undefined,
                },
              },
              "& .MuiStepIcon-root": {
                color: theme === "dark" ? "#555" : undefined,
                "&.Mui-active": {
                  color: theme === "dark" ? "#4caf50" : undefined,
                },
                "&.Mui-completed": {
                  color: theme === "dark" ? "#0073e6" : undefined,
                },
              },
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      color:
                        theme === "dark"
                          ? "#ddd"
                          : step >= index
                          ? "#0073e6"
                          : "#888",
                      fontWeight: step === index ? "bold" : "normal",
                      "&.Mui-active": {
                        color: theme === "dark" ? "#fff" : "#0073e6",
                      },
                      "&.Mui-completed": {
                        color: theme === "dark" ? "#bbb" : "#0073e6",
                      },
                    },
                    "& .MuiSvgIcon-root": {
                      color:
                        theme === "dark"
                          ? "#555"
                          : step >= index
                          ? "#0073e6"
                          : "#ccc",
                      "&.Mui-active": {
                        color: theme === "dark" ? "#4caf50" : "#0073e6",
                      },
                      "&.Mui-completed": {
                        color: theme === "dark" ? "#0073e6" : "#0073e6",
                      },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 3 }}>{getStepContent()}</Box>
          <Box mt={3} display="flex" justifyContent="center">
            <Button
              disabled={step === 0 || loading}
              onClick={handleBack}
              sx={{ mr: 3 }}
              variant="outlined"
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button variant="contained" color="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                startIcon={<CheckCircleOutline />}
                disabled={loading} // Disable submit button while loading
              >
                {loading ? "Submitting..." : "Confirm & Submit"}
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: "/post-room",
    component: PostRoom,
    getParentRoute: () => parentRoute,
    beforeLoad: ({
      context,
      location,
    }: {
      context: { auth?: { isAuthenticated: () => boolean } };
      location: { href: string };
    }) => {
      if (!context?.auth?.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
