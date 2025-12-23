/**
 * Service Attributes Validation Utilities
 * Helper functions to validate client responses against service Q&A attributes
 */

import { ServiceAttribute, AttributeResponse } from "@/types/service-attributes";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates client responses against service attributes
 * @param attributes - The service's Q&A attributes
 * @param responses - The client's answers
 * @returns Validation result with errors if any
 */
export function validateAttributeResponses(
  attributes: ServiceAttribute[],
  responses: AttributeResponse[]
): ValidationResult {
  if (!attributes || attributes.length === 0) {
    return { valid: true, errors: [] };
  }

  const responseMap = new Map(responses.map((r) => [r.question, r.answer]));

  const errors = attributes
    .map((attribute) => validateSingleAttribute(attribute, responseMap))
    .filter((error): error is string => error !== null);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a single attribute response
 */
function validateSingleAttribute(
  attribute: ServiceAttribute,
  responseMap: Map<string, string | string[]>
): string | null {
  const answer = responseMap.get(attribute.question);

  // Check required fields
  if (isRequiredFieldMissing(attribute, answer)) {
    return `"${attribute.question}" is required`;
  }

  // Skip validation if not required and no answer provided
  if (!answer) return null;

  // Validate based on type
  return validateByType(attribute, answer);
}

/**
 * Checks if a required field is missing
 */
function isRequiredFieldMissing(
  attribute: ServiceAttribute,
  answer: string | string[] | undefined
): boolean {
  if (!attribute.required) return false;
  if (!answer) return true;
  if (Array.isArray(answer) && answer.length === 0) return true;
  return false;
}

/**
 * Validates answer based on attribute type
 */
function validateByType(attribute: ServiceAttribute, answer: string | string[]): string | null {
  switch (attribute.type) {
    case "select":
      return validateSelectType(attribute, answer);
    case "multiselect":
      return validateMultiselectType(attribute, answer);
    case "number":
      return validateNumberType(attribute, answer);
    case "text":
    case "textarea":
      return validateTextType(attribute, answer);
    default:
      return null;
  }
}

/**
 * Validates select type attribute
 */
function validateSelectType(attribute: ServiceAttribute, answer: string | string[]): string | null {
  if (attribute.options && !attribute.options.includes(answer as string)) {
    return `"${attribute.question}" must be one of: ${attribute.options.join(", ")}`;
  }
  return null;
}

/**
 * Validates multiselect type attribute
 */
function validateMultiselectType(
  attribute: ServiceAttribute,
  answer: string | string[]
): string | null {
  if (!Array.isArray(answer)) {
    return `"${attribute.question}" must be an array`;
  }

  if (attribute.options) {
    const invalidOptions = answer.filter((opt) => !attribute.options?.includes(opt));
    if (invalidOptions.length > 0) {
      return `"${attribute.question}" contains invalid options: ${invalidOptions.join(", ")}`;
    }
  }

  return null;
}

/**
 * Validates number type attribute
 */
function validateNumberType(attribute: ServiceAttribute, answer: string | string[]): string | null {
  if (typeof answer !== "string") {
    return `"${attribute.question}" must be a number`;
  }

  const numValue = Number.parseFloat(answer);
  if (Number.isNaN(numValue)) {
    return `"${attribute.question}" must be a valid number`;
  }

  if (attribute.min !== undefined && numValue < attribute.min) {
    return `"${attribute.question}" must be at least ${attribute.min}`;
  }

  if (attribute.max !== undefined && numValue > attribute.max) {
    return `"${attribute.question}" must be at most ${attribute.max}`;
  }

  return null;
}

/**
 * Validates text/textarea type attribute
 */
function validateTextType(attribute: ServiceAttribute, answer: string | string[]): string | null {
  if (typeof answer !== "string") {
    return `"${attribute.question}" must be a string`;
  }
  if (answer.trim().length === 0) {
    return `"${attribute.question}" cannot be empty`;
  }
  return null;
}

/**
 * Formats attribute responses for display
 * @param responses - The client's answers
 * @returns Formatted string for display
 */
export function formatAttributeResponses(responses: AttributeResponse[]): string {
  if (!responses || responses.length === 0) {
    return "No additional information provided";
  }

  return responses
    .map((r) => {
      const answer = Array.isArray(r.answer) ? r.answer.join(", ") : r.answer;
      return `**${r.question}**\n${answer}`;
    })
    .join("\n\n");
}

/**
 * Calculates additional credits from attribute responses
 *
 * Logic:
 * - For select/number inputs: additionalCredits = selectedValue × creditImpact
 *   Example: User selects "2" segments with creditImpact: 5 → 2 × 5 = 10 credits
 *
 * - For inputs with includedQuantity: additionalCredits = max(0, selectedValue - includedQuantity) × creditImpact
 *   Example: 25 products with includedQuantity: 20 and creditImpact: 1 → (25-20) × 1 = 5 credits
 *
 * @param attributes - The service's Q&A attributes
 * @param responses - The client's answers
 * @returns Total additional credits from all attributes
 */
export function calculateAttributeCredits(
  attributes: ServiceAttribute[],
  responses: AttributeResponse[]
): number {
  if (!attributes || attributes.length === 0 || !responses || responses.length === 0) {
    return 0;
  }

  const responseMap = new Map(responses.map((r) => [r.question, r.answer]));

  let totalAdditionalCredits = 0;

  for (const attribute of attributes) {
    // Skip if no credit impact defined
    if (!attribute.creditImpact || attribute.creditImpact === 0) {
      continue;
    }

    const answer = responseMap.get(attribute.question);
    if (!answer) {
      continue;
    }

    // Calculate credits based on attribute type
    const credits = calculateSingleAttributeCredits(attribute, answer);
    totalAdditionalCredits += credits;
  }

  return totalAdditionalCredits;
}

/**
 * Breaks down additional credits per attribute
 */
export function calculateAttributeCreditBreakdown(
  attributes: ServiceAttribute[],
  responses: AttributeResponse[]
): Array<{ question: string; answer: string | string[]; cost: number }> {
  if (!attributes || attributes.length === 0 || !responses || responses.length === 0) {
    return [];
  }

  const responseMap = new Map(responses.map((r) => [r.question, r.answer]));

  const items: Array<{ question: string; answer: string | string[]; cost: number }> = [];

  for (const attribute of attributes) {
    if (!attribute.creditImpact || attribute.creditImpact === 0) continue;
    const answer = responseMap.get(attribute.question);
    if (!answer) continue;

    const cost = (() => {
      if (Array.isArray(answer)) return 0;
      const numericValue = Number.parseFloat(answer);
      if (Number.isNaN(numericValue)) return 0;
      const impact = attribute.creditImpact || 0;
      if (attribute.includedQuantity !== undefined) {
        const excess = Math.max(0, numericValue - attribute.includedQuantity);
        return excess * impact;
      }
      return numericValue * impact;
    })();

    if (cost > 0) {
      items.push({ question: attribute.question, answer, cost });
    }
  }

  return items;
}

/**
 * Calculates credits for a single attribute
 */
function calculateSingleAttributeCredits(
  attribute: ServiceAttribute,
  answer: string | string[]
): number {
  // Only process numeric values (for select/number types)
  if (Array.isArray(answer)) {
    return 0; // Multiselect doesn't support credit impact yet
  }

  const numericValue = Number.parseFloat(answer);
  if (Number.isNaN(numericValue)) {
    return 0; // Non-numeric values don't incur additional costs
  }

  const creditImpact = attribute.creditImpact || 0;

  // If includedQuantity is defined, only charge for excess
  if (attribute.includedQuantity !== undefined) {
    const excess = Math.max(0, numericValue - attribute.includedQuantity);
    return excess * creditImpact;
  }

  // Otherwise, charge for the full value
  return numericValue * creditImpact;
}
