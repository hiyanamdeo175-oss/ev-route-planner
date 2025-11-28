import React, { useState, useContext } from "react";
import {
  Typography,
  Switch,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Box,
  LinearProgress,
  TextField,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import { EVContext } from "../components/EVContext";
import { ThemeContext } from "../context/ThemeContext";

function AppSettings() {
  const [units, setUnits] = useState("KM");
  const [volume, setVolume] = useState(50);
  const { battery, setBattery, range, setRange } = useContext(EVContext);
  const [newBattery, setNewBattery] = useState(battery);

  // 🌙 Get dark mode state from context
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  const theme = useTheme();

  const handleBatteryUpdate = () => {
    setBattery(newBattery);
    setRange(Math.round((newBattery / 100) * 270));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Card
        sx={{
          width: 520,
          borderRadius: 4,
          boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
          bgcolor: theme.palette.background.paper,
          border: "1px solid rgba(148,163,184,0.5)",
          p: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            App settings
          </Typography>

          {/* ⚡ Battery Section */}
          <Box mt={3} mb={2}>
            <Typography variant="h6" display="flex" alignItems="center">
              <BatteryFullIcon color="success" sx={{ mr: 1 }} /> Battery Stats
            </Typography>

            <Typography>Current Battery: {battery}%</Typography>
            <LinearProgress
              variant="determinate"
              value={battery}
              sx={{ height: 10, borderRadius: 5, my: 1 }}
            />
            <Typography variant="body2" color="textSecondary" mb={2}>
              Estimated Range: {range} km
            </Typography>

            <TextField
              type="number"
              label="Update Battery Level (%)"
              variant="outlined"
              size="small"
              value={newBattery}
              onChange={(e) => setNewBattery(Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: "60%", mr: 2 }}
            />
            <Button variant="contained" color="primary" onClick={handleBatteryUpdate}>
              Update
            </Button>
          </Box>

          {/* 🌙 Dark Mode */}
          <Box mt={3}>
            <Typography>Dark Mode</Typography>
            <Switch
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              color="primary"
            />
          </Box>

          {/* 🔊 Volume */}
          <Box mt={3}>
            <Typography gutterBottom>Notification Volume</Typography>
            <Slider
              value={volume}
              onChange={(e, newValue) => setVolume(newValue)}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* 📏 Units */}
          <Box mt={3}>
            <FormControl fullWidth>
              <InputLabel>Units</InputLabel>
              <Select value={units} label="Units" onChange={(e) => setUnits(e.target.value)}>
                <MenuItem value="KM">KM</MenuItem>
                <MenuItem value="Miles">Miles</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AppSettings;
