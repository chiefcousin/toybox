# 🚀 Deploy ToyBox in 5 Minutes

## **What You Need**

### 1. Supabase Credentials (2 minutes)

**Go to:** https://supabase.com/dashboard

**If you don't have a project yet:**
1. Click "New Project"
2. Name it "ToyBox"
3. Create a database password (save it!)
4. Wait 2 minutes for setup

**Get your credentials:**
1. Open your ToyBox project
2. Click **Settings** (left sidebar)
3. Click **API**
4. Copy these 3 values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string - keep secret!)

---

## **Deploy to Vercel - Step by Step**

### **Step 1: Open Vercel**
Click this link: https://vercel.com/new

### **Step 2: Import GitHub Repo**
1. Sign in with GitHub (if not already)
2. Click **"Import Git Repository"**
3. Find **`chiefcousin/toybox`**
4. Click **"Import"**

### **Step 3: Configure (Most Important!)**

**Expand "Environment Variables"** section

Add these 3 variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Paste your Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Paste your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Paste your service_role key |

**Make sure:**
- ✅ All 3 variables are added
- ✅ No extra spaces in the values
- ✅ Applied to "Production" environment

### **Step 4: Deploy**
Click the big **"Deploy"** button

Wait 2-3 minutes... ☕

---

## **After Deployment**

### **You'll get a URL like:**
`https://toybox-xyz123.vercel.app`

### **Set Up Your Database**

1. **Create the tables:**
   - Go to your Supabase dashboard
   - Click **SQL Editor**
   - Copy the content from `supabase/schema.sql` (in this project)
   - Paste and run it

2. **Add sample products:**
   - Go to your live site: `https://toybox-xyz123.vercel.app/admin/login`
   - Login with your admin credentials
   - Add products through the admin panel

---

## **Demo for Store Owner**

### **Customer View:**
Share: `https://toybox-xyz123.vercel.app`

Show them:
- ✅ Browse products on phone
- ✅ Search functionality
- ✅ Categories
- ✅ "Order via WhatsApp" button

### **Admin Panel:**
Go to: `https://toybox-xyz123.vercel.app/admin/login`

Demonstrate:
- ✅ Add new product (with photo upload)
- ✅ Update prices/inventory
- ✅ Manage categories
- ✅ View orders

---

## **Common Issues**

### **"Application Error" after deployment**
- Check that all 3 environment variables are set correctly
- No typos in variable names
- No extra spaces in values

### **Can't see products on the site**
- Make sure you ran the `schema.sql` in Supabase
- Add products through admin panel
- Set products to "Active" status

### **WhatsApp button not working**
- Go to admin panel → Settings
- Add your WhatsApp number in format: `+1234567890`

---

## **Next Steps**

1. ✅ Deploy to Vercel (following steps above)
2. ✅ Set up Supabase tables
3. ✅ Add 5-10 sample products
4. ✅ Test WhatsApp order flow
5. ✅ Schedule demo with store owner

---

**Need help?** Check the deployment logs in Vercel dashboard.
