import React, { useContext, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Box,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { EVContext } from "./EVContext"; // ✅ Adjust path if EVContext is elsewhere
import { useAuth } from "../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import { predictEnergy } from "../services/aiApi";

function ProfileSettings() {
  const { userProfile, setUserProfile, predictedEnergy, setPredictedEnergy } =
    useContext(EVContext);
  const { user } = useAuth();
  const theme = useTheme();

  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    evModel: "",
    range: "",
    batteryHealth: "",
    tireHealth: "",
    odometerKm: "",
    preferredChargeLimit: "",
    avatar: "",
  });
  const [batteryCheckLoading, setBatteryCheckLoading] = useState(false);
  const [batteryCheckError, setBatteryCheckError] = useState("");

  useEffect(() => {
    let base = profileData;

    if (userProfile) {
      base = { ...base, ...userProfile };
    } else {
      const saved = localStorage.getItem("userProfile");
      if (saved) base = { ...base, ...JSON.parse(saved) };
    }

    if (user) {
      base = {
        ...base,
        name: user.name || base.name,
        email: user.email || base.email,
        phone: user.phone || base.phone,
        role: user.role || base.role,
      };
    }

    setProfileData(base);
  }, [userProfile, user]);

  // Save profile to context and localStorage
  const handleSave = () => {
    setUserProfile(profileData);
    localStorage.setItem("userProfile", JSON.stringify(profileData));
    setEditMode(false);
  };

  const handleResetToDefault = () => {
    const next = {
      name: user?.name || "EV Driver",
      email: user?.email || "user@example.com",
      phone: user?.phone || "",
      role: user?.role || "user",
      evModel: "Tata Nexon EV",
      range: "320 km",
      batteryHealth: "95",
      tireHealth: "90",
      odometerKm: "12000",
      preferredChargeLimit: "80",
      avatar:
        profileData.avatar ||
        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    };
    setProfileData(next);
    setUserProfile(next);
    localStorage.setItem("userProfile", JSON.stringify(next));
  };

  const runBatteryHealthCheck = async () => {
    try {
      setBatteryCheckLoading(true);
      setBatteryCheckError("");

      const odometerKmNum = Number(profileData.odometerKm || 0) || 0;
      const batteryHealthNum = Number(profileData.batteryHealth || 0);
      const preferredLimitNum = Number(profileData.preferredChargeLimit || 0);

      const payload = {
        currentSoCPercent:
          preferredLimitNum > 0 && preferredLimitNum <= 100 ? preferredLimitNum : 80,
        batteryCapacityKWh: 40,
        distanceKmPlanned: 0,
        odometerKm: odometerKmNum,
        batteryHealthPercent:
          batteryHealthNum > 0 && batteryHealthNum <= 100
            ? batteryHealthNum
            : undefined,
        preferredChargeLimitPercent:
          preferredLimitNum > 0 && preferredLimitNum <= 100
            ? preferredLimitNum
            : undefined,
      };

      const result = await predictEnergy(payload);
      setPredictedEnergy(result);
    } catch (err) {
      console.error("Battery health check failed", err);
      setBatteryCheckError("Could not run battery health check. Please try again.");
    } finally {
      setBatteryCheckLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        px: 2,
        py: 4,
      }}
    >
      <Card
        sx={{
          width: 520,
          borderRadius: 4,
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(15,23,42,0.98)"
              : theme.palette.background.paper,
          border: "1px solid rgba(148,163,184,0.5)",
          p: 3,
        }}
      >
        <CardContent>
          {/* Header + avatar */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{ width: 80, height: 80 }}
                src={
                  profileData.avatar ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
              />
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {profileData.name || "EV driver"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {profileData.email || "user@example.com"}
                </Typography>
                {profileData.phone && (
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {profileData.phone}
                  </Typography>
                )}
              </Box>
            </Box>

            {!editMode && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontSize: 13,
                  px: 2.5,
                }}
                onClick={() => setEditMode(true)}
              >
                Edit
              </Button>
            )}
          </Box>

          {/* Personal info + vehicle summary (read-only) */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <Avatar
              sx={{ width: 96, height: 96, mb: 1.5 }}
              src={
                profileData.avatar ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              }
            />

            {/* Avatar presets when editing */}
            {editMode && (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: 2,
                  mt: 0.5,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {[
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                  "https://cdn-icons-png.flaticon.com/512/924/924915.png",
                  "https://cdn-icons-png.flaticon.com/512/1999/1999625.png",
                  "https://cdn-icons-png.flaticon.com/512/194/194938.png",
                ].map((url) => (
                  <Avatar
                    key={url}
                    src={url}
                    sx={{
                      width: 38,
                      height: 38,
                      cursor: "pointer",
                      border:
                        profileData.avatar === url
                          ? "2px solid #38bdf8"
                          : "1px solid rgba(148,163,184,0.5)",
                    }}
                    onClick={() => setProfileData({ ...profileData, avatar: url })}
                  />
                ))}
              </Box>
            )}

            {!editMode && (
              <>
                <Typography variant="h6" fontWeight="bold">
                  {profileData.name || "User Name"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {profileData.email || "user@example.com"}
                </Typography>
                {profileData.phone && (
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {profileData.phone}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                  Role: {profileData.role || "user"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                  EV Model: {profileData.evModel || "Tata Nexon EV"} • Range: {""}
                  {profileData.range || "320 km"}
                </Typography>
                {(profileData.batteryHealth || profileData.tireHealth) && (
                  <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                    Battery health (user): {profileData.batteryHealth || "-"}% • Tyre
                    health: {profileData.tireHealth || "-"}%
                  </Typography>
                )}
                {predictedEnergy?.batteryHealth != null && (
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.85, mt: 0.5, color: "#22c55e" }}
                  >
                    Battery health (AI):
                    {" "}{Math.round(predictedEnergy.batteryHealth * 100)}%
                    {predictedEnergy.rangeDegradationPercent != null && (
                      <>{` • Range loss approx. ${predictedEnergy.rangeDegradationPercent}%`}</>
                    )}
                  </Typography>
                )}
                {predictedEnergy?.alerts?.length > 0 && (
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.8, mt: 0.5, color: "#f97316" }}
                  >
                    Alerts: {predictedEnergy.alerts.join(" • ")}
                  </Typography>
                )}
                {profileData.odometerKm && (
                  <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                    Odometer: {profileData.odometerKm} km
                  </Typography>
                )}
              </>
            )}
          </Box>

          {editMode ? (
            <>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1, fontSize: 13, opacity: 0.8 }}
              >
                Personal information
              </Typography>
              <TextField
                fullWidth
                label="Name"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
              />
              <Typography
                variant="subtitle2"
                sx={{ mt: 2, mb: 1, fontSize: 13, opacity: 0.8 }}
              >
                Vehicle & condition
              </Typography>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Phone"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="EV Model"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.evModel}
                onChange={(e) =>
                  setProfileData({ ...profileData, evModel: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Range (km)"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.range}
                onChange={(e) =>
                  setProfileData({ ...profileData, range: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Battery health (%)"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.batteryHealth}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    batteryHealth: e.target.value,
                  })
                }
              />
              <TextField
                fullWidth
                label="Tyre health (%)"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.tireHealth}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    tireHealth: e.target.value,
                  })
                }
              />
              <TextField
                fullWidth
                label="Odometer (km)"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.odometerKm}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    odometerKm: e.target.value,
                  })
                }
              />
              <TextField
                fullWidth
                label="Preferred charge limit (%)"
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                value={profileData.preferredChargeLimit}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    preferredChargeLimit: e.target.value,
                  })
                }
              />

              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                sx={{ mt: 1.5, borderRadius: 3, textTransform: "none" }}
                onClick={handleSave}
              >
                Save profile
              </Button>
              <Button
                variant="text"
                sx={{
                  mt: 1,
                  ml: 1,
                  borderRadius: 3,
                  textTransform: "none",
                  fontSize: 12,
                  opacity: 0.8,
                }}
                onClick={handleResetToDefault}
              >
                Reset to my default
              </Button>
            </>
          ) : (
            <>
              <Button
                fullWidth
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ mt: 3, borderRadius: 3, textTransform: "none" }}
                onClick={() => setEditMode(true)}
              >
                Edit profile
              </Button>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  mt: 1.5,
                  borderRadius: 3,
                  textTransform: "none",
                  fontSize: 13,
                }}
                onClick={runBatteryHealthCheck}
                disabled={batteryCheckLoading}
              >
                {batteryCheckLoading
                  ? "Checking battery health..."
                  : "Run battery health AI check"}
              </Button>
              {batteryCheckError && (
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, display: "block", color: "#f97316" }}
                >
                  {batteryCheckError}
                </Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfileSettings;
