# Deploying to Vercel

## Prerequisites
1. A GitHub account
2. A Vercel account
3. Your PostgreSQL database (preferably on Neon.tech as it works well with Vercel)
4. Your OpenAI API key

## Steps

1. **Prepare Your Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub Repository**
   - Go to github.com and create a new repository
   - Follow GitHub's instructions to push your existing repository

3. **Deploy on Vercel**
   - Go to vercel.com and sign in
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Build Command: `npm run build`
     - Output Directory: `client/dist`
     - Root Directory: `./`

4. **Set Environment Variables**
   In your Vercel project settings, add these environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

## Important Notes
- Make sure your database accepts connections from Vercel's IP ranges
- The free tier of Vercel has limitations on execution time, which might affect some long-running scraping operations
- Consider using Vercel's serverless functions for the scraping operations

## Troubleshooting
If you encounter issues:
1. Check the Vercel deployment logs
2. Verify your environment variables are set correctly
3. Ensure your database is accessible from Vercel's infrastructure
