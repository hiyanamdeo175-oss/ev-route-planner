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

function ProfileSettings() {
  const { userProfile, setUserProfile } = useContext(EVContext);

  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    evModel: "",
    range: "",
    avatar: "",
  });

  // Load from context/localStorage
  useEffect(() => {
    if (userProfile) {
      setProfileData(userProfile);
    } else {
      const saved = JSON.parse(localStorage.getItem("userProfile"));
      if (saved) setProfileData(saved);
    }
  }, [userProfile]);

  // Save profile to context and localStorage
  const handleSave = () => {
    setUserProfile(profileData);
    localStorage.setItem("userProfile", JSON.stringify(profileData));
    setEditMode(false);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ width: 400, p: 3, boxShadow: 5, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Avatar
            sx={{ width: 100, height: 100, mb: 2 }}
            src={
              profileData.avatar ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
          />

          {editMode ? (
            <>
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

              <Button
                variant="contained"
                color="success"
                startIcon={<SaveIcon />}
                sx={{ mt: 2, borderRadius: 3 }}
                onClick={handleSave}
              >
                Save Profile
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h5" fontWeight="bold">
                {profileData.name || "User Name"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profileData.email || "user@example.com"}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                EV Model: {profileData.evModel || "Tata Nexon EV"} | Range:{" "}
                {profileData.range || "320 km"}
              </Typography>

              <Button
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ mt: 3, borderRadius: 3 }}
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
}

export default ProfileSettings;
