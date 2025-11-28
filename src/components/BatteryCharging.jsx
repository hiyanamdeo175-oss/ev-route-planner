import React, { useEffect, useState } from "react";
import supabase from "./supabaseClient";
import { predictSlot } from "../services/aiApi";
import { motion } from "framer-motion";
import { FaPlug, FaClock } from "react-icons/fa";
import { useTheme } from "@mui/material/styles";

const BatteryCharging = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [message, setMessage] = useState("");
  const [slotPrediction, setSlotPrediction] = useState(null);

  const theme = useTheme();

  // ✅ Fetch stations + Realtime updates
  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("charging_stations").select("*");
      if (error) {
        console.error("Error fetching stations:", error);
      } else {
        setStations(data);
      }
      setLoading(false);
    };

    fetchStations();

    // 🔄 Subscribe to realtime changes
    const channel = supabase
      .channel("realtime-stations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "charging_stations" },
        (payload) => {
          console.log("Realtime change detected:", payload);
          fetchStations(); // refresh station list
        }
      )
      .subscribe();

    // 🧹 Cleanup when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Fetch slots for selected station
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedStation) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("port_time_slots")
        .select("*")
        .eq("station_id", selectedStation);
      if (error) console.error("Error fetching slots:", error);
      else {
        setSlots(data);
        try {
          const occupiedCount = (data || []).filter((s) => s.ports_occupied).length;
          const prediction = await predictSlot({
            stationId: selectedStation,
            portsTotal: 4,
            portsBusy: occupiedCount,
            powerKw: 50,
          });
          setSlotPrediction(prediction);
        } catch (e) {
          console.error("Slot prediction failed", e);
          setSlotPrediction(null);
        }
      }
      setLoading(false);
    };
    fetchSlots();
  }, [selectedStation]);

  // ✅ Book a predefined slot
  const handleBookSlot = async (slotId) => {
    const confirm = window.confirm("Are you sure you want to book this slot?");
    if (!confirm) return;

    setMessage("");
    const { error } = await supabase
      .from("port_time_slots")
      .update({ ports_occupied: 1 })
      .eq("id", slotId);
    if (error) setMessage("❌ Failed to book slot. Try again.");
    else setMessage("✅ Slot booked successfully!");
  };

  // ✅ Book custom slot
  const handleCustomBooking = async () => {
    if (!customStart || !customEnd || !selectedStation) {
      setMessage("⚠️ Please select a station and enter valid start/end times.");
      return;
    }

    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const startDate = new Date(`${dateStr}T${customStart}:00`);
      const endDate = new Date(`${dateStr}T${customEnd}:00`);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setMessage("⚠️ Invalid time format. Please pick times again.");
        return;
      }

      if (endDate <= startDate) {
        setMessage("⚠️ End time must be after start time.");
        return;
      }

      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      const { error } = await supabase.from("port_time_slots").insert([
        {
          station_id: selectedStation,
          start_time: startIso,
          end_time: endIso,
          ports_occupied: 1,
        },
      ]);

      if (error) {
        console.error("Custom slot insert error", error);
        setMessage("❌ Could not book custom slot.");
      } else {
        setMessage("✅ Custom slot booked successfully!");
      }
    } catch (err) {
      console.error("Custom slot booking failed", err);
      setMessage("❌ Could not book custom slot.");
    }
  };

  const rootClass =
    theme.palette.mode === "dark"
      ? "min-h-screen px-4 py-8 md:px-10 bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100"
      : "min-h-screen px-4 py-8 md:px-10 bg-slate-50 text-slate-900";

  return (
    <div className={rootClass}>
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 via-sky-400 to-indigo-500 text-lg">
                ⚡
              </span>
              Smart Charging
            </h1>
            <p className="text-sm md:text-[13px] text-slate-400 mt-1 max-w-xl">
              Monitor station capacity, predicted wait times, and schedule EV charging slots with AI assistance.
            </p>
          </div>

          {slotPrediction && (
            <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent px-4 py-3 text-xs md:text-sm shadow-lg">
              <div className="font-semibold text-emerald-300 text-[13px] mb-1">
                Station forecast
              </div>
              <div className="flex flex-wrap gap-3 text-slate-100/90">
                <span>
                  Predicted free ports:
                  <span className="font-semibold ml-1">
                    {slotPrediction.predictedAvailablePorts}
                  </span>
                </span>
                <span className="border-l border-slate-600/60 pl-3">
                  Predicted wait:
                  <span className="font-semibold ml-1">
                    {slotPrediction.predictedWaitMinutes} min
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Station Selection */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] mb-10">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-xl">
            <label className="block mb-2 text-sm font-semibold text-slate-200">
              Choose charging station
            </label>
            <select
              className="w-full rounded-xl bg-slate-950/80 border border-slate-600/70 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 text-slate-100"
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
            >
              <option value="">-- Select Station --</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} • {station.location}
                </option>
              ))}
            </select>

            <p className="mt-3 text-[12px] text-slate-500">
              Stations are synced in real time. Choose one to view available time slots and AI predictions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 shadow-xl flex flex-col justify-center">
            <h2 className="text-base font-semibold text-slate-100 mb-2">
              Live station insight
            </h2>
            {loading ? (
              <p className="text-sm text-slate-400">Loading station data...</p>
            ) : selectedStation ? (
              slotPrediction ? (
                <div className="space-y-2 text-sm text-slate-100/90">
                  <p>
                    This station is expected to have
                    <span className="font-semibold text-emerald-300 ml-1">
                      {slotPrediction.predictedAvailablePorts} free ports
                    </span>
                    around your selected time window.
                  </p>
                  <p>
                    Estimated wait time is
                    <span className="font-semibold text-sky-300 ml-1">
                      {slotPrediction.predictedWaitMinutes} minutes
                    </span>
                    . Consider off-peak hours for faster charging.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Select a station and wait a moment to see AI-based availability and wait time.
                </p>
              )
            ) : (
              <p className="text-sm text-slate-400">
                No station selected yet. Pick a station on the left to see predictions.
              </p>
            )}
          </div>
        </div>

        {/* Available Slots Section */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <p className="text-center text-slate-400 text-sm">Loading data...</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-slate-100">
                  Available time slots
                </h2>
                <span className="text-[12px] text-slate-500">
                  Tap an available slot to book it instantly.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {slots.length > 0 ? (
                  slots.map((slot) => (
                    <motion.div
                      key={slot.id}
                      whileHover={{ scale: slot.ports_occupied ? 1 : 1.04 }}
                      className={`relative p-5 rounded-2xl border text-center transition-all duration-200 shadow-md overflow-hidden ${
                        slot.ports_occupied
                          ? "bg-slate-800/70 border-slate-700/80 text-slate-500 cursor-not-allowed"
                          : "bg-slate-900/80 border-emerald-400/40 text-slate-50 cursor-pointer hover:border-emerald-300/80"
                      }`}
                      onClick={() => !slot.ports_occupied && handleBookSlot(slot.id)}
                    >
                      <div className="absolute inset-0 pointer-events-none">
                        {!slot.ports_occupied && (
                          <div className="absolute -top-10 right-0 w-32 h-32 bg-emerald-400/15 blur-2xl" />
                        )}
                      </div>

                      {/* Plug Icon */}
                      <div className="flex justify-center mb-2 relative z-10">
                        <FaPlug
                          size={30}
                          className={
                            slot.ports_occupied ? "text-slate-500" : "text-emerald-300"
                          }
                        />
                      </div>

                      {/* Slot ID */}
                      <h3 className="text-base font-semibold mb-1 relative z-10">
                        Slot #{slot.id.slice(0, 6)}
                      </h3>

                      {/* Time */}
                      <div className="text-xs mb-1 flex justify-center items-center gap-1 text-slate-300 relative z-10">
                        <FaClock />
                        <span>
                          {slot.start_time?.slice(11, 16)} - {slot.end_time?.slice(11, 16)}
                        </span>
                      </div>

                      {/* Status */}
                      <p
                        className={`mt-2 text-xs font-medium relative z-10 ${
                          slot.ports_occupied ? "text-red-400" : "text-emerald-300"
                        }`}
                      >
                        {slot.ports_occupied ? "Occupied" : "Available"}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center col-span-full text-sm">
                    No slots found for this station.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

      </motion.div>

      {/* Custom Slot Booking */}
      <div className="max-w-lg mx-auto mt-12 bg-slate-900/80 rounded-2xl shadow-xl p-6 border border-slate-700/80">
        <h3 className="text-lg font-semibold mb-4 text-slate-100 text-center">
          Book a custom time slot
        </h3>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-300">
              Start time
            </label>
            <input
              type="time"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full border border-slate-600/70 rounded-lg p-2 bg-slate-950/80 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-400/60 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-slate-300">
              End time
            </label>
            <input
              type="time"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full border border-slate-600/70 rounded-lg p-2 bg-slate-950/80 text-slate-100 text-sm focus:ring-2 focus:ring-emerald-400/60 focus:outline-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            onClick={handleCustomBooking}
            className="w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-400 hover:from-emerald-400 hover:via-emerald-300 hover:to-sky-300 text-slate-950 py-2.5 rounded-lg font-semibold mt-2 text-sm transition-all duration-150"
          >
            Book custom slot
          </motion.button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <p className="text-center mt-6 font-medium text-emerald-300 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}

export default BatteryCharging;


