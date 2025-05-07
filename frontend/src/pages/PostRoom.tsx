import React, { useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Paper,
  Avatar,
  Divider,
  MenuItem,
  Stack,
} from "@mui/material";
import { z } from "zod";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { motion } from "framer-motion";
import { createRoute, RootRoute, redirect } from "@tanstack/react-router";

const steps = ["Room Details", "Photos", "Amenities", "Review & Confirm"];

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
    images: z.array(z.any()).min(1, "At least one image required"),
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

const defaultForm = {
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

export function PostRoom() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleChange = (e) => {
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

  const handleFileChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setForm((prev) => ({ ...prev, images: files }));
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
    setIsConfirmed(false);
  };

  const handleSubmit = () => {
    alert("Room posted successfully!");
    console.log(form);
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    setStep((prev) => prev + 1);
  };

  const getStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <TextField
              label="Room Title"
              name="title"
              fullWidth
              value={form.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
              variant="outlined"
            />
            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={4}
              value={form.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
              variant="outlined"
            />
            <TextField
              label="Location"
              name="location"
              fullWidth
              value={form.location}
              onChange={handleChange}
              error={!!errors.location}
              helperText={errors.location}
              variant="outlined"
            />
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Rent (₹)"
                name="rent"
                type="number"
                value={form.rent}
                onChange={handleChange}
                error={!!errors.rent}
                helperText={errors.rent}
                sx={{ flex: 1 }}
                variant="outlined"
              />
              <TextField
                label="Deposit (₹)"
                name="deposit"
                type="number"
                value={form.deposit}
                onChange={handleChange}
                error={!!errors.deposit}
                helperText={errors.deposit}
                sx={{ flex: 1 }}
                variant="outlined"
              />
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Available From"
                name="availableFrom"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.availableFrom}
                onChange={handleChange}
                error={!!errors.availableFrom}
                helperText={errors.availableFrom}
                sx={{ flex: 1 }}
                variant="outlined"
              />
              <TextField
                select
                label="Room Type"
                name="roomType"
                value={form.roomType}
                onChange={handleChange}
                error={!!errors.roomType}
                helperText={errors.roomType}
                sx={{ flex: 1 }}
                variant="outlined"
              >
                <MenuItem value="single">Single</MenuItem>
                <MenuItem value="shared">Shared</MenuItem>
                <MenuItem value="apartment">Apartment</MenuItem>
              </TextField>
            </Box>
          </Stack>
        );
      case 1:
        return (
          <Box>
            <Button
              variant="contained"
              component="label"
              sx={{ marginBottom: 2 }}
            >
              Upload Images
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            {errors.images && (
              <Typography
                color="error"
                variant="body2"
                sx={{ marginBottom: 2 }}
              >
                {errors.images}
              </Typography>
            )}
            <Grid container spacing={2}>
              {form.images.map((file, index) => (
                <Grid item key={index}>
                  <Avatar
                    src={URL.createObjectURL(file)}
                    variant="rounded"
                    sx={{
                      width: 80,
                      height: 80,
                      border: "2px solid #fff",
                      boxShadow: 3,
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            {Object.keys(form.amenities).map((key) => (
              <Grid item xs={6} sm={4} key={key}>
                <FormControlLabel
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
                />
              </Grid>
            ))}
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Your Room Details
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, boxShadow: 3 }}>
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
                {Object.entries(form.amenities)
                  .filter(([_, v]) => v)
                  .map(([k]) => k)
                  .join(", ")}
              </Typography>
            </Paper>
            <Box mt={2} textAlign="center">
              <Button
                variant="contained"
                onClick={handleConfirm}
                color="primary"
                sx={{ marginRight: 2 }}
              >
                Confirm
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        mt: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 800,
          mb: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Stepper
            activeStep={step}
            alternativeLabel
            sx={{
              "& .MuiStepConnector-line": {
                borderColor: "divider",
              },
              "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line": {
                borderColor: "primary.main",
              },
              "& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line": {
                borderColor: "primary.main",
              },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
      <Card
        sx={{ width: "100%", maxWidth: 800, borderRadius: 2, boxShadow: 3 }}
      >
        <CardContent>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.4 }}
          >
            {step < steps.length ? (
              <>
                {getStepContent()}
                <Box display="flex" justifyContent="space-between" mt={3}>
                  <Button
                    onClick={handleBack}
                    disabled={step === 0}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    variant="contained"
                    color="primary"
                    disabled={step === steps.length - 1}
                  >
                    Next
                  </Button>
                </Box>
              </>
            ) : (
              <Box textAlign="center">
                <CheckCircleOutline color="success" sx={{ fontSize: 60 }} />
                <Typography variant="h6" color="success.main" gutterBottom>
                  All steps completed — ready to submit!
                </Typography>
                <Box display="flex" justifyContent="center" gap={2} mt={2}>
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                  >
                    Submit
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outlined"
                    color="secondary"
                  >
                    Reset
                  </Button>
                </Box>
              </Box>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </Box>
  );
}

// ✅ Use named import above and return this route
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
