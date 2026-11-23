# bkr

bkr is a prelaunch skincare site and customer research platform. It collects anonymous survey answers and product concept feedback, runs a confirmed email waitlist, and gives administrators a dashboard for reviewing and exporting research.

## Local setup

Use Node.js 22 or newer and a PostgreSQL database. Copy `.env.example` to `.env`, set `DATABASE_URL` and `APP_URL`, and generate a long random `RATE_LIMIT_SECRET`.

```sh
npm ci
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Survey progress persists on the same browser for the 30-day life of its research cookie. The concept seed is repeatable.

If your `.env` points to the workspace PostgreSQL instance on port 55433, start that database after a reboot before running `npm run dev`.

```sh
pg_ctl -D .local/postgres -l .local/postgres/server.log start
```

To provision an administrator in the database, pass a 16–256 character password through standard input. This Bash example keeps the password out of shell history and command arguments.

```bash
read -rs -p 'Administrator password: ' bkr_admin_password
printf '\n'
printf '%s' "$bkr_admin_password" | node --env-file=.env prisma/admin.mjs admin@example.com
unset bkr_admin_password
```

Visit `/admin/login`. Re-running the provisioning command replaces the password and revokes existing sessions. Admin sessions expire after eight hours.

Run `npm run typecheck` for type checking, and `npm run build` for a production build.

## Vercel deployment

- Import the project as a Next.js application and set the variables from `.env.example` in the target environment. Set `APP_URL` to that environment’s HTTPS origin. Use a separate database and service configuration for previews.
- Run `prisma migrate deploy` and the idempotent concept seed against the target PostgreSQL database before enabling submissions. Use a provider-supported pooled connection for serverless traffic.
- Set both Cloudflare Turnstile keys for the deployment hostname and set `RATE_LIMIT_SECRET`. Production research submissions require verification. Vercel clients are rate-limited using its proxy-provided IP header. If self-hosting, configure `TRUSTED_IP_HEADER` only for a header your proxy overwrites.
- Set `RESEND_API_KEY`, `EMAIL_FROM` with the bkr display name and an address on a verified sender domain, and `CONTACT_EMAIL`. Confirm that links sent in the waitlist email work on the deployed hostname.
- Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to enable opt-in usage analytics. Keep them unset to omit analytics. Campaign attribution for research reporting stays in PostgreSQL.
- Update concept prices and ingredient ideas when the brand team supplies final details. Finalize the privacy and terms drafts, including retention periods and the operating entity, before a public launch.

## Resend waitlist emails

In Resend, verify your sending domain and create an API key with **Sending access**. For local development add the entries below to your existing `.env` in the project root, then restart `npm run dev`. On Vercel, enter the same names and real values under **Settings → Environment Variables** for Production, set `APP_URL` to the site's public HTTPS origin, and redeploy. Keep the API key in server environment variables.

```dotenv
RESEND_API_KEY=re_your_key_here
EMAIL_FROM="bkr <hello@mail.yourdomain.com>"
MARKETING_POSTAL_ADDRESS="Your actual business mailing address"
CRON_SECRET=your_separate_random_secret
```

Use an `EMAIL_FROM` address on the domain you verified with Resend. The mailing address appears in the marketing welcome email footer. Generate `CRON_SECRET` separately with `openssl rand -hex 32`.

Apply `npm run db:deploy` to the target database before serving the updated app. When someone joins, bkr sends an email confirmation. The marketing welcome email is queued after confirmation if they checked the marketing box. It includes a visible unsubscribe link and email-client one-click opt-out. The sender needs a configured mailing address for welcome delivery.

The app attempts the welcome immediately after confirmation. With `CRON_SECRET` set, the Vercel cron checks for pending deliveries once a day during the 14:00 UTC hour, which fits the Hobby schedule. Retries stop within Resend’s idempotency window to protect against duplicate welcomes, so some failed sends may expire before the daily check. This flow applies to new confirmations.

## Fountain water

Adjust `fountainWaterSettings` in `lib/fountain-water.ts` to tune the basin animation. The ripple origin uses normalized image coordinates measured from the top left. Wave speed is measured in image widths per second and wave frequency in cycles per image width. Wave amplitude, decay, reflection intensity, and surface distortion control the strength of the water effects. The crop and holdouts are aligned to the vial photograph.

The hero uses the original photograph for reduced motion and when the device cannot render the shader.

## Renewal discovery

On an existing installation, run `npm run db:deploy` followed by `npm run db:seed` before accepting new survey responses and votes. The seed adds the four active concepts. Earlier survey editions and product records remain available in research reporting. A browser can submit the renewal questionnaire even if it completed the original edition.

The Product Lab records one changeable priority vote per browser. The dashboard reports Product Lab ballots separately from survey votes. Product segment rankings use the share of renewal respondents in each age-range and priority-concern group who chose the concept. A segment needs five responses to rank ahead of smaller samples.

Survey completion uses matching survey starts as its denominator. Marketing opt-in is calculated among confirmed subscribers who are currently subscribed. CSV exports omit names, email addresses, raw feedback, and anonymous session identifiers.

## Generated photography

- `email/collective-welcome.jpg` — Edit the attached bkr Collective email artwork into a clean photoreal background for the same email. Preserve the rich warm deep burgundy, copper silk or fine translucent petal curls hugging the upper-right and lower-left corners, and glowing golden water ripples across the very bottom quarter. Preserve the softly lit smooth deep burgundy negative space over the upper and middle 75 percent, suitable for ivory text. Remove every letter and all typography, wordmarks, divider graphics, icons, and button borders, filling those areas seamlessly with the original background texture. The center must be unobstructed and dark for live email HTML typography. Full bleed no borders. Same vertical aspect around 5:6, luxury skincare editorial, no people, text or logos.

- `philosophy-terrace-detail.webp` — Refine this exact photograph for bkr. Keep the composition and object positions precisely registered to the reference: same aspect ratio around 1.883:1, same exact camera and geometry, no zoom, no recentering, same four Ionic pedestal faces and objects in the same sizes/locations, same statues at the extreme left and right, same continuous arch, greenery, sky and distant temple. Make the stone and statues appreciably more detailed and sculptural: fine hand-chiseled hair curls and braided strands, deeply modeled cloth folds, gently worn edges, small chips, fine porous champagne travertine grain, fine marble mineral veins, hand-carved architectural scroll relief with crisp sculptural shading, subtle patina and warm raking light that reveals the texture. Preserve clear blank pale fronts on all four pedestals for website text, with subdued texture and no markings that compromise contrast. Preserve the bright blank upper center sky. Remove the narrow white framing strips from both extreme edges by extending the adjacent scene pixels all the way to each edge. Full bleed, absolutely no white border, matte or strip on any edge, no text or new objects. Realistic material detail, no stylization. Keep the layout pixel-aligned so existing text overlays on the four pedestals still work. The four detail crops reuse the same image for mobile.

- `philosophy-terrace.webp` — Edit the user's attached bkr philosophy section reference into a production website background, using the reference as the direct edit target. Preserve its wide composition, framing, warm sunset atmosphere, two inward-facing antique marble statues at the edges, tall travertine arch and olive foliage, a Greek temple on a distant hill on the right, and four evenly spaced broad pale Ionic pedestal plinths across the bottom. Preserve the four distinct objects above the plinths, left to right: a carved bowl of water with a few suspended droplets, a bronze-and-glass hourglass in a carved bowl with olive leaves, a sliced red pomegranate in a carved bowl with olive leaves, and a carved bowl of glowing water with one natural sunlight sparkle. Make one change: remove ALL lettering, titles, decorative dividers, laurel marks, and drawn symbols from the sky and the front faces of the four pedestals. The center of the upper sky must be light, smooth and entirely blank. The front of every pedestal must be pale natural champagne limestone, smooth, blank and clearly visible for overlaying accessible burgundy typography later. No engraving, logos, icons, badges or text. Keep the objects, column capitals and plinth bases aligned as in the reference. Photorealism, preserve camera, image aspect around 1.89:1, clean premium luxury editorial image. The four mobile pedestal images are crops from the same artwork.

- `ionic-column.webp` — Create a single photorealistic cutout PNG with a truly transparent background of a freestanding ancient Greek Ionic column. Entire intact column from ornate volute capital at top to stepped square classical plinth base at bottom, deeply fluted tapered shaft, warm aged ivory champagne travertine with fine natural pits and softly lit copper highlights. Straight-on centered front elevation at eye level, subtly sculptural three-dimensional relief, straight verticals, symmetrical. Column is approximately 3.2 times as tall as its widest base, a slightly broad shaft useful as a website motif. No text, no lettering, no separate decoration, no scene, no floor or cast shadow outside the object. Tight composition with a little breathing room around all edges, full silhouette visible. Luxury editorial photo rendering, warm diagonal light from upper left, transparent alpha edges. Tall portrait.

The built-in image generator edited the fountain hero to add the vial. The page animates the droplets and water level as the visitor scrolls.

- `fountain-vial.webp` — Edit this photorealistic bkr hero image. Retain the same 4:5 aspect, centered composition, burgundy arch, copper sunlight and champagne stone fountain. Add a large tall cylindrical uncapped transparent laboratory glass vial directly beneath the central bronze spout. It stands upright in the stone fountain basin on a small circular stone riser, fully visible. The vial is the unmistakable focal point, catching beautiful bright slim crystalline edge highlights. A flat bottom, straight-sided glass, narrow open circular lip, subtly thick refractions. Empty glass, with just tiny traces of condensation. Place the mouth at roughly y=51% and base y=67%, width about 12% of the total image. Maintain a visibly empty gap between the faucet and open vial for drops to be added by animation. REMOVE the continuous existing stream entirely and leave clear softly shadowed burgundy backdrop between faucet and glass mouth. Do not add water stream or floating droplets. Keep spout, glass mouth and vial base on the same vertical centerline x=50%. Preserve clear negative space in the upper half. Do not change the backdrop, palette, stone basin, or editorial photo realism. No people, logos, graphics or text.

The built-in image generator created these images. The project serves the WebP versions from `public/images/`.

- `fountain-hero.webp` — Use case photorealistic-natural. Make a single 4:5 portrait editorial photograph for the right half of bkr's burgundy luxury skincare homepage, a mysterious fountain of youth on a cinematic warm stone set. One sculptural antique travertine fountain lit from upper left by copper-orange sunlight, deep warm burgundy/black cherry plaster wall with subtle arch form behind and soft diagonal light, fine shimmers on the shallow reflective water, pale champagne rim. Straight-on and perfectly centered horizontally, visible from front. Composition is important: place a discreet narrow spout at the horizontal center x=50%, y=43% from the top, with its single slender clear falling stream entering the shallow oval basin at x=50%, y=68%. Basin spans middle 65 percent of composition, fully visible, reflective water surface has fine ripples, stone foundation foreground fades into shadow. A slender single continuous fall of clear water, no splashes high in the image. Premium fragrance campaign, real water and stone texture, subdued sophisticated color, mysterious and serene. No people, no text, no logo, no lettering.
- `essence.webp` — Photoreal luxury skincare product concept photography, square. Single tall cylindrical frosted cream-white glass bottle with subtle champagne cap, centered on warm ivory limestone surface and warm beige plaster studio background, dramatic but soft streaks of sunlight, soft shadow to right, minimalist luxury beauty editorial still life. Bottle occupies 60 percent of height, generous breathing room. No text, no graphics.
- `serum.webp` — Photoreal luxury skincare product concept photography, square. Single frosted muted blush pink glass serum bottle with warm ivory dropper cap, centered on blush limestone with tonal muted pink plaster studio background, soft sunlight from upper left, minimalist premium beauty editorial. Bottle occupies 60 percent of height, with breathing room. No text, no graphics.
- `radiance.webp` — Photorealistic square luxury skincare packaging concept. One slender amber glass serum bottle with a muted bronze dropper cap on champagne travertine, centered single object against a warm deep burgundy plaster alcove. Soft diagonal copper sunlight, fine realistic reflections in the amber glass, refined editorial composition with clear space around bottle, soft shadow and warm champagne highlights. Darker rich tones suited to bkr skincare. No lettering, no logos, no people.
- `cream.webp` — Photoreal luxury skincare product concept photography, square. Single short wide rounded matte ivory cosmetic jar with pale champagne brushed metal lid, centered on warm taupe stone with sepia beige plaster studio background, soft diagonal sunlight from upper left, minimalist luxury editorial still life. Jar occupies 45 percent of height. No text, no graphics.
- `texture.webp` — Photoreal skincare editorial macro photograph, landscape aspect. A sculptural smear of pearlescent ivory gel cream on warm pale champagne stone, layered curved ridges and a few fine air bubbles with side light, subtle satin highlights, elevated French beauty art direction, fair warm neutral palette, no text, no packaging.
