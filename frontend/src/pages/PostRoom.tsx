import { useCallback, useState } from "react";
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
import { motion } from "framer-motion"; // Import framer-motion
import axios from "axios";
import { Autocomplete } from "@mui/material";
import debounce from "lodash/debounce";

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
const defaultForm = {
  title: "",
  description: "",
  location: "",
  rent: 0,
  deposit: 0,
  availableFrom: "",
  roomType: "",
  images: [""],
  amenities: {
    wifi: false,
    ac: false,
    parking: false,
    furnished: false,
    washingMachine: false,
  },
};

export function PostRoom() {
  const navigate = useNavigate(); // get navigate function

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "location") {
      fetchLocationSuggestions(value);
    }

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

  const handleRemoveImage = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  const handleUpload = async (files) => {
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
        "http://localhost:5000/api/cloud/get-signature"
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
    }
  };

  const validateStep = () => {
    const schema = stepSchemas[step];
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
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
  const fetchLocationSuggestions = async (query) => {
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
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setLocationSuggestions([]);
    }
  };
  const debouncedFetchLocationSuggestions = useCallback(
    debounce((query) => {
      fetchLocationSuggestions(query);
    }, 500),
    [] // empty dependencies = create once on mount
  );

  const handleSubmit = async () => {
    setLoading(true);

    const userEmail = localStorage.getItem("email")?.replace(/^"|"$/g, "");
    const userId = localStorage.getItem("userId");
    const formData = { ...form, email: userEmail, userId: userId };

    try {
      const response = await fetch("http://localhost:5000/api/room/postroom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

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
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
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
                sx={{ marginBottom: 2 }}
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
                sx={{ marginBottom: 2 }}
              />
              <Autocomplete
                freeSolo
                options={locationSuggestions}
                getOptionLabel={(option) =>
                  typeof option === "string" ? option : option.display_name
                }
                filterOptions={(x) => x} // disable built-in filtering, since API already filters
                inputValue={form.location}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === "input") {
                    setForm((prev) => ({
                      ...prev,
                      location: newInputValue,
                    }));
                    debouncedFetchLocationSuggestions(newInputValue);
                  }
                }}
                onChange={(event, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    setForm((prev) => ({
                      ...prev,
                      location: newValue.display_name,
                    }));
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
                    sx={{ marginBottom: 2 }}
                  />
                )}
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
                sx={{ marginBottom: 2 }}
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
                sx={{ marginBottom: 2 }}
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
                sx={{ marginBottom: 2 }}
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
                sx={{ marginBottom: 2 }}
              >
                <MenuItem value="single">Single</MenuItem>
                <MenuItem value="shared">Shared</MenuItem>
                <MenuItem value="apartment">Apartment</MenuItem>
              </TextField>
            </motion.div>
          </Stack>
        );

        return (
          <Box>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
                style={{ marginTop: "10px" }}
              />
            </motion.div>
            <Stack direction="row" spacing={2} mt={3} flexWrap="wrap">
              {form.images.map((url, index) => (
                <Avatar
                  key={index}
                  src={url}
                  variant="rounded"
                  sx={{
                    width: 150,
                    height: 150,
                    borderRadius: 2,
                    boxShadow: 3,
                    marginBottom: 2,
                  }}
                />
              ))}
            </Stack>
          </Box>
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
                sx={{ mt: 2, mb: 2 }}
              >
                Upload Images
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </Button>
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
            >
              {Object.keys(form.amenities).map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      name={`amenities.${key}`}
                      checked={form.amenities[key]}
                      onChange={handleChange}
                    />
                  }
                  label={key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                />
              ))}
            </Stack>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Your Room Details
            </Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography>
                <strong>Title:</strong> {form.title}
              </Typography>
              <Typography>
                <strong>Description:</strong> {form.description}
              </Typography>
              <Typography>
                <strong>Location:</strong> {form.location}
              </Typography>
              <Typography>
                <strong>Rent:</strong> ₹{form.rent}
              </Typography>
              <Typography>
                <strong>Deposit:</strong> ₹{form.deposit}
              </Typography>
              <Typography>
                <strong>Available From:</strong> {form.availableFrom}
              </Typography>
              <Typography>
                <strong>Room Type:</strong> {form.roomType}
              </Typography>
              <Typography>
                <strong>Amenities:</strong>{" "}
                {Object.keys(form.amenities)
                  .filter((key) => form.amenities[key])
                  .join(", ")}
              </Typography>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate({ to: "/dashboard" })}
        sx={{ mb: 3 }}
        variant="outlined"
        className="h-min top-5 left-0  p-2 wrap-break-word"
      >
        Back to Dashboard
      </Button>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          maxWidth: "950px",
          width: "100%",
          marginTop: 40,
        }}
      >
        <Paper sx={{ p: 4 }}>
          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{ mb: 5 }}
            connectorProps={{
              style: {
                borderColor:
                  step === 0
                    ? "#ccc"
                    : step === 1
                    ? "#4caf50"
                    : step === 2
                    ? "#ff9800"
                    : "#0073e6",
              },
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      color: step >= index ? "#0073e6" : "#888",
                      fontWeight: step === index ? "bold" : "normal",
                    },
                    "& .MuiSvgIcon-root": {
                      color: step >= index ? "#0073e6" : "#ccc",
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
              disabled={step === 0}
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
              >
                Confirm & Submit
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
    beforeLoad: ({ context, location }) => {
      if (!context.auth.isAuthenticated()) {
        throw redirect({ to: "/", search: { redirect: location.href } });
      }
    },
  });
