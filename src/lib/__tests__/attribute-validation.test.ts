import { validateAttributeResponses } from "../attribute-validation";

describe("Attribute Validation", () => {
  it("should validate required text attribute", () => {
    const attributes = [
      {
        question: "Project Name",
        type: "text" as const,
        required: true,
      },
    ];

    const responses = [{ question: "Project Name", answer: "Test Project" }];

    const result = validateAttributeResponses(attributes, responses);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation for missing required attribute", () => {
    const attributes = [
      {
        question: "Project Name",
        type: "text" as const,
        required: true,
      },
    ];

    const responses: any[] = [];

    const result = validateAttributeResponses(attributes, responses);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Project Name");
  });

  it("should validate SELECT attribute with valid option", () => {
    const attributes = [
      {
        question: "Color",
        type: "select" as const,
        required: true,
        options: ["Red", "Blue", "Green"],
      },
    ];

    const responses = [{ question: "Color", answer: "Red" }];

    const result = validateAttributeResponses(attributes, responses);
    expect(result.valid).toBe(true);
  });

  it("should fail validation for invalid SELECT option", () => {
    const attributes = [
      {
        question: "Color",
        type: "select" as const,
        required: true,
        options: ["Red", "Blue", "Green"],
      },
    ];

    const responses = [{ question: "Color", answer: "Yellow" }];

    const result = validateAttributeResponses(attributes, responses);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should allow optional attributes to be empty", () => {
    const attributes = [
      {
        question: "Description",
        type: "text" as const,
        required: false,
      },
    ];

    const responses: any[] = [];

    const result = validateAttributeResponses(attributes, responses);
    expect(result.valid).toBe(true);
  });
});
