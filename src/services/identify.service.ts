import prisma from "../prisma/client";
import { Contact } from "@prisma/client";

export const identifyService = async (
  email?: string,
  phoneNumber?: string
) => {
  if (!email && !phoneNumber) {
    throw new Error("At least one of email or phoneNumber is required");
  }

  // ---------------------------------
  // 1️⃣ Build dynamic OR conditions
  // ---------------------------------
  const orConditions: Array<{ email?: string; phoneNumber?: string }> = [];

  if (email) {
    orConditions.push({ email });
  }

  if (phoneNumber) {
    orConditions.push({ phoneNumber });
  }

  // ---------------------------------
  // 2️⃣ Fetch matching contacts
  // ---------------------------------
  const matchedContacts: Contact[] = await prisma.contact.findMany({
    where: {
      OR: orConditions,
    },
  });

  // ---------------------------------
  // 3️⃣ CASE 1: No contact found
  // ---------------------------------
  if (matchedContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: "primary",
      },
    });

    return {
      contact: {
        primaryContactId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber
          ? [newContact.phoneNumber]
          : [],
        secondaryContactIds: [],
      },
    };
  }

  // ---------------------------------
  // 4️⃣ CASE 2: Contact exists
  // ---------------------------------

  // Determine primary contact
  const primary =
    matchedContacts.find(
      (contact) => contact.linkPrecedence === "primary"
    ) ?? matchedContacts[0]!;

  // Check if incoming data already exists
  const emailExists = email
    ? matchedContacts.some((contact) => contact.email === email)
    : true;

  const phoneExists = phoneNumber
    ? matchedContacts.some((contact) => contact.phoneNumber === phoneNumber)
    : true;

  // If either email or phone is new → create secondary
  if (!emailExists || !phoneExists) {
    await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkedId: primary.id,
        linkPrecedence: "secondary",
      },
    });
  }

  // ---------------------------------
  // 5️⃣ Re-fetch updated contact group
  // ---------------------------------
  const updatedContacts: Contact[] = await prisma.contact.findMany({
    where: {
      OR: [{ id: primary.id }, { linkedId: primary.id }],
    },
  });

  // ---------------------------------
  // 6️⃣ Consolidate response
  // ---------------------------------
  const emails = Array.from(
    new Set(
      updatedContacts
        .map((contact) => contact.email)
        .filter((email): email is string => Boolean(email))
    )
  );

  const phoneNumbers = Array.from(
    new Set(
      updatedContacts
        .map((contact) => contact.phoneNumber)
        .filter((phone): phone is string => Boolean(phone))
    )
  );

  const secondaryContactIds = updatedContacts
    .filter((contact) => contact.linkPrecedence === "secondary")
    .map((contact) => contact.id);

  return {
    contact: {
      primaryContactId: primary.id,
      emails,
      phoneNumbers,
      secondaryContactIds,
    },
  };
};