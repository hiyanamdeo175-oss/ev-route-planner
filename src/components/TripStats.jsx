import React, { useContext } from "react";
import { Grid, Card, CardContent, Typography } from "@mui/material";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SpeedIcon from "@mui/icons-material/Speed";
import BoltIcon from "@mui/icons-material/Bolt";
import { EVContext } from "./EVContext";

function TripStats() {
  const { tripHistory, totalDistance, avgEfficiency } = useContext(EVContext);

  const stats = [
    { title: "Total Trips", value: tripHistory.length, icon: <DirectionsCarIcon fontSize="large" color="primary" /> },
    { title: "Total Distance", value: `${totalDistance.toFixed(1)} km`, icon: <SpeedIcon fontSize="large" color="success" /> },
    { title: "Avg Efficiency", value: `${avgEfficiency.toFixed(2)} km/kWh`, icon: <BoltIcon fontSize="large" color="warning" /> },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Trip Statistics
      </Typography>
      <Grid container spacing={3}>
        {stats.map((s, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ borderRadius: 3, boxShadow: 4, p: 2 }}>
              <CardContent style={{ textAlign: "center" }}>
                {s.icon}
                <Typography variant="h6" mt={1}>{s.title}</Typography>
                <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default TripStats;
