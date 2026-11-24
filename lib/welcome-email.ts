import "server-only";

const subject = "Welcome to the bkr Collective";
const thanks = "Thank you for joining our founding community.";
const benefits = [
  { icon: "updates", lines: ["Product", "Updates"] },
  { icon: "access", lines: ["Early", "Access"] },
  { icon: "insights", lines: ["Behind-the-Scenes", "Insights"] },
  { icon: "input", lines: ["Input on", "What’s Next"] },
];

function htmlText(value: string) {
  const escaped: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, character => escaped[character]);
}

export function collectiveWelcome(base: string, unsubscribe: string, marketingAddress?: string) {
  const philosophy = `${base}/#vision`;
  const imageBase = `${base}/images/email`;
  const artwork = htmlText(`${imageBase}/collective-welcome.jpg`);
  const introduction = marketingAddress ? `${thanks} You’ll be among the first to receive product updates, exclusive previews, and opportunities to help shape what we create.` : thanks;
  const reason = marketingAddress ? "You’re receiving this email because you signed up for marketing emails from bkr." : "You’re receiving this email because you joined the bkr waitlist.";
  const features = marketingAddress ? benefits.map(({ icon, lines }, index) => `
    <td class="collective-feature" width="25%" align="center" valign="top" style="padding:2px 7px;color:#f8e9d4;${index ? "border-left:1px solid #915849;" : ""}">
      <img src="${htmlText(`${imageBase}/collective-${icon}.png`)}" width="32" height="32" alt="" style="display:block;margin:0 auto 8px;border:0">
      <span style="font:15px/1.3 Georgia,serif">${lines.map(htmlText).join("<br>")}</span>
    </td>`).join("") : "";
  const marketingText = marketingAddress ? `\n\n${benefits.map(({ lines }) => lines.join(" ")).join("\n")}\n\nExplore Our Philosophy: ${philosophy}` : "";

  return {
    subject,
    text: `bkr\nThe Science of Renewal\n\nWelcome to the bkr Collective.\nYou’re on the waitlist.\n\n${introduction}${marketingText}\n\n${reason}\nUnsubscribe: ${unsubscribe}\n\nbkr${marketingAddress ? `\n${marketingAddress}` : ""}`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title>
      <style>
        @media screen and (max-width: 480px) {
          .collective-hero { padding: 27px 20px 70px !important; }
          .collective-wordmark { font-size: 46px !important; }
          .collective-heading { font-size: 28px !important; }
          .collective-name { font-size: 47px !important; }
          .collective-feature { display: inline-block !important; box-sizing: border-box; width: 49% !important; margin-bottom: 15px; border-left: 0 !important; }
        }
      </style>
      </head><body style="margin:0;padding:0;background:#2c090f;color:#f8e9d4">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#2c090f"><tr><td align="center">
          <!--[if mso]><table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px">
            <tr><td class="collective-hero" align="center" bgcolor="#3f0b15" background="${artwork}" style="background-color:#3f0b15;background-image:url('${artwork}');background-repeat:no-repeat;background-position:center center;background-size:cover;padding:33px 48px 100px;color:#f8e9d4;font-family:Georgia,serif">
              <p class="collective-wordmark" style="margin:0;font:56px/1.05 Georgia,serif;color:#fff2df">bkr</p>
              <p style="margin:12px 0 37px;font:11px/1.5 Georgia,serif;letter-spacing:.24em;color:#f0b67c;text-transform:uppercase">The Science of Renewal</p>
              <h1 class="collective-heading" style="margin:0;font:36px/1.12 Georgia,serif;color:#fff2df">
                Welcome to the
                <span class="collective-name" style="display:block;font-size:64px;line-height:1.06">bkr <em style="font-weight:400;color:#f0b67c">Collective</em></span>
              </h1>
              <p style="margin:24px 0 9px;font:italic 28px/1.25 Georgia,serif;color:#fff2df">You’re on the waitlist.</p>
              <p style="max-width:470px;margin:0 auto;font:18px/1.45 Georgia,serif;color:#f8e9d4">${introduction}</p>
              ${marketingAddress ? `<table class="collective-benefits" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:25px auto 27px"><tr>${features}</tr></table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
                <td align="center" bgcolor="#552519" style="background:#552519;border:1px solid #f0b67c;border-radius:4px">
                  <a href="${htmlText(philosophy)}" style="display:inline-block;padding:14px 19px;color:#fff2df;font:12px/1.45 Georgia,serif;letter-spacing:.15em;text-decoration:none;text-transform:uppercase">Explore Our Philosophy</a>
                </td>
              </tr></table>` : ""}
            </td></tr>
            <tr><td align="center" bgcolor="#2c090f" style="padding:21px 24px 26px;color:#f0d7bf;font:13px/1.5 Arial,sans-serif">
              <p style="margin:0 0 6px">${reason}</p>
              <p style="margin:0 0 6px"><a href="${htmlText(unsubscribe)}" style="color:#f8e9d4;text-decoration:underline">Unsubscribe</a></p>
              <p style="margin:0">bkr${marketingAddress ? `<br>${htmlText(marketingAddress).replace(/\r?\n/g, "<br>")}` : ""}</p>
            </td></tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td></tr></table>
      </body></html>`,
  };
}
