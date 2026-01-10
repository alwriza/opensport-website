import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-card p-8">
            <div className="container mx-auto max-w-4xl">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (window.history.length > 1) {
                            navigate(-1);
                        } else {
                            navigate("/");
                        }
                    }}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">OPENsport Terms and User Agreement</CardTitle>
                        <CardDescription>Last updated: January 12, 2026</CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-6">

                        <section>
                            <h2>1. Acceptance of Terms</h2>
                            <p>
                                This Terms and User Agreement ("Agreement") governs your access to and use of the OPENsport platform
                                (the "Platform"), an AI-driven scouting and training service operated by Said and Aituar. By registering
                                an account or using the Platform, you accept and agree to be bound by this Agreement. If you do not agree,
                                do not use the Platform.
                            </p>
                        </section>

                        <section>
                            <h2>2. Description of the Service</h2>
                            <p>
                                OPENsport provides tools for players to upload and analyse football training videos. Using AI models,
                                the Platform provides skill scores, analytical feedback, training resources and opportunities to be viewed
                                by coaches and scouts. OPENsport is not a football academy, agent, employer or intermediary. The Platform
                                facilitates opportunities but does not guarantee trials, contracts, transfers or selection of players.
                            </p>
                        </section>

                        <section>
                            <h2>3. User Roles and Eligibility</h2>

                            <h3>3.1 Player Accounts</h3>
                            <p>
                                Players may create an account if they are at least 8 years old. Minors under 18 may register without
                                parental verification, but their profiles and videos are visible only to verified coaches. Players must
                                provide an email address and password. Name and surname are optional. Each individual may have only one
                                player account. Players may hide their phone number from coaches if provided.
                            </p>

                            <h3>3.2 Coach Accounts</h3>
                            <p>
                                Coaches may create accounts to view player profiles and contact players. Coaches are solely responsible
                                for how they contact players and must comply with applicable laws, especially when interacting with minors.
                                Coaches may be permanently banned for misconduct. Coaches are granted access to training and analysis tools
                                and may upload training materials for internal use.
                            </p>

                            <h3>3.3 Future Roles</h3>
                            <p>
                                Future versions may introduce scout and administrative roles. Additional terms may apply to those roles
                                when released.
                            </p>
                        </section>

                        <section>
                            <h2>4. Account Registration and Security</h2>
                            <p>
                                Users must provide accurate, current and complete information during registration. Users are responsible
                                for maintaining the confidentiality of their login credentials and are liable for all activities that occur
                                under their account. OPENsport uses password hashing and encryption to protect account information and
                                supports two-factor authentication.
                            </p>
                        </section>

                        <section>
                            <h2>5. Content Ownership and License</h2>

                            <h3>5.1 User Ownership</h3>
                            <p>
                                Users retain ownership of the content they upload, including videos, comments, and other materials
                                ("User Content").
                            </p>

                            <h3>5.2 License to OPENsport</h3>
                            <p>
                                By uploading User Content, you grant OPENsport a non-exclusive, worldwide, royalty-free and revocable
                                license to store, process, analyse, and display your content to coaches (and scouts in future versions)
                                for the purpose of providing the Service. This license does not transfer ownership and terminates when
                                you delete your content or your account, except for minimal backups required by law. OPENsport will not
                                use User Content for marketing or advertising without separate written consent.
                            </p>

                            <h3>5.3 AI Analysis and Training</h3>
                            <p>
                                Videos are processed by automated AI systems to generate skill scores and feedback. These scores are
                                advisory indicators only and do not constitute professional coaching or binding scouting decisions. AI
                                models may be improved over time; rankings and scores may change or be recalculated retrospectively.
                                OPENsport will not use your videos to train AI models unless you explicitly opt in. You may revoke consent
                                at any time; revocation does not retroactively remove your data from models already trained.
                            </p>
                        </section>

                        <section>
                            <h2>6. Rankings and Evaluations</h2>
                            <p>
                                The Platform may provide rankings or ratings for players based on AI analysis. Such rankings are relative,
                                algorithmic indicators, not objective evaluations. Rankings may change as new data is uploaded or algorithms
                                are updated. OPENsport reserves the right to modify, recalculate or discontinue rankings at any time without
                                notice.
                            </p>
                        </section>

                        <section>
                            <h2>7. Communications and Interactions</h2>

                            <h3>7.1 External Contact</h3>
                            <p>
                                Coaches may contact players via external channels (e.g., phone, messaging apps) using contact information
                                provided by players. OPENsport will introduce internal messaging features in future versions. OPENsport is
                                not responsible for off-platform interactions between users.
                            </p>

                            <h3>7.2 Coach Responsibility</h3>
                            <p>
                                Coaches are solely responsible for ensuring that their communication with players complies with all
                                applicable laws, including consent requirements and protections for minors. OPENsport disclaims any
                                liability arising from communications initiated by coaches.
                            </p>
                        </section>

                        <section>
                            <h2>8. Payments and Subscriptions</h2>
                            <p>
                                In future versions, OPENsport may offer paid features via recurring subscriptions or one-time purchases.
                                Prices may change at any time without prior notice. Refunds will be limited and are not available to player
                                accounts. Users who purchase paid features are responsible for any taxes associated with their payments.
                                OPENsport does not calculate, withhold or remit taxes on behalf of users. Subscription auto-renewal terms
                                and refund policies will be detailed in the relevant purchase agreement.
                            </p>
                        </section>

                        <section>
                            <h2>9. Prohibited Conduct</h2>
                            <p>Users agree not to:</p>
                            <ul>
                                <li>Create fake or fraudulent accounts.</li>
                                <li>Upload videos that they do not have rights to upload or that infringe intellectual property rights or privacy rights.</li>
                                <li>Upload manipulated footage intended to misrepresent performance or deceive.</li>
                                <li>Harass, bully or threaten other users.</li>
                                <li>Attempt to misuse or interfere with the Platform.</li>
                                <li>Use AI scores or rankings for fraudulent or abusive purposes.</li>
                            </ul>
                            <p>
                                OPENsport reserves the right to remove any content or suspend any account without notice if it violates
                                these rules or is required by law or safety considerations. Users are fully liable for illegal, infringing
                                or inappropriate content they upload. OPENsport is not liable for such content.
                            </p>
                        </section>

                        <section>
                            <h2>10. Suspension and Termination</h2>
                            <p>
                                OPENsport may suspend or terminate your access to the Platform for any breach of this Agreement, for legal
                                or safety reasons, or if required by law, without prior notice. OPENsport may allow users to submit appeals,
                                but decisions to suspend or terminate accounts are final at OPENsport's discretion. OPENsport may delete
                                inactive accounts after prolonged inactivity. Upon termination, all licenses granted to OPENsport end,
                                access is revoked immediately, and your data is deleted in accordance with our Privacy Policy. Minimal logs
                                and records may be retained for compliance purposes.
                            </p>
                        </section>

                        <section>
                            <h2>11. Disclaimers and Limitation of Liability</h2>
                            <p>
                                OPENsport is provided "as is" and "as available". We do not guarantee that the Platform will be uninterrupted
                                or error-free. To the fullest extent permitted by law, OPENsport disclaims all warranties, express or implied,
                                including warranties of merchantability, fitness for a particular purpose and non-infringement. OPENsport is
                                not responsible for server outages, AI downtime or failures of third-party services. OPENsport is not liable
                                for indirect, incidental, special or consequential damages, including lost opportunities or reputational harm.
                                OPENsport's total liability to you for any claims arising out of this Agreement will not exceed the amount you
                                paid to OPENsport in the 12 months preceding the claim or zero if the service is free.
                            </p>
                        </section>

                        <section>
                            <h2>12. Governing Law and Language</h2>
                            <p>
                                This Agreement is governed by the laws of the Republic of Kazakhstan. In the event of any conflict between
                                translations of this Agreement, the Russian version will prevail. English and Kazakh translations may be
                                provided for convenience.
                            </p>
                        </section>

                        <section>
                            <h2>13. Force Majeure</h2>
                            <p>
                                OPENsport is not liable for any failure or delay in performance caused by circumstances beyond its reasonable
                                control, including but not limited to natural disasters, internet outages, hardware or software failures,
                                government actions, labour disputes, acts of terrorism or war, server outages, AI system downtime or failures
                                of third-party providers.
                            </p>
                        </section>

                        <section>
                            <h2>14. Changes to Terms</h2>
                            <p>
                                OPENsport may modify this Agreement at any time. We will notify users of material changes by posting the
                                updated Agreement on the Platform or sending an email. Continued use of the Platform after the effective date
                                of the updated Agreement constitutes acceptance of the changes. Users who do not agree must discontinue use
                                of the Platform.
                            </p>
                        </section>

                        <section>
                            <h2>15. Contact Information</h2>
                            <p>For questions about this Agreement or to exercise any rights, contact us at:</p>
                            <p>
                                <strong>Email:</strong> contact@opensport.app<br />
                                <strong>Address:</strong> Almaty, Kazakhstan (remote operations)
                            </p>
                        </section>

                        <div className="bg-muted p-4 rounded-lg mt-8">
                            <p className="text-sm">
                                By using OPENsport, you acknowledge that you have read, understood, and agree to be bound by this
                                Terms and User Agreement and our Privacy Policy. This Agreement constitutes the entire agreement between
                                you and OPENsport regarding your use of the Platform.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}