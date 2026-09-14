const ADMIN_WHATSAPP = "2349155856826";
export const OFFICIAL_WA_LINK = "https://wa.link/wx16gs";

function buildUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function whatsappLink(message?: string): string {
  if (!message) return OFFICIAL_WA_LINK;
  return buildUrl(ADMIN_WHATSAPP, message);
}

export const whatsappMessages = {
  accommodationInquiry: (title: string, price: string) =>
    `Hello Campus Guide! I am interested in this accommodation listing:\n\n• Property: ${title}\n• Price: ${price}\n\nI would like to schedule an in-person inspection. Please guide me on the next steps.`,

  accommodationListing: () =>
    `Hello Campus Guide! I am a landlord / student agent and I would like to list accommodation on the Campus Guide platform. Please share the onboarding requirements.`,

  eventTicketInquiry: (eventTitle: string) =>
    `Hello Campus Guide! I have an inquiry regarding the event "${eventTitle}". Could you please provide more details?`,

  postUtmeHelp: () =>
    `Hello Campus Guide! I need assistance with UNIPORT Post-UTME preparation, past questions, and CBT practice tests. Please help me get started.`,

  aspirantService: (service: string) =>
    `Hello Campus Guide! I would like assistance with: ${service}.\n\nPlease guide me through the requirements and process.`,

  freshersHelp: () =>
    `Hello Campus Guide! I am a newly admitted student and I need guidance with UNIPORT acceptance fees, document verification, and physical clearance.`,

  pageantInquiry: () =>
    `Hello Campus Guide! I have an inquiry regarding Face of Campus Guide (F.O.C.G) pageantry, registration, or student voting.`,

  generalInquiry: () =>
    `Hello Campus Guide! I have a question about UNIPORT admissions, campus life, and student services. Could you please help me?`,

  organizeEvent: () =>
    `Hello Campus Guide! I am an event organizer and I would like to list an event and sell tickets on the Campus Guide platform. Please share the details.`,

  askQuestionSupport: (question: string) =>
    `Hello Campus Guide! I asked a question on the portal: "${question}". Could you please assist me with an answer?`,
};

