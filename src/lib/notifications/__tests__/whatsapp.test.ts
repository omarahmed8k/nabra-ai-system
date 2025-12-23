import {
  sendWhatsAppTemplate,
  formatE164,
  isWhatsAppEnabled,
  getTemplateConfigForType,
} from "../whatsapp";

describe("whatsapp sender", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV };
    process.env.WHATSAPP_ENABLED = "true";
    process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "1234567890";
    process.env.WHATSAPP_LANGUAGE_CODE = "en";
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("formatE164 normalizes common inputs", () => {
    expect(formatE164("+15551234567")).toBe("+15551234567");
    expect(formatE164("  +201234567890  ")).toBe("+201234567890");
    // Bare digits become E.164 with leading plus
    expect(formatE164("201234567890")).toBe("+201234567890");
    // '00' prefix becomes '+'
    expect(formatE164("00201234567890")).toBe("+201234567890");
    // Strip formatting characters
    expect(formatE164("(+20) 123-456-7890")).toBe("+201234567890");
    // Invalid cases
    expect(formatE164("05551234567")).toBe("+05551234567"); // 11 digits ok, treated as international
    expect(formatE164("+12abc345")).toBeNull();
    expect(formatE164(undefined)).toBeNull();
  });

  test("isWhatsAppEnabled reads env flag", () => {
    expect(isWhatsAppEnabled()).toBe(true);
    process.env.WHATSAPP_ENABLED = "false";
    expect(isWhatsAppEnabled()).toBe(false);
  });

  test("sendWhatsAppTemplate posts to Cloud API with payload", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = fetchMock;

    const res = await sendWhatsAppTemplate("+15551234567", "template_name", {
      languageCode: "en",
      bodyParams: ["Hello", "World"],
    });

    expect(res).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/graph\.facebook\.com\/v21\.0\/1234567890\/messages/);
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer test-token");
    const body = JSON.parse(options.body);
    expect(body.messaging_product).toBe("whatsapp");
    expect(body.to).toBe("+15551234567");
    expect(body.type).toBe("template");
    expect(body.template.name).toBe("template_name");
    expect(body.template.language.code).toBe("en");
    expect(body.template.components[0].parameters).toHaveLength(2);
  });

  test("getTemplateConfigForType respects param count env override", () => {
    process.env.WHATSAPP_TEMPLATE_GENERAL = "my_template";
    process.env.WHATSAPP_TEMPLATE_GENERAL_PARAMS = "0";
    const cfg = getTemplateConfigForType("general");
    expect(cfg).toEqual({ name: "my_template", paramCount: 0 });
  });

  test("sendWhatsAppTemplate throws when env missing", async () => {
    process.env.WHATSAPP_ACCESS_TOKEN = "";
    await expect(sendWhatsAppTemplate("+15551234567", "template_name", {})).rejects.toThrow(
      /not configured/i
    );
  });
});
