/**
 * Service Q&A Attribute Types
 * These types define the structure for custom questions and answers per service
 */

export type AttributeType = "text" | "select" | "multiselect" | "textarea" | "number";

export interface AttributeOptionWithCost {
  value: string;
  creditCost?: number;
  labelI18n?: { [locale: string]: string };
}

export interface ServiceAttribute {
  question: string;
  questionI18n?: { [locale: string]: string }; // Optional localized question
  required: boolean;
  type: AttributeType;
  options?: string[]; // For select/multiselect types
  optionsWithCost?: AttributeOptionWithCost[]; // Per-option credit cost for select/multiselect
  placeholder?: string;
  placeholderI18n?: { [locale: string]: string };
  helpText?: string;
  helpTextI18n?: { [locale: string]: string };
  min?: number; // For number type
  max?: number; // For number type
  creditImpact?: number; // Credits per unit (e.g., 5 credits per additional segment)
  includedQuantity?: number; // Free quantity included in base price (e.g., first 20 products)
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
 *     question: "How many additional 10-second segments?",
 *     required: false,
 *     type: "select",
 *     options: ["0", "1", "2", "3"],
 *     creditImpact: 5  // 5 credits per segment (selecting "2" = 2 × 5 = 10 credits)
 *   },
 *   {
 *     question: "Total number of products in menu",
 *     required: true,
 *     type: "number",
 *     min: 1,
 *     includedQuantity: 20,  // First 20 products included in base price
 *     creditImpact: 1  // 1 credit per product after the first 20
 *   }
 * ]
 *
 * Client Responses (stored in Request.attributeResponses):
 * [
 *   {
 *     question: "How many additional 10-second segments?",
 *     answer: "2"
 *   },
 *   {
 *     question: "Total number of products in menu",
 *     answer: "25"
 *   }
 * ]
 */
