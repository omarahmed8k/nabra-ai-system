# Error Handler i18n Usage Guide

## Overview

The error handler now supports internationalization (i18n) for all error messages and toast notifications. All default values after `||` operators are now translatable.

## Updated Functions

All error and toast functions now accept an optional translation function parameter:

```typescript
type TranslateFn = (key: string) => string;
```

### Usage in Client Components

```tsx
"use client";

import { useTranslations } from "next-intl";
import { showError, showSuccess, showWarning, showInfo } from "@/lib/error-handler";

export function MyComponent() {
  const t = useTranslations();

  // Error handling with translation
  try {
    // ... some operation
  } catch (error) {
    showError(error, undefined, t); // Will use translated error messages
  }

  // Success toast with translation
  showSuccess("Operation completed", undefined, t);

  // Warning with custom title (translated)
  showWarning("Please review", undefined, t);

  // Info message
  showInfo("New feature available", undefined, t);
}
```

### Backward Compatibility

All functions still work without the translation parameter (falls back to English):

```typescript
// Old usage - still works, shows English
showError(error);
showSuccess("Done!");

// New usage - shows localized messages
showError(error, undefined, t);
showSuccess("Done!", undefined, t);
```

## Translation Keys

All error translations are stored under the `errors` namespace:

### Error Messages

- `errors.unauthorized` - "You need to be logged in..."
- `errors.forbidden` - "You don't have permission..."
- `errors.notFound` - "The requested resource was not found"
- `errors.badRequest` - "Invalid request. Please check your input."
- `errors.conflict` - "A conflict occurred. Please try again."
- `errors.internalError` - "An unexpected error occurred..."
- `errors.somethingWrong` - "Something went wrong"
- `errors.validationError` - "Validation error occurred"
- `errors.networkError` - "Unable to connect to the server..."
- `errors.unexpectedError` - "An unexpected error occurred"
- `errors.invalidValue` - "Invalid value"

### Toast Titles

- `errors.titles.error` - "Error"
- `errors.titles.success` - "Success"
- `errors.titles.info` - "Info"
- `errors.titles.warning` - "Warning"

## Example: Complete Component

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/lib/trpc/client";
import { showError, showSuccess } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";

export function DeleteButton({ itemId }: { itemId: string }) {
  const t = useTranslations();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = trpc.item.delete.useMutation({
    onSuccess: () => {
      showSuccess(t("item.deleteSuccess"), undefined, t);
    },
    onError: (error) => {
      showError(error, undefined, t); // Automatically shows localized error
    },
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: itemId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button onClick={handleDelete} disabled={isDeleting}>
      {t("common.delete")}
    </Button>
  );
}
```

## Benefits

1. **Automatic error translation** - All tRPC errors, Zod validation errors, and network errors are translated
2. **Consistent UX** - Users see error messages in their preferred language
3. **Backward compatible** - Existing code continues to work without changes
4. **Easy to adopt** - Just pass the `t` function from `useTranslations()`

## Migration Guide

To migrate existing components:

1. Add `const t = useTranslations();` at the top of your component
2. Pass `t` as the third parameter to error/toast functions
3. That's it! All default messages will automatically be translated

```typescript
// Before
showError(error);
showSuccess("Operation completed");

// After
const t = useTranslations();
showError(error, undefined, t);
showSuccess("Operation completed", undefined, t);
```
