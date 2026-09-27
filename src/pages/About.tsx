import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Globe, Target, Users, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation("about");

  const impacts = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: t("impact.items.equalAccess.title"),
      description: t("impact.items.equalAccess.description"),
      stats: t("impact.items.equalAccess.stats")
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: t("impact.items.transparent.title"),
      description: t("impact.items.transparent.description"),
      stats: t("impact.items.transparent.stats")
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: t("impact.items.global.title"),
      description: t("impact.items.global.description"),
      stats: t("impact.items.global.stats")
    }
  ];

  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: t("features.items.aiAnalysis.title"),
      description: t("features.items.aiAnalysis.description"),
      badge: t("features.items.aiAnalysis.badge")
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: t("features.items.community.title"),
      description: t("features.items.community.description"),
      badge: t("features.items.community.badge")
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: t("features.items.feedback.title"),
      description: t("features.items.feedback.description"),
      badge: t("features.items.feedback.badge")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t("title")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-16 bg-primary">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground mb-6">{t("mission.title")}</h2>
            <p className="text-xl text-primary-foreground/90 max-w-4xl mx-auto leading-relaxed">
              {t("mission.content")}
            </p>
          </CardContent>
        </Card>

        {/* Community Impact */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">{t("impact.title")}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {impacts.map((impact, index) => (
              <Card key={index} className=" transition-shadow">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-none bg-primary/10 mx-auto mb-4">
                    <div className="text-primary">{impact.icon}</div>
                  </div>
                  <CardTitle className="text-xl mb-2">{impact.title}</CardTitle>
                  <Badge variant="secondary" className="mx-auto">{impact.stats}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    {impact.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">{t("features.title")}</h2>
          <div className="space-y-8">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-none bg-primary/10 flex-shrink-0">
                      <div className="text-primary">{feature.icon}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                        <Badge variant="outline">{feature.badge}</Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* The Problem We're Solving */}
        <Card className="mb-16 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">{t("problem.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t("problem.challenges.title")}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  {(t("problem.challenges.items", { returnObjects: true }) as string[]).map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">{t("problem.solution.title")}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  {(t("problem.solution.items", { returnObjects: true }) as string[]).map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Long-term Vision */}
        <Card className="bg-gradient-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("vision.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {t("vision.content")}
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 rounded-sm bg-primary/5">
                <h4 className="font-semibold text-primary mb-2">{t("vision.goals.2025.title")}</h4>
                <p className="text-sm text-muted-foreground">{t("vision.goals.2025.content")}</p>
              </div>
              <div className="p-6 rounded-sm bg-primary/5">
                <h4 className="font-semibold text-primary mb-2">{t("vision.goals.2026.title")}</h4>
                <p className="text-sm text-muted-foreground">{t("vision.goals.2026.content")}</p>
              </div>
              <div className="p-6 rounded-sm bg-primary/5">
                <h4 className="font-semibold text-primary mb-2">{t("vision.goals.2027.title")}</h4>
                <p className="text-sm text-muted-foreground">{t("vision.goals.2027.content")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
