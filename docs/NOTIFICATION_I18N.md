# Notification System with i18n Support

## Overview

The notification system has been updated to support internationalization (i18n) for all notification types. Notifications can now be sent in both English (en) and Arabic (ar) languages.

## Features

- ✅ **Email notifications** in user's preferred language
- ✅ **In-app notifications** with i18n support
- ✅ **WhatsApp notifications** with language-specific templates
- ✅ **Server-side translations** for all notification types

## Supported Notification Types

1. **New Message** - When a user receives a new message
2. **Status Change** - When a request status is updated
3. **Assignment** - When a provider is assigned to a request
4. **Subscription Expiring** - Warning before subscription expires
5. **Subscription Expired** - When a subscription has expired
6. **Welcome Email** - Sent when a new user registers
7. **Payment Verification** - Admin notification for new payment proofs

## Usage

### Basic Usage with tRPC Context

All notification functions now accept an optional `locale` parameter. When called from a tRPC procedure, you can use the locale from the context:

```typescript
import { notifyNewMessage } from "@/lib/notifications";

// Inside a tRPC procedure
await notifyNewMessage({
  requestId: "request-id",
  senderName: "John Doe",
  recipientId: "user-id",
  messagePreview: "Hello, how are you?",
  locale: ctx.locale, // Get locale from tRPC context
});
```

### Available Notification Functions

#### 1. Notify New Message

```typescript
await notifyNewMessage({
  requestId: string,
  senderName: string,
  recipientId: string,
  messagePreview: string,
  locale?: string, // defaults to "en"
});
```

#### 2. Notify Status Change

```typescript
await notifyStatusChange({
  requestId: string,
  userId: string,
  oldStatus: string,
  newStatus: string,
  locale?: string, // defaults to "en"
});
```

#### 3. Notify Provider Assignment

```typescript
await notifyProviderAssignment({
  requestId: string,
  providerId: string,
  providerName: string,
  locale?: string, // defaults to "en"
});
```

#### 4. Notify Subscription Expiring

```typescript
await notifySubscriptionExpiring({
  userId: string,
  packageName: string,
  daysRemaining: number,
  remainingCredits: number,
  locale?: string, // defaults to "en"
});
```

#### 5. Notify Subscription Expired

```typescript
await notifySubscriptionExpired({
  userId: string,
  packageName: string,
  locale?: string, // defaults to "en"
});
```

#### 6. Send Welcome Email

```typescript
await sendWelcomeEmail({
  userId: string,
  userName: string,
  userEmail: string,
  userRole: string,
  locale?: string, // defaults to "en"
});
```

#### 7. Notify Admins New Pending Payment

```typescript
await notifyAdminsNewPendingPayment({
  clientNameOrEmail: string,
  amount: number,
  currency: string,
  locale?: string, // defaults to "en"
});
```

## Translation Structure

All notification translations are stored in:

- `/messages/en.json` - English translations
- `/messages/ar.json` - Arabic translations

### Example Translation Keys

```json
{
  "notifications": {
    "newMessage": {
      "title": "New message from {senderName}",
      "message": "{messagePreview}",
      "emailSubject": "New message from {senderName}",
      "emailBody": {
        "heading": "New Message Received",
        "intro": "<strong>{senderName}</strong> sent you a message...",
        "viewButton": "View Message"
      }
    }
  }
}
```

### Adding New Translations

To add new notification translations:

1. Add the English translation to `/messages/en.json`
2. Add the Arabic translation to `/messages/ar.json`
3. Use the `getTranslation()` helper to retrieve translations in your code

```typescript
import { getTranslation } from "@/lib/notifications/i18n-helper";

const title = await getTranslation(locale, "notifications.newType.title", { userName: "John" });
```

## WhatsApp Integration

WhatsApp notifications automatically use the correct language code:

- `en` → `en_US`
- `ar` → `ar`

Configure WhatsApp templates in Meta Business Manager for each language.

## Future Enhancements

### Adding User Preferred Language

To store user language preferences in the database:

1. Add `preferredLanguage` field to the User model in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields
  preferredLanguage String @default("en")
}
```

2. Run migration:

```bash
npx prisma migrate dev --name add_user_preferred_language
```

3. Update `getUserLocale()` in `/src/lib/notifications/i18n-helper.ts`:

```typescript
export async function getUserLocale(userId?: string | null): Promise<string> {
  if (!userId) {
    return "en";
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferredLanguage: true },
  });

  return user?.preferredLanguage || "en";
}
```

4. Update notification calls to fetch user locale:

```typescript
const locale = await getUserLocale(userId);
await notifyNewMessage({
  // ... params
  locale,
});
```

## Troubleshooting

### Notifications Still in English

1. **Check locale is passed**: Ensure you're passing the `locale` parameter
2. **Check translations exist**: Verify translations in `/messages/{locale}.json`
3. **Check cookie**: Ensure `NEXT_LOCALE` cookie is set correctly
4. **Check context**: Verify tRPC context includes locale

### Email Templates Not Translated

Email templates use the `locale` parameter. If not provided, they default to English. Always pass the locale:

```typescript
const emailTemplate = await getWelcomeEmailTemplate(
  userName,
  userRole,
  locale // Make sure this is passed
);
```

## Testing

To test notifications in different languages:

1. **Switch language** in the UI using the language switcher
2. **Trigger a notification** (e.g., send a message, change status)
3. **Check email and in-app notifications** for correct language

### Manual Testing with API

You can test by manually setting the locale:

```typescript
// Force Arabic notifications
await notifyNewMessage({
  requestId: "test-request",
  senderName: "أحمد",
  recipientId: "user-id",
  messagePreview: "مرحباً",
  locale: "ar",
});
```

## Best Practices

1. **Always pass locale** from context when available
2. **Use placeholder values** in translations: `{userName}`, `{requestTitle}`
3. **Keep translations consistent** across email and in-app notifications
4. **Test both languages** when adding new notification types
5. **Consider RTL layout** for Arabic emails (already handled in templates)

## References

- Notification System: `/src/lib/notifications/`
- Translation Files: `/messages/*.json`
- i18n Helper: `/src/lib/notifications/i18n-helper.ts`
- tRPC Context: `/src/server/trpc.ts`
