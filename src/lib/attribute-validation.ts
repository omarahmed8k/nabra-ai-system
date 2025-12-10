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

  const responseMap = new Map(
    responses.map((r) => [r.question, r.answer])
  );

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
function validateByType(
  attribute: ServiceAttribute,
  answer: string | string[]
): string | null {
  switch (attribute.type) {
    case "select":
      return validateSelectType(attribute, answer);
    case "multiselect":
      return validateMultiselectType(attribute, answer);
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
function validateSelectType(
  attribute: ServiceAttribute,
  answer: string | string[]
): string | null {
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
    const invalidOptions = answer.filter(
      (opt) => !attribute.options?.includes(opt)
    );
    if (invalidOptions.length > 0) {
      return `"${attribute.question}" contains invalid options: ${invalidOptions.join(", ")}`;
    }
  }

  return null;
}

/**
 * Validates text/textarea type attribute
 */
function validateTextType(
  attribute: ServiceAttribute,
  answer: string | string[]
): string | null {
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
