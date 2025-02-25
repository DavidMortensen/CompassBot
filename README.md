This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Using a Specific OpenAI Assistant

This application has been updated to use a specific OpenAI Assistant instead of the general ChatGPT API. To configure it:

1. **Get Your Assistant ID:**
   - Go to the [OpenAI Playground](https://platform.openai.com/playground)
   - Navigate to the Assistants section
   - Create a new assistant or select an existing one
   - Copy the Assistant ID (it looks like `asst_abc123...`)

2. **Update Your Code:**
   - Open `app/api/chat/route.ts`
   - Replace `YOUR_ASSISTANT_ID` with your actual Assistant ID
   ```typescript
   const ASSISTANT_ID = "YOUR_ASSISTANT_ID";
   ```

3. **Ensure Your API Key Has Access:**
   - Make sure your OpenAI API key in `.env.local` has access to the Assistants API
   - If you're using organization-specific assistants, ensure your API key belongs to that organization

4. **Restart Your Development Server:**
   ```bash
   npm run dev
   ```

The chat interface will now interact with your specific assistant rather than the general chat model.
