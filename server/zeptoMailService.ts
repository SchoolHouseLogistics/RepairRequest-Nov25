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
    // Ensure the token has the correct format
    // ZeptoMail expects: "Zoho-enczapikey YOUR_KEY" or just the key if already prefixed
    let token = ZEPTOMAIL_API_KEY;
    if (!token.startsWith("Zoho-enczapikey")) {
      token = `Zoho-enczapikey ${token}`;
    }
    console.log("[ZEPTOMAIL] Token format check - starts with prefix:", token.startsWith("Zoho-enczapikey"));
    console.log("[ZEPTOMAIL] Token length:", token.length);
    
    client = new SendMailClient({
      url: "api.zeptomail.com/",
      token: token,
    });
  }
  return client;
}

export async function sendContactFormEmails(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  console.log("[ZEPTOMAIL] sendContactFormEmails called with data:", JSON.stringify(data, null, 2));
  console.log("[ZEPTOMAIL] Config check - API_KEY exists:", !!ZEPTOMAIL_API_KEY);
  console.log("[ZEPTOMAIL] Config check - ADMIN_TEMPLATE_KEY exists:", !!ADMIN_TEMPLATE_KEY);
  console.log("[ZEPTOMAIL] Config check - CUSTOMER_TEMPLATE_KEY exists:", !!CUSTOMER_TEMPLATE_KEY);
  console.log("[ZEPTOMAIL] Config check - FROM_EMAIL:", FROM_EMAIL);
  console.log("[ZEPTOMAIL] Config check - ADMIN_EMAIL:", ADMIN_EMAIL);
  
  const mailClient = getClient();
  
  if (!mailClient) {
    console.error("[ZEPTOMAIL] Client not available - API key not configured");
    return { success: false, error: "Email service not configured" };
  }

  if (!ADMIN_TEMPLATE_KEY || !CUSTOMER_TEMPLATE_KEY) {
    console.error("[ZEPTOMAIL] Template keys not configured");
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
    console.log("[ZEPTOMAIL] Sending admin email with template:", ADMIN_TEMPLATE_KEY);
    console.log("[ZEPTOMAIL] Admin email payload:", JSON.stringify({
      template_key: ADMIN_TEMPLATE_KEY,
      from: { address: FROM_EMAIL, name: "RepairRequest Contact Form" },
      to: [{ email_address: { address: ADMIN_EMAIL, name: "RepairRequest Team" } }],
      reply_to: [{ address: data.email, name: fullName }],
    }, null, 2));
    
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
    console.log("[ZEPTOMAIL] Admin email sent successfully:", JSON.stringify(adminResponse, null, 2));
    results.admin = true;
  } catch (error: any) {
    console.error("[ZEPTOMAIL] Failed to send admin notification email");
    console.error("[ZEPTOMAIL] Error code:", error?.error?.code);
    console.error("[ZEPTOMAIL] Error message:", error?.error?.message);
    console.error("[ZEPTOMAIL] Error details:", JSON.stringify(error?.error?.details, null, 2));
    console.error("[ZEPTOMAIL] Full error:", JSON.stringify(error, null, 2));
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

// Test function to send a simple email without template
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; error?: string; response?: any }> {
  const mailClient = getClient();
  
  if (!mailClient) {
    return { success: false, error: "Email service not configured" };
  }

  try {
    console.log("[ZEPTOMAIL TEST] Sending simple test email to:", toEmail);
    const response = await mailClient.sendMail({
      from: {
        address: FROM_EMAIL,
        name: "RepairRequest Test",
      },
      to: [
        {
          email_address: {
            address: toEmail,
            name: "Test Recipient",
          },
        },
      ],
      subject: "ZeptoMail Test - RepairRequest",
      htmlbody: "<h1>Test Email</h1><p>This is a test email from RepairRequest to verify ZeptoMail delivery.</p><p>If you received this, the email service is working correctly!</p>",
      textbody: "Test Email - This is a test email from RepairRequest to verify ZeptoMail delivery. If you received this, the email service is working correctly!",
    });
    console.log("[ZEPTOMAIL TEST] Response:", JSON.stringify(response, null, 2));
    return { success: true, response };
  } catch (error: any) {
    console.error("[ZEPTOMAIL TEST] Error:", JSON.stringify(error, null, 2));
    return { success: false, error: error?.error?.message || "Unknown error", response: error };
  }
}
