import React, { useEffect, useState } from "react";
import supabase from "./supabaseClient";
import { motion } from "framer-motion";
import { FaPlug, FaClock } from "react-icons/fa";

const BatteryCharging = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [message, setMessage] = useState("");

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
      else setSlots(data);
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

    const { error } = await supabase.from("port_time_slots").insert([
      {
        station_id: selectedStation,
        start_time: customStart,
        end_time: customEnd,
        ports_occupied: 1,
      },
    ]);

    if (error) setMessage("❌ Could not book custom slot.");
    else setMessage("✅ Custom slot booked successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 p-10">
      <motion.h1
        className="text-4xl font-bold text-center text-[#1e1e2f] mb-10 drop-shadow-sm"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        ⚡ EV Charging Station Dashboard
      </motion.h1>

      {/* Station Selection */}
      <div className="max-w-md mx-auto mb-10">
        <label className="block mb-2 text-lg font-semibold text-gray-700">
          Choose Charging Station
        </label>
        <select
          className="w-full border border-[#1e1e2f] rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-[#1e1e2f]/30 text-gray-700 font-medium"
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
      </div>

      {/* Available Slots Section */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-500 text-lg">Loading data...</p>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-[#1e1e2f] text-center">
              Available Time Slots
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {slots.length > 0 ? (
                slots.map((slot) => (
                  <motion.div
                    key={slot.id}
                    whileHover={{ scale: 1.05 }}
                    className={`p-6 rounded-2xl shadow-md transition-all duration-300 cursor-pointer text-center border ${
                      slot.ports_occupied
                        ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                        : "bg-[#1e1e2f] text-white border-[#1e1e2f]"
                    }`}
                    onClick={() => !slot.ports_occupied && handleBookSlot(slot.id)}
                  >
                    {/* Plug Icon */}
                    <div className="flex justify-center mb-2">
                      <FaPlug
                        size={30}
                        className={slot.ports_occupied ? "text-gray-400" : "text-blue-400"}
                      />
                    </div>

                    {/* Slot ID */}
                    <h3 className="text-lg font-semibold mb-2">
                      Slot #{slot.id.slice(0, 6)}
                    </h3>

                    {/* Time */}
                    <div className="text-sm text-gray-300 mb-1 flex justify-center items-center gap-1">
                      <FaClock />
                      <span>
                        {slot.start_time?.slice(11, 16)} - {slot.end_time?.slice(11, 16)}
                      </span>
                    </div>

                    {/* Status */}
                    <p
                      className={`mt-2 font-medium ${
                        slot.ports_occupied ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {slot.ports_occupied ? "❌ Occupied" : "✅ Available"}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-500 text-center col-span-full">
                  No slots found for this station.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Custom Slot Booking */}
      <div className="max-w-lg mx-auto mt-12 bg-white rounded-2xl shadow-md p-6 border border-[#1e1e2f]/20">
        <h3 className="text-xl font-semibold mb-4 text-[#1e1e2f] text-center">
          Book a Custom Time Slot
        </h3>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Start Time:
            </label>
            <input
              type="time"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1e1e2f]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              End Time:
            </label>
            <input
              type="time"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#1e1e2f]/40"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleCustomBooking}
            className="w-full bg-[#1e1e2f] hover:bg-[#2b2b3f] text-white py-3 rounded-lg font-semibold mt-3 transition-all duration-200"
          >
            🚗 Book Custom Slot
          </motion.button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <p className="text-center mt-8 font-semibold text-[#1e1e2f] text-lg">
          {message}
        </p>
      )}
    </div>
  );
};

export default BatteryCharging;


