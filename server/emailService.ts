// @ts-ignore - zeptomail package has type declaration issues
import { SendMailClient } from "zeptomail";

const ZEPTOMAIL_API_KEY = process.env.ZEPTOMAIL_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@schoolhouselogistics.com";

// Building/Repair request templates
const REQUESTER_TEMPLATE_KEY = process.env.ZEPTOMAIL_REQUESTER_TEMPLATE_KEY;
const ADMIN_NOTIFICATION_TEMPLATE_KEY = process.env.ZEPTOMAIL_ADMIN_NOTIFICATION_TEMPLATE_KEY;

// Labor request templates (separate from building requests)
const LABOR_REQUESTER_TEMPLATE_KEY = process.env.ZEPTOMAIL_LABOR_REQUESTER_TEMPLATE_KEY;
const LABOR_ADMIN_TEMPLATE_KEY = process.env.ZEPTOMAIL_LABOR_ADMIN_TEMPLATE_KEY;

let client: any = null;

function getClient() {
  if (!ZEPTOMAIL_API_KEY) {
    console.warn("ZeptoMail API key not configured - email notifications will be disabled");
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

export function isRequestEmailConfigured(): boolean {
  return !!(ZEPTOMAIL_API_KEY && REQUESTER_TEMPLATE_KEY && ADMIN_NOTIFICATION_TEMPLATE_KEY);
}

export function isLaborEmailConfigured(): boolean {
  return !!(ZEPTOMAIL_API_KEY && LABOR_REQUESTER_TEMPLATE_KEY && LABOR_ADMIN_TEMPLATE_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

interface RequestEmailData {
  requestId: number;
  requestType: 'facility' | 'building';
  title: string;
  description: string;
  priority: string;
  location?: string;
  building?: string;
  roomNumber?: string;
  requesterName: string;
  requesterEmail: string;
  organizationName: string;
  createdAt: Date;
}

interface LaborRequestEmailData {
  requestId: number;
  title: string;
  facility: string;
  dateReported: string;
  dateNeeded: string;
  priority: string;
  setupTime: string;
  startTime: string;
  endTime: string;
  selectedItems: string[];
  otherNeeds: string;
  requesterName: string;
  requesterEmail: string;
  organizationName: string;
  createdAt: Date;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  const mailClient = getClient();
  
  if (!mailClient) {
    console.error("ZeptoMail client not available - API key not configured");
    return false;
  }

  try {
    console.log('Attempting to send email:', {
      to: params.to,
      from: params.from,
      subject: params.subject
    });
    
    await mailClient.sendMail({
      from: {
        address: params.from,
        name: "RepairRequest",
      },
      to: [
        {
          email_address: {
            address: params.to,
            name: params.to,
          },
        },
      ],
      subject: params.subject,
      textbody: params.text,
      htmlbody: params.html,
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('ZeptoMail email error:', error);
    return false;
  }
}

export async function sendRequestNotificationEmails(
  requestData: RequestEmailData,
  adminEmails: string[]
): Promise<void> {
  console.log('=== BUILDING REQUEST EMAIL NOTIFICATION CALLED ===');
  console.log('Request data:', JSON.stringify(requestData, null, 2));
  console.log('Admin emails:', adminEmails);
  console.log('ZeptoMail API key exists:', !!ZEPTOMAIL_API_KEY);
  console.log('Requester template key exists:', !!REQUESTER_TEMPLATE_KEY);
  console.log('Admin notification template key exists:', !!ADMIN_NOTIFICATION_TEMPLATE_KEY);

  const mailClient = getClient();
  
  if (!mailClient) {
    console.error("ZeptoMail client not available - skipping email notifications");
    return;
  }

  if (!REQUESTER_TEMPLATE_KEY || !ADMIN_NOTIFICATION_TEMPLATE_KEY) {
    console.error("ZeptoMail building request template keys not configured - skipping email notifications");
    return;
  }

  const submittedAt = requestData.createdAt.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const locationInfo = requestData.requestType === 'building' 
    ? `${requestData.building || 'N/A'}${requestData.roomNumber ? `, Room ${requestData.roomNumber}` : ''}`
    : requestData.location || 'N/A';

  const mergeInfo = {
    request_id: String(requestData.requestId),
    request_type: requestData.requestType,
    request_type_title: requestData.requestType.charAt(0).toUpperCase() + requestData.requestType.slice(1),
    title: requestData.title,
    description: requestData.description,
    priority: requestData.priority,
    priority_upper: requestData.priority.toUpperCase(),
    location: requestData.location || 'N/A',
    building: requestData.building || 'N/A',
    room_number: requestData.roomNumber || 'N/A',
    location_info: locationInfo,
    requester_name: requestData.requesterName,
    requester_email: requestData.requesterEmail,
    organization_name: requestData.organizationName,
    submitted_at: submittedAt,
    submitted_date: requestData.createdAt.toLocaleDateString(),
    submitted_time: requestData.createdAt.toLocaleTimeString(),
  };

  console.log('Merge info prepared:', JSON.stringify(mergeInfo, null, 2));

  let requesterEmailSent = false;
  let adminEmailsSent = 0;

  try {
    console.log('Sending requester notification to:', requestData.requesterEmail);
    await mailClient.sendMailWithTemplate({
      template_key: REQUESTER_TEMPLATE_KEY,
      from: {
        address: FROM_EMAIL,
        name: "RepairRequest Notifications",
      },
      to: [
        {
          email_address: {
            address: requestData.requesterEmail,
            name: requestData.requesterName,
          },
        },
      ],
      merge_info: mergeInfo,
    });
    console.log('Requester notification sent successfully');
    requesterEmailSent = true;
  } catch (error) {
    console.error('Failed to send requester notification email:', error);
  }

  for (const adminEmail of adminEmails) {
    try {
      console.log('Sending admin notification to:', adminEmail);
      await mailClient.sendMailWithTemplate({
        template_key: ADMIN_NOTIFICATION_TEMPLATE_KEY,
        from: {
          address: FROM_EMAIL,
          name: "RepairRequest Notifications",
        },
        to: [
          {
            email_address: {
              address: adminEmail,
              name: "Administrator",
            },
          },
        ],
        reply_to: [
          {
            address: requestData.requesterEmail,
            name: requestData.requesterName,
          },
        ],
        merge_info: mergeInfo,
      });
      console.log(`Admin notification sent to ${adminEmail}`);
      adminEmailsSent++;
    } catch (error) {
      console.error(`Failed to send admin notification to ${adminEmail}:`, error);
    }
  }

  console.log(`Request notification summary for #${requestData.requestId}:`);
  console.log(`- Requester email sent: ${requesterEmailSent}`);
  console.log(`- Admin emails sent: ${adminEmailsSent}/${adminEmails.length}`);

  if (!requesterEmailSent && adminEmailsSent === 0) {
    throw new Error('Failed to send any notification emails');
  }
}

export async function sendLaborRequestNotificationEmails(
  requestData: LaborRequestEmailData,
  adminEmails: string[]
): Promise<void> {
  console.log('=== LABOR REQUEST EMAIL NOTIFICATION CALLED ===');
  console.log('Request data:', JSON.stringify(requestData, null, 2));
  console.log('Admin emails:', adminEmails);
  console.log('ZeptoMail API key exists:', !!ZEPTOMAIL_API_KEY);
  console.log('Labor requester template key exists:', !!LABOR_REQUESTER_TEMPLATE_KEY);
  console.log('Labor admin template key exists:', !!LABOR_ADMIN_TEMPLATE_KEY);

  const mailClient = getClient();
  
  if (!mailClient) {
    console.error("ZeptoMail client not available - skipping labor email notifications");
    return;
  }

  if (!LABOR_REQUESTER_TEMPLATE_KEY || !LABOR_ADMIN_TEMPLATE_KEY) {
    console.error("ZeptoMail labor request template keys not configured - skipping email notifications");
    console.log("To enable labor request emails, please add ZEPTOMAIL_LABOR_REQUESTER_TEMPLATE_KEY and ZEPTOMAIL_LABOR_ADMIN_TEMPLATE_KEY to your secrets");
    return;
  }

  const submittedAt = requestData.createdAt.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  // Format date needed for display
  const dateNeededFormatted = requestData.dateNeeded 
    ? new Date(requestData.dateNeeded).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : 'Not specified';

  // Format items list
  const itemsList = requestData.selectedItems && requestData.selectedItems.length > 0
    ? requestData.selectedItems.join(", ")
    : 'None selected';

  const mergeInfo = {
    request_id: String(requestData.requestId),
    request_type: 'labor',
    request_type_title: 'Labor',
    title: requestData.title || 'Untitled Event',
    facility: requestData.facility || 'N/A',
    date_reported: requestData.dateReported || requestData.createdAt.toLocaleDateString(),
    date_needed: dateNeededFormatted,
    date_needed_raw: requestData.dateNeeded || '',
    priority: requestData.priority || 'medium',
    priority_upper: (requestData.priority || 'medium').toUpperCase(),
    setup_time: requestData.setupTime || 'Not specified',
    start_time: requestData.startTime || 'Not specified',
    end_time: requestData.endTime || 'Not specified',
    selected_items: itemsList,
    items_count: String(requestData.selectedItems?.length || 0),
    other_needs: requestData.otherNeeds || 'None',
    requester_name: requestData.requesterName,
    requester_email: requestData.requesterEmail,
    organization_name: requestData.organizationName,
    submitted_at: submittedAt,
    submitted_date: requestData.createdAt.toLocaleDateString(),
    submitted_time: requestData.createdAt.toLocaleTimeString(),
  };

  console.log('Labor merge info prepared:', JSON.stringify(mergeInfo, null, 2));

  let requesterEmailSent = false;
  let adminEmailsSent = 0;

  try {
    console.log('Sending labor requester notification to:', requestData.requesterEmail);
    await mailClient.sendMailWithTemplate({
      template_key: LABOR_REQUESTER_TEMPLATE_KEY,
      from: {
        address: FROM_EMAIL,
        name: "RepairRequest Notifications",
      },
      to: [
        {
          email_address: {
            address: requestData.requesterEmail,
            name: requestData.requesterName,
          },
        },
      ],
      merge_info: mergeInfo,
    });
    console.log('Labor requester notification sent successfully');
    requesterEmailSent = true;
  } catch (error) {
    console.error('Failed to send labor requester notification email:', error);
  }

  for (const adminEmail of adminEmails) {
    try {
      console.log('Sending labor admin notification to:', adminEmail);
      await mailClient.sendMailWithTemplate({
        template_key: LABOR_ADMIN_TEMPLATE_KEY,
        from: {
          address: FROM_EMAIL,
          name: "RepairRequest Notifications",
        },
        to: [
          {
            email_address: {
              address: adminEmail,
              name: "Administrator",
            },
          },
        ],
        reply_to: [
          {
            address: requestData.requesterEmail,
            name: requestData.requesterName,
          },
        ],
        merge_info: mergeInfo,
      });
      console.log(`Labor admin notification sent to ${adminEmail}`);
      adminEmailsSent++;
    } catch (error) {
      console.error(`Failed to send labor admin notification to ${adminEmail}:`, error);
    }
  }

  console.log(`Labor request notification summary for #${requestData.requestId}:`);
  console.log(`- Requester email sent: ${requesterEmailSent}`);
  console.log(`- Admin emails sent: ${adminEmailsSent}/${adminEmails.length}`);

  if (!requesterEmailSent && adminEmailsSent === 0) {
    throw new Error('Failed to send any labor notification emails');
  }
}
