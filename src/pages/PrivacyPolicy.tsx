import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-card p-8">
            <div className="container mx-auto max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">OPENsport Privacy Policy</CardTitle>
                        <CardDescription>Last updated: January 12, 2026</CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">

                        <section>
                            <h2>1. Introduction</h2>
                            <p>
                                This Privacy Policy describes how OPENsport collects, uses, stores and protects personal data when you
                                use our web platform ("Service"). It is issued by Said and Aituar ("we"/"us"), the founders and owners
                                of OPENsport. We operate in Kazakhstan and intend to register the business as an individual entrepreneur (ИП).
                                This policy applies to all users, including players and coaches. It also applies to scouts, administrators
                                and other roles when those features are released.
                            </p>
                            <p>
                                By accessing the Service you accept the practices described in this policy. If you do not agree, do not
                                use the Service.
                            </p>
                        </section>

                        <section>
                            <h2>2. Applicability and Legal Basis</h2>
                            <p>
                                We comply with the Law of the Republic of Kazakhstan "On Personal Data and Their Protection" and other
                                relevant data‑protection laws. Our legal bases for processing personal data are:
                            </p>
                            <ul>
                                <li><strong>Consent</strong> -- you choose to provide data and agree to its processing.</li>
                                <li><strong>Contractual necessity</strong> -- we process data to provide and maintain the Service.</li>
                                <li><strong>Legitimate interests</strong> -- we process data to improve security, prevent fraud, measure usage and develop new features.</li>
                            </ul>
                            <p>
                                Where consent is required, you may withdraw it at any time without affecting previous processing carried
                                out before withdrawal.
                            </p>
                        </section>

                        <section>
                            <h2>3. What Data We Collect</h2>
                            <p>We collect and process the following categories of personal data:</p>
                            <ul>
                                <li><strong>Account data:</strong> Email address (required), password (required), name and surname (optional). Phone number and physical address are not collected.</li>
                                <li><strong>Profile and video content:</strong> Videos uploaded by players, any accompanying descriptions, and automatically generated metrics such as shooting quality. We do not require biometric indicators; we infer performance metrics from video.</li>
                                <li><strong>Usage data:</strong> Information about how you interact with the Service, including log files, device identifiers and general location derived from IP address. We do not collect precise geolocation.</li>
                                <li><strong>Analytics data:</strong> Aggregated statistics about platform usage, collected via third‑party analytics tools.</li>
                            </ul>
                            <p>
                                We do not allow users to download others' videos. Coaches can view player profiles and videos; other
                                players and the public cannot.
                            </p>
                        </section>

                        <section>
                            <h2>4. How We Use the Data</h2>
                            <p>We use your data for the following purposes:</p>
                            <ul>
                                <li>To create and manage your account.</li>
                                <li>To provide the Service, including storing and streaming uploaded videos.</li>
                                <li>To analyse videos automatically using AI models to generate skill scores and other feedback. Results are presented to coaches and players; the AI does not make binding decisions.</li>
                                <li>To maintain a training library for users and to improve our AI models and Service. We only use your videos for AI model training if you explicitly opt in. You may opt out or revoke consent at any time; revocation will not affect models already trained.</li>
                                <li>To contact coaches and players when they communicate via the Service.</li>
                                <li>To carry out analytics, prevent fraud, ensure security and comply with our legal obligations.</li>
                                <li>To prepare for future features such as subscriptions, payments, scouting integrations, rankings and third‑party services.</li>
                            </ul>
                            <p>We do not use personal data for marketing without separate consent.</p>
                        </section>

                        <section>
                            <h2>5. Children and Minors</h2>
                            <p>
                                The Service is available to users aged 8 and over. Users under 18 may create accounts without parental
                                verification, but their profiles and videos are visible only to verified coaches. Minors may request deletion
                                of their data at any time by emailing contact@opensport.app. We encourage parents or guardians to monitor
                                minors' use of the Service. If a local law requires parental consent, we may ask for documentation.
                            </p>
                        </section>

                        <section>
                            <h2>6. Data Sharing</h2>
                            <p>We share data only in these circumstances:</p>
                            <ul>
                                <li><strong>With service providers</strong> -- for hosting, cloud storage (servers currently in Amsterdam), analytics and future payment processing. Providers are contractually required to protect personal data.</li>
                                <li><strong>With coaches</strong> -- coaches can view player profiles, videos and AI analyses. In future versions scouts and administrators may have similar access.</li>
                                <li><strong>Legal obligations</strong> -- if required by Kazakh law or a court order.</li>
                                <li><strong>Merger or acquisition</strong> -- if OPENsport is acquired or merged, we will notify users before transferring data.</li>
                            </ul>
                            <p>
                                We do not sell personal data. We do not authorise partners to use personal data for their own marketing.
                            </p>
                        </section>

                        <section>
                            <h2>7. Data Storage and Transfers</h2>
                            <p>
                                We store personal data on secure servers hosted in Amsterdam and managed by a cloud provider. Data may be
                                transferred to and processed in countries outside Kazakhstan. We implement encryption in transit and at rest.
                                Passwords are hashed using industry‑standard algorithms. Two‑factor authentication is supported. Despite
                                these measures, no system is completely secure; users are responsible for keeping their account credentials
                                confidential.
                            </p>
                        </section>

                        <section>
                            <h2>8. Data Retention and Deletion</h2>
                            <p>We retain personal data only as long as necessary:</p>
                            <ul>
                                <li><strong>Active accounts:</strong> we keep data for as long as you maintain an account.</li>
                                <li><strong>Account deletion:</strong> when you delete your account, we delete your personal data and videos from active systems within 30 days and from backups within 90 days.</li>
                                <li><strong>Inactive accounts:</strong> if an account is inactive for a prolonged period, we may notify you and then delete it.</li>
                            </ul>
                            <p>We may retain certain information if required by law.</p>
                        </section>

                        <section>
                            <h2>9. User Rights</h2>
                            <p>Under Kazakh law you have the following rights:</p>
                            <ul>
                                <li><strong>Access:</strong> you may request a copy of the personal data we hold about you.</li>
                                <li><strong>Rectification:</strong> you may update or correct inaccurate data.</li>
                                <li><strong>Deletion:</strong> you may request deletion of your data.</li>
                                <li><strong>Withdrawal of consent:</strong> you may withdraw consent for optional processing (such as AI model training) without deleting your account.</li>
                            </ul>
                            <p>
                                You can exercise these rights by emailing contact@opensport.app. We will respond within three business days.
                                We may ask you to verify your identity before responding to your request.
                            </p>
                        </section>

                        <section>
                            <h2>10. Updates and Notifications</h2>
                            <p>
                                We may update this policy to reflect changes in law or the Service. We will post the updated policy on our
                                website and notify users by email when material changes occur. Continued use of the Service after the
                                effective date constitutes acceptance of the updated policy.
                            </p>
                        </section>

                        <section>
                            <h2>11. Contact Information</h2>
                            <p>If you have questions or wish to exercise your rights, contact us at:</p>
                            <p>
                                <strong>Email:</strong> contact@opensport.app<br />
                                <strong>Address:</strong> Almaty, Kazakhstan (we currently operate remotely)
                            </p>
                            <p>
                                If you believe that we have infringed your rights, you may file a complaint with the authorised body in
                                Kazakhstan. We will cooperate with authorities and respond within three business days.
                            </p>
                        </section>

                        <section>
                            <h2>12. Governing Law and Jurisdiction</h2>
                            <p>
                                This policy and any dispute arising from it are governed by the laws of the Republic of Kazakhstan. Any
                                disputes shall be resolved by the courts of Kazakhstan.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}