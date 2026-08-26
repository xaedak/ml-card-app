# Privacy Policy

**Mobile Legends Player Card Bot**
Developed by **@Mikun190** on Discord
Last updated: August 27, 2026

This Privacy Policy explains what information the Bot processes, why, and for how long.

## 1. Information the Bot Processes

When you run `/playercard`, the Bot temporarily processes:

- **From Discord itself:** your Discord user ID, username, and avatar image (fetched from Discord's own CDN)
- **What you type into the forms:** the name you want shown on the card, your birthday (day/month only — no year is asked for), your Mobile Legends player ID, server ID, roles played, main hero, and highest rank

The Bot does **not** ask for or process your email address, real name (unless you choose to type one), payment information, IP address, exact birth year, or any Discord message content outside of the card-creation flow itself.

## 2. How This Information Is Used

The information above is used solely to generate the single card image you requested and to post it:

- privately back to you, and
- publicly to the channel your server's administrators have configured the Bot to post in

## 3. Storage and Retention

- While you're going through the multi-step form, your in-progress answers are held in temporary storage (Cloudflare Workers KV) for up to **15 minutes**, after which they are automatically and permanently deleted — whether or not you finished the flow.
- Once your card image is generated and delivered, your answers are deleted from that temporary storage immediately.
- The **finished image** is not stored by the Bot anywhere after it's sent. It exists afterward only as a normal Discord message/attachment in your DM and in the public channel it was posted to — subject to that server's own message retention and Discord's own systems, not the Bot's.
- The Bot does not maintain a database, log file, or analytics record of who has used it, what they typed, or how often.

## 4. Third Parties Involved

Because of how the Bot is built and hosted, the following third parties briefly handle data as part of delivering the feature — none of them receive it for their own use:

- **Discord** — transmits the interaction data (your form answers, user ID, avatar) to the Bot, and delivers the resulting image back through its own platform. Discord's handling of this data is governed by Discord's own Privacy Policy: https://discord.com/privacy
- **Cloudflare** — hosts the code that generates the image (Cloudflare Workers) and briefly caches the background template images at the edge for performance. Cloudflare's handling of this is governed by their privacy policy: https://www.cloudflare.com/privacypolicy/
- **GitHub** — hosts the publicly-visible background template image files that the Bot fetches when building a card. No personal data is sent to GitHub as part of this.

No information is sold, rented, or shared with advertisers. No information is used to train any AI/ML model.

## 5. Public Visibility

The finished card — including your Discord avatar, username/display name, and whatever you typed — is posted to a channel chosen by the server's administrators. Depending on that server's settings, this may be visible to some or all members of that server. **Do not submit information you're not comfortable with other server members seeing.**

## 6. Your Choices

- You can choose what to type into every field; nothing is required beyond what the form asks.
- You can decline to use the Bot at any time — it only activates when you explicitly run `/playercard`.
- If a server administrator has posted a card about you that you'd like removed, contact that server's moderators directly, since the Bot does not retain a copy to delete on its own.

## 7. Children's Privacy

This Bot is not directed at children under the age required to use Discord itself (per Discord's Terms of Service, currently 13, or higher where required by local law). The Bot does not knowingly collect information from users below that age beyond what Discord itself already requires for platform access.

## 8. Changes to This Policy

This Privacy Policy may be updated as the Bot changes. Material changes will be reflected in the "Last updated" date above.

## 9. Contact

Questions about this policy, or requests related to your data, can be directed to **@Mikun190** on Discord.

---
*This document is a template provided for a small, independently developed Discord bot and is not a substitute for legal advice. It describes this Bot's actual technical behavior as built, but does not account for jurisdiction-specific requirements (e.g. GDPR, CCPA) that may apply depending on where your server's members are located. If you operate at larger scale, consider a legal review.*
