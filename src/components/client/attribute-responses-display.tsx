import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AttributeResponse, ServiceAttribute } from "@/types/service-attributes";
import { resolveLocalizedText } from "@/lib/i18n";
import { useTranslations, useLocale } from "next-intl";

interface AttributeResponsesDisplayProps {
  readonly responses: AttributeResponse[];
  readonly serviceAttributes?: ServiceAttribute[] | null;
}

export function AttributeResponsesDisplay({
  responses,
  serviceAttributes,
}: AttributeResponsesDisplayProps) {
  const t = useTranslations("requests.attributes");
  const locale = useLocale();

  if (!responses || responses.length === 0) {
    return null;
  }

  const getQuestion = (response: AttributeResponse, index: number): string => {
    if (!serviceAttributes || serviceAttributes.length === 0) return response.question;

    // Try to match by order first; fallback to matching by question text
    const byIndex = serviceAttributes[index];
    const byText = serviceAttributes.find((attr) => attr.question === response.question);
    const attr = byIndex || byText;
    if (!attr) return response.question;

    return resolveLocalizedText(attr.questionI18n, locale, attr.question);
  };

  const formatAnswer = (answer: string | string[]): string => {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    return answer;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {responses.map((response, index) => (
            <div key={`${response.question}-${index}`} className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {getQuestion(response, index)}
              </p>
              <div className="text-sm">
                {Array.isArray(response.answer) ? (
                  <div className="flex flex-wrap gap-2">
                    {response.answer.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground">{formatAnswer(response.answer)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
