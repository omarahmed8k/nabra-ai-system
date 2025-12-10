import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AttributeResponse } from "@/types/service-attributes";

interface AttributeResponsesDisplayProps {
  readonly responses: AttributeResponse[];
}

export function AttributeResponsesDisplay({ responses }: AttributeResponsesDisplayProps) {
  if (!responses || responses.length === 0) {
    return null;
  }

  const formatAnswer = (answer: string | string[]): string => {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    return answer;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Service-Specific Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {responses.map((response, index) => (
            <div key={`${response.question}-${index}`} className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {response.question}
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
