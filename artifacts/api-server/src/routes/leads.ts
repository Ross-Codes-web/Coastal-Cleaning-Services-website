import { ReplitConnectors } from "@replit/connectors-sdk";
import { CreateLeadBody, CreateLeadResponse } from "@workspace/api-zod";
import { db, leadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();
const CHECKLIST_URL = "/checklist";
const DEFAULT_FROM_EMAIL = "Coastal Cleaning Services <onboarding@resend.dev>";

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
  };

  if (
    leadData.fullName.length < 2 ||
    (leadData.leadType === "quote" &&
      (!leadData.phone || !leadData.serviceAddress))
  ) {
    res.status(400).json({
      error:
        leadData.leadType === "quote"
          ? "Please include your phone number and service address."
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
      })
      .returning({
        id: leadsTable.id,
        leadType: leadsTable.leadType,
        fullName: leadsTable.fullName,
        email: leadsTable.email,
        phone: leadsTable.phone,
        serviceAddress: leadsTable.serviceAddress,
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
