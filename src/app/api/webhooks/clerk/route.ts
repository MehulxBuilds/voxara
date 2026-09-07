import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

function getOrganizationRole(role: string) {
    return role === "org:admin" ? "ADMIN" : "MEMBER";
}

function getPrimaryEmail(data: {
    primary_email_address_id: string | null;
    email_addresses: Array<{ id: string; email_address: string }>;
}) {
    const primaryEmail = data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
    );

    return primaryEmail?.email_address ?? data.email_addresses[0]?.email_address;
}

export async function POST(request: NextRequest) {
    let event;

    try {
        event = await verifyWebhook(request, {
            signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET,
        });
    } catch (error) {
        console.error("Failed to verify Clerk webhook", error);
        return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "session.created": {
                if(event.data.user?.email_addresses.length === 0 || !event.data.user?.email_addresses[0]?.email_address) {
                    throw new Error(`Clerk user ${event.data.user_id} has no email address`);
                }

                await prisma.user.upsert({
                    where: { id: event.data.user_id },
                    create: {
                        id: event.data.user_id,
                        email: event.data.user.email_addresses[0].email_address,
                    },
                    update: { email: event.data.user.email_addresses[0].email_address },
                });
                break;
            }

            case "user.created":
            case "user.updated": {
                const email = getPrimaryEmail(event.data);

                if (!email) {
                    throw new Error(`Clerk user ${event.data.id} has no email address`);
                }

                await prisma.user.upsert({
                    where: { id: event.data.id },
                    create: {
                        id: event.data.id,
                        email,
                    },
                    update: { email },
                });
                break;
            }

            case "user.deleted":
                if (event.data.id) {
                    await prisma.user.deleteMany({
                        where: { id: event.data.id },
                    });
                }
                break;

            case "organization.created":
            case "organization.updated":
                await prisma.organization.upsert({
                    where: { id: event.data.id },
                    create: {
                        id: event.data.id,
                        name: event.data.name,
                    },
                    update: { name: event.data.name },
                });
                break;

            case "organization.deleted":
                if (event.data.id) {
                    await prisma.organization.deleteMany({
                        where: { id: event.data.id },
                    });
                }
                break;

            case "organizationMembership.created":
            case "organizationMembership.updated":
                await prisma.organizationUser.upsert({
                    where: { id: event.data.id },
                    create: {
                        id: event.data.id,
                        orgId: event.data.organization.id,
                        userId: event.data.public_user_data.user_id,
                        role: getOrganizationRole(event.data.role),
                    },
                    update: {
                        orgId: event.data.organization.id,
                        userId: event.data.public_user_data.user_id,
                        role: getOrganizationRole(event.data.role),
                    },
                });
                break;

            case "organizationMembership.deleted":
                await prisma.organizationUser.deleteMany({
                    where: { id: event.data.id },
                });
                break;

            default:
                return Response.json({ received: true, ignored: true });
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error(`Failed to process Clerk webhook ${event.type}`, error);
        return Response.json(
            { error: "Failed to process webhook" },
            { status: 500 },
        );
    }
}
