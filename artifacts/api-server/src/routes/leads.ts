import { ReplitConnectors } from "@replit/connectors-sdk";
import { CreateLeadBody, CreateLeadResponse } from "@workspace/api-zod";
import { db, leadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const CHECKLIST_URL = "/checklist";
const DEFAULT_FROM_EMAIL = "Coastal Cleaning Services <onboarding@resend.dev>";
const SERVICE_TYPE_LABELS: Record<string, string> = {
  standard: "Standard cleaning (recurring or one-time)",
  deep_clean: "Deep cleaning",
  move_in_out: "Move-in / move-out cleaning",
  commercial_office: "Commercial / office cleaning",
  other: "Other",
};
const PROPERTY_SIZE_LABELS: Record<string, string> = {
  "1_bed_1_bath": "1 bedroom / 1 bath",
  "2_bed_1_2_bath": "2 bedrooms / 1–2 baths",
  "3_bed_3_plus_bath": "3 bedrooms / 3+ baths",
  "4_plus_bedrooms": "4+ bedrooms",
};
const TIME_WINDOW_LABELS: Record<string, string> = {
  morning: "Mornings (8:00 am–12:00 pm)",
  afternoon: "Afternoons (12:00–4:00 pm)",
  flexible: "Flexible / first available",
};
const CLEANING_FREQUENCY_LABELS: Record<string, string> = {
  one_time: "One-time only",
  weekly: "Weekly (15% off)",
  bi_weekly: "Bi-weekly (10% off)",
  monthly: "Monthly (5% off)",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid lead submission");
    res.status(400).json({ error: "Please check the details and try again." });
    return;
  }

  const leadData = {
    ...parsed.data,
    fullName: parsed.data.fullName.trim(),
    email: parsed.data.email.trim().toLowerCase(),
    phone: parsed.data.phone?.trim() || null,
    serviceAddress: parsed.data.serviceAddress?.trim() || null,
    serviceType: parsed.data.serviceType ?? null,
    propertySize: parsed.data.propertySize ?? null,
    specialRequests: parsed.data.specialRequests?.trim() || null,
    preferredDate: parsed.data.preferredDate
      ? parsed.data.preferredDate.toISOString().slice(0, 10)
      : null,
    preferredTimeWindows: parsed.data.preferredTimeWindows ?? null,
    cleaningFrequency: parsed.data.cleaningFrequency ?? null,
  };

  if (
    leadData.fullName.length < 2 ||
    (leadData.leadType === "quote" &&
      (!leadData.phone ||
        !leadData.serviceAddress ||
        !leadData.serviceType ||
        !leadData.propertySize ||
        !leadData.specialRequests))
  ) {
    res.status(400).json({
      error:
        leadData.leadType === "quote"
          ? "Please include your contact details, service type, property size, and priority areas."
          : "Please enter your full name.",
    });
    return;
  }

  try {
    const [lead] = await db
      .insert(leadsTable)
      .values({
        leadType: leadData.leadType,
        fullName: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone,
        serviceAddress: leadData.serviceAddress,
        serviceType: leadData.serviceType,
        propertySize: leadData.propertySize,
        specialRequests: leadData.specialRequests,
        preferredDate: leadData.preferredDate,
        preferredTimeWindows: leadData.preferredTimeWindows,
        cleaningFrequency: leadData.cleaningFrequency,
      })
      .returning({
        id: leadsTable.id,
        leadType: leadsTable.leadType,
        fullName: leadsTable.fullName,
        email: leadsTable.email,
        phone: leadsTable.phone,
        serviceAddress: leadsTable.serviceAddress,
        serviceType: leadsTable.serviceType,
        propertySize: leadsTable.propertySize,
        specialRequests: leadsTable.specialRequests,
        preferredDate: leadsTable.preferredDate,
        preferredTimeWindows: leadsTable.preferredTimeWindows,
        cleaningFrequency: leadsTable.cleaningFrequency,
        createdAt: leadsTable.createdAt,
      });

    if (!lead) {
      throw new Error("Lead insert returned no row");
    }

    let notificationSent = false;
    try {
      const connectors = new ReplitConnectors();
      const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL;
      if (!notificationEmail) {
        throw new Error("LEAD_NOTIFICATION_EMAIL is not configured");
      }
      const notificationDetails = [
        `Name: ${lead.fullName}`,
        `Email: ${lead.email}`,
        lead.phone ? `Phone: ${lead.phone}` : null,
        lead.serviceAddress ? `Service address: ${lead.serviceAddress}` : null,
        lead.serviceType
          ? `Service type: ${SERVICE_TYPE_LABELS[lead.serviceType] ?? lead.serviceType}`
          : null,
        lead.propertySize
          ? `Property size: ${PROPERTY_SIZE_LABELS[lead.propertySize] ?? lead.propertySize}`
          : null,
        lead.specialRequests ? `Priority areas / special requests: ${lead.specialRequests}` : null,
        lead.preferredDate ? `Preferred date: ${lead.preferredDate}` : null,
        lead.preferredTimeWindows?.length
          ? `Preferred time window: ${lead.preferredTimeWindows.map((window) => TIME_WINDOW_LABELS[window] ?? window).join(", ")}`
          : null,
        lead.cleaningFrequency
          ? `Cleaning frequency: ${CLEANING_FREQUENCY_LABELS[lead.cleaningFrequency] ?? lead.cleaningFrequency}`
          : null,
        `Request: ${lead.leadType === "quote" ? "Quote request" : "Free cleaning checklist"}`,
        `Submitted: ${lead.createdAt.toISOString()}`,
      ]
        .filter(Boolean)
        .join("\n");
      const safeDetails = notificationDetails
        .split("\n")
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join("");

      const emailResponse = await connectors.proxy("resend", "/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL,
          to: [notificationEmail],
          reply_to: lead.email,
          subject: `New ${lead.leadType === "quote" ? "quote request" : "checklist request"} from ${lead.fullName}`,
          text: `A new website lead has arrived.\n\n${notificationDetails}`,
          html: `<h1>New website lead</h1>${safeDetails}`,
        }),
      });

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        req.log.error(
          { status: emailResponse.status, response: errorBody },
          "Resend rejected a lead notification",
        );
      } else {
        notificationSent = true;
      }
    } catch (error) {
      req.log.error({ err: error }, "Could not send lead notification");
    }

    await db
      .update(leadsTable)
      .set({ notificationSent })
      .where(eq(leadsTable.id, lead.id));

    res.status(201).json(
      CreateLeadResponse.parse({
        id: lead.id,
        leadType: lead.leadType,
        submittedAt: lead.createdAt,
        notificationSent,
        checklistUrl: lead.leadType === "checklist" ? CHECKLIST_URL : null,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Unable to save website lead");
    res.status(500).json({ error: "We couldn't save your request. Please try again." });
  }
});

export default router;
