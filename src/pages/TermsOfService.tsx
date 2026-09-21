import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TermsOfService() {
    const navigate = useNavigate();
    const { t } = useTranslation("terms");

    // Sections configuration
    const sections = [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"
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
                                {t(`sections.${sectionKey}.p1`) && <p>{t(`sections.${sectionKey}.p1`)}</p>}

                                {/* Subsections */}
                                {t(`sections.${sectionKey}.subsections`, { returnObjects: true }) &&
                                    typeof t(`sections.${sectionKey}.subsections`, { returnObjects: true }) === 'object' && (
                                        <div className="space-y-4 mt-4">
                                            {Object.entries(t(`sections.${sectionKey}.subsections`, { returnObjects: true }) as Record<string, any>).map(([subKey, subContent]) => (
                                                <div key={subKey}>
                                                    <h3>{subContent.title}</h3>
                                                    <p>{subContent.p1}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                {/* Lists */}
                                {t(`sections.${sectionKey}.list`, { returnObjects: true }) &&
                                    typeof t(`sections.${sectionKey}.list`, { returnObjects: true }) === 'object' && (
                                        <ul>
                                            {Object.entries(t(`sections.${sectionKey}.list`, { returnObjects: true }) as Record<string, string>).map(([key, value]) => (
                                                <li key={key}>{value}</li>
                                            ))}
                                        </ul>
                                    )}

                                {/* Second Paragraph */}
                                {t(`sections.${sectionKey}.p2`) && t(`sections.${sectionKey}.p2`) !== `sections.${sectionKey}.p2` && (
                                    <p>{t(`sections.${sectionKey}.p2`)}</p>
                                )}

                                {/* Contact Info */}
                                {sectionKey === "15" && (
                                    <div>
                                        <p>{t("sections.15.contact.email")}</p>
                                        <p>{t("sections.15.contact.address")}</p>
                                    </div>
                                )}
                            </section>
                        ))}

                        <div className="bg-muted p-4 rounded-lg mt-8">
                            <p className="text-sm">
                                {t("acknowledgment")}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}