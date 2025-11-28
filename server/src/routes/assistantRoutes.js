import express from "express";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = `You are an assistant inside an EV route planning app.\n\nYou help with:\n- Charging slot prediction and station choice.\n- Route planning and whether the user can safely reach destination.\n- Explaining alerts (low battery, low predicted SoC, next service due, battery health, etc).\n- Pointing out the nearest selected station when relevant.\n\nYou are given JSON context about the user's current EV state plus a precomputed alerts summary.\nWhen the user asks about alerts or safety, ALWAYS mention:\n- Any low-battery or low predicted SoC situations.\n- If next service is due soon.\n- The nearest/selected station name as an option if it exists.\n\nAnswer concretely, short, and focused on actions the driver can take. Prefer bullet points. If you lack data, say so briefly.`;

    const raw = context || {};

    const battery = raw.battery;
    const predictedEnergy = raw.predictedEnergy || {};
    const selectedStation = raw.selectedStation || null;

    const computedAlerts = [];
    if (typeof battery === "number" && battery <= 20) {
      computedAlerts.push("Low current battery – consider charging soon.");
    }
    if (
      typeof predictedEnergy.predictedRemainingSoC === "number" &&
      predictedEnergy.predictedRemainingSoC < 15
    ) {
      computedAlerts.push(
        "Planned route may leave you with very low charge at destination."
      );
    }
    if (
      typeof predictedEnergy.nextServiceDuePercent === "number" &&
      predictedEnergy.nextServiceDuePercent > 0.8
    ) {
      computedAlerts.push("Next service is due soon based on odometer.");
    }
    if (
      typeof predictedEnergy.batteryHealth === "number" &&
      predictedEnergy.batteryHealth < 0.7
    ) {
      computedAlerts.push("Battery health is degraded – range may be reduced.");
    }
    if (Array.isArray(predictedEnergy.alerts) && predictedEnergy.alerts.length) {
      computedAlerts.push(...predictedEnergy.alerts);
    }

    const nearestStationSummary = selectedStation
      ? {
          name: selectedStation.name || "Unknown station",
          location: selectedStation.location || null,
        }
      : null;

    const evContext = {
      ...raw,
      assistantAlerts: computedAlerts,
      nearestStationSummary,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Context: ${JSON.stringify(evContext)}\n\nUser: ${message}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    return res.json({ reply });
  } catch (err) {
    console.error("Assistant chat error", err);
    return res.status(500).json({ error: "Assistant unavailable" });
  }
});

export default router;
