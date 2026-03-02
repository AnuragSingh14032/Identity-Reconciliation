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

  if (email) orConditions.push({ email });
  if (phoneNumber) orConditions.push({ phoneNumber });

  // ---------------------------------
  // 2️⃣ Fetch matching contacts
  // ---------------------------------
  let matchedContacts: Contact[] = await prisma.contact.findMany({
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
  // 4️⃣ STEP 7 — MERGE MULTIPLE PRIMARIES
  // ---------------------------------

  const primaryContacts = matchedContacts.filter(
    (contact) => contact.linkPrecedence === "primary"
  );

  if (primaryContacts.length > 1) {
    // Sort by createdAt (oldest first)
    primaryContacts.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );

    const oldest = primaryContacts[0];
    const others = primaryContacts.slice(1);

    for (const contact of others) {
      // Convert this primary → secondary
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkPrecedence: "secondary",
          linkedId: oldest.id,
        },
      });

      // Update its secondaries to point to oldest
      await prisma.contact.updateMany({
        where: { linkedId: contact.id },
        data: { linkedId: oldest.id },
      });
    }

    // Re-fetch after merge
    matchedContacts = await prisma.contact.findMany({
      where: {
        OR: [{ id: oldest.id }, { linkedId: oldest.id }],
      },
    });
  }

  // ---------------------------------
  // 5️⃣ Determine Primary
  // ---------------------------------
  const primary =
    matchedContacts.find(
      (contact) => contact.linkPrecedence === "primary"
    ) ?? matchedContacts[0]!;

  // ---------------------------------
  // 6️⃣ Create Secondary If New Info
  // ---------------------------------

  const emailExists = email
    ? matchedContacts.some((contact) => contact.email === email)
    : true;

  const phoneExists = phoneNumber
    ? matchedContacts.some((contact) => contact.phoneNumber === phoneNumber)
    : true;

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
  // 7️⃣ Re-fetch updated group
  // ---------------------------------
  const updatedContacts: Contact[] = await prisma.contact.findMany({
    where: {
      OR: [{ id: primary.id }, { linkedId: primary.id }],
    },
  });

  // ---------------------------------
  // 8️⃣ Consolidate Response
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