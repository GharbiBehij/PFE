export const resellerCredentialsTemplate = (data: {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}) => ({
  subject: 'Vos identifiants NetyFly Revendeur',
  html: `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vos identifiants NetyFly</title>
    </head>
    <body style="margin:0;padding:0;background-color:#F9FAFB;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              <tr>
                <td style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:40px 40px 32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                    NetyFly
                  </h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">
                    Plateforme eSIM Professionnelle
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:40px;">
                  <p style="color:#111827;font-size:16px;margin:0 0 8px;">
                    Bonjour <strong>${data.firstname} ${data.lastname}</strong>,
                  </p>
                  <p style="color:#6B7280;font-size:15px;line-height:1.6;margin:0 0 32px;">
                    Votre compte revendeur NetyFly a ete cree avec succes.
                    Voici vos identifiants de connexion :
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="background-color:#F5F3FF;border:1px solid #DDD6FE;border-radius:12px;margin-bottom:32px;">
                    <tr>
                      <td style="padding:24px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom:16px;border-bottom:1px solid #DDD6FE;">
                              <p style="color:#6B7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">
                                Email
                              </p>
                              <p style="color:#111827;font-size:16px;font-weight:700;margin:0;">
                                ${data.email}
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top:16px;">
                              <p style="color:#6B7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">
                                Mot de passe
                              </p>
                              <p style="color:#7C3AED;font-size:18px;font-weight:800;margin:0;letter-spacing:1px;font-family:monospace;">
                                ${data.password}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr>
                      <td align="center">
                        <a href="#"
                          style="display:inline-block;background-color:#FACC15;color:#111827;font-weight:700;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;">
                          Telecharger l'application
                        </a>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr>
                      <td style="background-color:#FEF3C7;border:1px solid #FDE68A;border-radius:12px;padding:16px;">
                        <p style="color:#92400E;font-size:14px;margin:0;line-height:1.5;">
                          <strong>Securite :</strong> Gardez vos identifiants confidentiels.
                          Ne les partagez avec personne. Si vous pensez que votre compte
                          a ete compromis, contactez immediatement votre responsable de zone.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0;">
                    Si vous avez des questions, contactez votre responsable de zone.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color:#F9FAFB;padding:24px 40px;border-top:1px solid #E5E7EB;">
                  <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center;line-height:1.6;">
                    © 2024 NetyFly. Tous droits reserves.<br>
                    Cet email a ete envoye automatiquement - merci de ne pas y repondre.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});
