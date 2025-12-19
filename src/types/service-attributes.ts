/**
 * Service Q&A Attribute Types
 * These types define the structure for custom questions and answers per service
 */

export type AttributeType = "text" | "select" | "multiselect" | "textarea";

export interface ServiceAttribute {
  question: string;
  questionI18n?: { [locale: string]: string }; // Optional localized question
  required: boolean;
  type: AttributeType;
  options?: string[]; // For select/multiselect types
  placeholder?: string;
  placeholderI18n?: { [locale: string]: string };
  helpText?: string;
  helpTextI18n?: { [locale: string]: string };
}

export interface AttributeResponse {
  question: string;
  answer: string | string[]; // string for text/select, string[] for multiselect
}

/**
 * Example usage:
 *
 * Service Attributes (stored in ServiceType.attributes):
 * [
 *   {
 *     question: "Do you need it as an offer post?",
 *     required: true,
 *     type: "select",
 *     options: ["Yes", "No"]
 *   },
 *   {
 *     question: "What are the dimensions you need?",
 *     required: true,
 *     type: "text",
 *     placeholder: "e.g., 1920x1080"
 *   }
 * ]
 *
 * Client Responses (stored in Request.attributeResponses):
 * [
 *   {
 *     question: "Do you need it as an offer post?",
 *     answer: "Yes"
 *   },
 *   {
 *     question: "What are the dimensions you need?",
 *     answer: "1920x1080"
 *   }
 * ]
 */
