import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
    const navigate = useNavigate();
    const { t } = useTranslation("privacy");

    // Sections configuration to map through
    const sections = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
    ];

    return (
        <div className="relative min-h-screen">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-spotlight" />
            <div className="section-container relative max-w-4xl py-12 lg:py-16">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (window.history.length > 1) {
                            navigate(-1);
                        } else {
                            navigate("/");
                        }
                    }}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("back")}
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl sm:text-4xl">{t("title")}</CardTitle>
                        <CardDescription>{t("lastUpdated")}</CardDescription>
                    </CardHeader>
                    <CardContent className="prose prose-invert max-w-none space-y-8 prose-headings:font-display prose-headings:text-foreground prose-h2:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
                        {sections.map((sectionKey) => (
                            <section key={sectionKey}>
                                <h2>{t(`sections.${sectionKey}.title`)}</h2>
                                <p>{t(`sections.${sectionKey}.p1`)}</p>

                                {/* Render lists if they exist */}
                                {t(`sections.${sectionKey}.list`, { returnObjects: true }) &&
                                    typeof t(`sections.${sectionKey}.list`, { returnObjects: true }) === 'object' && (
                                        <ul>
                                            {Object.entries(t(`sections.${sectionKey}.list`, { returnObjects: true }) as Record<string, string>).map(([key, value]) => (
                                                <li key={key}><strong>{key}:</strong> {value}</li>
                                            ))}
                                        </ul>
                                    )}

                                {/* Render second paragraph if it exists */}
                                {t(`sections.${sectionKey}.p2`) && t(`sections.${sectionKey}.p2`) !== `sections.${sectionKey}.p2` && (
                                    <p>{t(`sections.${sectionKey}.p2`)}</p>
                                )}

                                {/* Render contact info specifically for section 11 */}
                                {sectionKey === "11" && (
                                    <div>
                                        <p>{t("sections.11.contact.email")}</p>
                                        <p>{t("sections.11.contact.address")}</p>
                                    </div>
                                )}
                            </section>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}