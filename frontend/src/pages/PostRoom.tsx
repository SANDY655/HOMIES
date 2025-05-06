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
} from "@mui/material";
import { z } from "zod";
import { CheckCircleOutline } from "@mui/icons-material";
import { motion } from "framer-motion";
import type { RootRoute } from "@tanstack/react-router";
import { createRoute, redirect } from "@tanstack/react-router";

const steps = ["Room Details", "Photos", "Amenities", "Review & Confirm"];

const stepSchemas = [
  z.object({
    title: z.string().min(3, "Title is too short"),
    description: z.string().min(10, "Description is too short"),
    location: z.string().min(2, "Location required"),
    rent: z.number().min(100, "Minimum rent is 100"),
  }),
  z.object({
    images: z.array(z.any()).min(1, "At least one image required"),
  }),
  z.object({
    amenities: z.object({
      wifi: z.boolean(),
      ac: z.boolean(),
      parking: z.boolean(),
    }),
  }),
  z.object({}),
];

const defaultForm = {
  title: "",
  description: "",
  location: "",
  rent: 0,
  images: [],
  amenities: { wifi: false, ac: false, parking: false },
};

export function PostRoom() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmed, setIsConfirmed] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setForm((prev) => ({ ...prev, images: files }));
  };

  const validateStep = () => {
    const schema = stepSchemas[step];
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
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
  };

  const renderImages = () => (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {form.images.map((file, index) => (
        <Grid item key={index}>
          <Avatar
            variant="rounded"
            src={URL.createObjectURL(file)}
            sx={{
              width: 100,
              height: 100,
              border: "3px solid #1976d2",
            }}
          />
        </Grid>
      ))}
    </Grid>
  );

  const getStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Room Title"
                name="title"
                fullWidth
                value={form.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                color="primary"
                variant="outlined"
                focused
                size="medium"
              />
            </Grid>
            <Grid item xs={12}>
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
                color="primary"
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                name="location"
                fullWidth
                value={form.location}
                onChange={handleChange}
                error={!!errors.location}
                helperText={errors.location}
                color="primary"
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label="Monthly Rent (₹)"
                name="rent"
                fullWidth
                value={form.rent}
                onChange={handleChange}
                error={!!errors.rent}
                helperText={errors.rent}
                color="primary"
                variant="outlined"
                size="medium"
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Box>
            <Button
              variant="contained"
              component="label"
              color="primary"
              size="large"
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
              <Typography color="error" mt={2} fontSize="1.2rem">
                {errors.images}
              </Typography>
            )}
            {form.images.length > 0 && renderImages()}
          </Box>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            {["wifi", "ac", "parking"].map((key) => (
              <Grid item xs={12} sm={4} key={key}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        form.amenities[key as keyof typeof form.amenities]
                      }
                      onChange={handleChange}
                      name={`amenities.${key}`}
                      color="primary"
                    />
                  }
                  label={key.toUpperCase()}
                  sx={{ fontSize: "1.2rem" }}
                />
              </Grid>
            ))}
          </Grid>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Please confirm your details:
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, backgroundColor: "#f9f9f9" }}>
              <Typography variant="body1">
                <strong>Title: </strong> {form.title}
              </Typography>
              <Typography variant="body1">
                <strong>Description: </strong> {form.description}
              </Typography>
              <Typography variant="body1">
                <strong>Location: </strong> {form.location}
              </Typography>
              <Typography variant="body1">
                <strong>Rent: </strong> ₹{form.rent}
              </Typography>
              <Typography variant="body1">
                <strong>Amenities: </strong>
                {Object.entries(form.amenities)
                  .filter(([key, value]) => value)
                  .map(([key]) => key.toUpperCase())
                  .join(", ")}
              </Typography>
              <Grid container spacing={3} sx={{ mt: 3 }}>
                {form.images.map((file, index) => (
                  <Grid item key={index}>
                    <Avatar
                      variant="rounded"
                      src={URL.createObjectURL(file)}
                      sx={{ width: 100, height: 100 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
            <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleBack}
                size="large"
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirm}
                size="large"
              >
                Confirm
              </Button>
            </Box>
          </Box>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: 6,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 800, mb: 4, boxShadow: 4 }}>
        <CardContent>
          <Stepper activeStep={step} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ fontSize: "1.5rem" }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", maxWidth: 800, boxShadow: 4 }}>
        <CardContent>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5 }}
          >
            {step < steps.length ? (
              <>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    mb: 3,
                    backgroundColor:
                      step === 0
                        ? "#e3f2fd"
                        : step === 1
                        ? "#fce4ec"
                        : "#e8f5e9",
                  }}
                >
                  {getStepContent()}
                </Paper>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={step === 0}
                    size="large"
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    color="primary"
                    disabled={step === steps.length - 1}
                    size="large"
                  >
                    Next
                  </Button>
                </Box>
              </>
            ) : (
              <Box textAlign="center" mt={4}>
                <CheckCircleOutline
                  color="success"
                  sx={{ fontSize: 80, mb: 2 }}
                />
                <Typography variant="h5" color="success.main" gutterBottom>
                  All steps completed — ready to submit!
                </Typography>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mr: 3 }}
                >
                  Submit
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outlined"
                  color="secondary"
                  size="large"
                >
                  Reset
                </Button>
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
