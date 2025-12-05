// @ts-ignore - zeptomail package has type declaration issues
import { SendMailClient } from "zeptomail";

const ZEPTOMAIL_API_KEY = process.env.ZEPTOMAIL_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@schoolhouselogistics.com";
const ADMIN_TEMPLATE_KEY = process.env.ZEPTOMAIL_ADMIN_TEMPLATE_KEY;
const CUSTOMER_TEMPLATE_KEY = process.env.ZEPTOMAIL_CUSTOMER_TEMPLATE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@schoolhouselogistics.com";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization: string;
  organizationType?: string;
  inquiry?: string;
  message: string;
}

let client: any = null;

function getClient() {
  if (!ZEPTOMAIL_API_KEY) {
    console.warn("ZeptoMail API key not configured");
    return null;
  }
  if (!client) {
    client = new SendMailClient({
      url: "api.zeptomail.com/",
      token: ZEPTOMAIL_API_KEY,
    });
  }
  return client;
}

export async function sendContactFormEmails(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  const mailClient = getClient();
  
  if (!mailClient) {
    console.error("ZeptoMail client not available - API key not configured");
    return { success: false, error: "Email service not configured" };
  }

  if (!ADMIN_TEMPLATE_KEY || !CUSTOMER_TEMPLATE_KEY) {
    console.error("ZeptoMail template keys not configured");
    return { success: false, error: "Email templates not configured" };
  }

  const fullName = `${data.firstName} ${data.lastName}`;
  const submittedAt = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const mergeInfo = {
    first_name: data.firstName,
    last_name: data.lastName,
    full_name: fullName,
    email: data.email,
    phone: data.phone || "Not provided",
    organization: data.organization,
    organization_type: data.organizationType || "Not specified",
    inquiry_type: data.inquiry || "General Inquiry",
    message: data.message,
    submitted_at: submittedAt,
  };

  const results = { admin: false, customer: false };

  try {
    const adminResponse = await mailClient.sendMailWithTemplate({
      template_key: ADMIN_TEMPLATE_KEY,
      from: {
        address: FROM_EMAIL,
        name: "RepairRequest Contact Form",
      },
      to: [
        {
          email_address: {
            address: ADMIN_EMAIL,
            name: "RepairRequest Team",
          },
        },
      ],
      reply_to: [
        {
          address: data.email,
          name: fullName,
        },
      ],
      merge_info: mergeInfo,
    });
    console.log("Admin email sent successfully:", adminResponse);
    results.admin = true;
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
  }

  try {
    const customerResponse = await mailClient.sendMailWithTemplate({
      template_key: CUSTOMER_TEMPLATE_KEY,
      from: {
        address: FROM_EMAIL,
        name: "RepairRequest",
      },
      to: [
        {
          email_address: {
            address: data.email,
            name: fullName,
          },
        },
      ],
      merge_info: mergeInfo,
    });
    console.log("Customer confirmation email sent successfully:", customerResponse);
    results.customer = true;
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error);
  }

  if (results.admin || results.customer) {
    return { success: true };
  }

  return { success: false, error: "Failed to send both emails" };
}

export function isZeptoMailConfigured(): boolean {
  return !!(ZEPTOMAIL_API_KEY && ADMIN_TEMPLATE_KEY && CUSTOMER_TEMPLATE_KEY);
}
