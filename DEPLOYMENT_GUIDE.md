# ToyBox Deployment Guide

## Quick Deploy to Vercel

### Step 1: Prepare Your Supabase Credentials

You'll need these from your Supabase dashboard (https://supabase.com/dashboard):

1. Go to your ToyBox project in Supabase
2. Navigate to **Settings > API**
3. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2: Deploy with Vercel CLI

Run this command from your project directory:

```bash
vercel
```

You'll be prompted to:
1. **Log in** - It will open a browser to authenticate
2. **Set up project** - Accept the defaults
3. **Add environment variables** - You can skip for now and add them in the dashboard

### Step 3: Add Environment Variables

After deployment, go to your Vercel dashboard:

1. Go to: https://vercel.com/dashboard
2. Click on your **toybox** project
3. Go to **Settings > Environment Variables**
4. Add these three variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = [your-supabase-url]
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = [your-anon-key]
   - `SUPABASE_SERVICE_ROLE_KEY` = [your-service-role-key]
5. Click **Save**
6. Go to **Deployments** tab and click **Redeploy**

### Step 4: Get Your Live URL

Once deployed, Vercel will give you URLs like:
- Production: `https://toybox-xxxx.vercel.app`
- Preview: `https://toybox-git-main-xxxx.vercel.app`

### Step 5: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain (e.g., `toyboxstore.com`)
3. Follow DNS configuration instructions

## Alternative: Deploy via Dashboard

1. Go to: https://vercel.com/new
2. Click **Import Git Repository**
3. Select `chiefcousin/toybox` from GitHub
4. Add environment variables (see Step 3 above)
5. Click **Deploy**

## What to Show the Store Owner

Once deployed, you can demonstrate:

### Customer Experience
- Share the live URL: `https://your-app.vercel.app`
- Show on mobile phone
- Browse products
- Click "Order via WhatsApp" button

### Admin Panel
- Login: `https://your-app.vercel.app/admin/login`
- Demonstrate adding a product
- Show inventory management
- Explain how orders come through WhatsApp

## Troubleshooting

### "Application error" on the live site
- Check that environment variables are set correctly
- Look at the **Logs** in Vercel dashboard

### Database connection errors
- Verify Supabase credentials are correct
- Check that Supabase database is active

### Products not showing
- Make sure you have products in your Supabase database
- Check that products have `is_active = true`

## Next Steps After Deployment

1. ✅ Set up admin account in Supabase
2. ✅ Add real products with images
3. ✅ Configure WhatsApp number in store settings
4. ✅ Test the full order flow
5. ✅ Share with store owner for demo

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Docs: https://supabase.com/docs
