# Firebase to Supabase Migration Guide

## ✅ Migration Complete

All Firebase code has been successfully replaced with Supabase. Here's what was changed:

### Files Modified:
1. **lib/firebase.ts** → **lib/supabase.ts** - New Supabase client configuration
2. **lib/auth.ts** - Updated to use Supabase Auth
3. **lib/posts.ts** - Updated to use Supabase Database
4. **lib/uploadImage.ts** - Updated to use Supabase Storage
5. **app/api/waitlist/route.ts** - Updated to use Supabase Database
6. **app/admin/login/page.tsx** - Updated to use Supabase Auth
7. **components/LandingPageClient.tsx** - Updated to use Supabase Database
8. **components/WaitlistPageClient.tsx** - Updated to use Supabase Database
9. **middleware.ts** - Updated comments
10. **.env.local** - Updated environment variables

### Package Changes:
- ✅ Installed: `@supabase/supabase-js`
- ✅ Removed: `firebase`

---

## 🚀 Setup Instructions

### 1. Create a Supabase Project
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be provisioned

### 2. Get Your Supabase Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)
4. Update your `.env.local` file with these values

### 3. Create Database Tables

Run these SQL commands in your Supabase SQL Editor (**SQL Editor** in the sidebar):

#### Waitlist Table:
```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster email lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for waitlist signup)
CREATE POLICY "Allow public inserts" ON waitlist
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public reads (for count)
CREATE POLICY "Allow public reads" ON waitlist
  FOR SELECT TO anon
  USING (true);
```

#### Posts Table:
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  "coverImage" TEXT,
  tags TEXT[] DEFAULT '{}',
  author JSONB DEFAULT '{"name": "Fittrybe Team"}',
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  "publishedAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts("publishedAt" DESC);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow public to read published posts
CREATE POLICY "Allow public to read published posts" ON posts
  FOR SELECT TO anon
  USING (status = 'published');

-- Allow authenticated users to do everything (for admin)
CREATE POLICY "Allow authenticated full access" ON posts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 4. Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it: `blog-images`
4. Make it **Public** (check the public checkbox)
5. Click **Create Bucket**

#### Set Storage Policies:
Go to the bucket → **Policies** tab and add:

```sql
-- Allow public uploads (you may want to restrict this to authenticated users)
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'blog-images');

-- Allow public reads
CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'blog-images');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images');
```

### 5. Set Up Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Go to **Authentication** → **Users**
4. Click **Add User** → **Create new user**
5. Enter your admin email and password (use the ones from .env.local)
6. Click **Create User**

### 6. Enable Realtime (Optional)

For live waitlist count updates:
1. Go to **Database** → **Replication**
2. Find the `waitlist` table
3. Enable replication for it

---

## 🔄 Data Migration (If you have existing Firebase data)

### Export from Firebase:
1. Go to Firebase Console → Firestore Database
2. Export your collections (waitlist, posts)
3. Download the JSON data

### Import to Supabase:
Use the Supabase SQL Editor to insert your data:

```sql
-- Example for waitlist
INSERT INTO waitlist (name, email, "createdAt")
VALUES 
  ('John Doe', 'john@example.com', '2024-01-01T00:00:00Z'),
  ('Jane Smith', 'jane@example.com', '2024-01-02T00:00:00Z');

-- Example for posts
INSERT INTO posts (slug, title, description, content, "coverImage", tags, status, "publishedAt", "updatedAt")
VALUES 
  ('my-first-post', 'My First Post', 'Description here', '<p>Content here</p>', 'https://...', ARRAY['fitness', 'sports'], 'published', NOW(), NOW());
```

---

## 🧪 Testing

1. Start your dev server: `npm run dev`
2. Test waitlist signup: Go to `/waitlist`
3. Test admin login: Go to `/admin/login` (use credentials from .env.local)
4. Test blog posts: Go to `/blog`

---

## 📝 Key Differences

### Firebase → Supabase Equivalents:
- `collection()` → `supabase.from('table_name')`
- `addDoc()` → `.insert()`
- `updateDoc()` → `.update()`
- `deleteDoc()` → `.delete()`
- `getDocs()` → `.select()`
- `where()` → `.eq()`, `.gt()`, `.lt()`, etc.
- `orderBy()` → `.order()`
- `serverTimestamp()` → `new Date().toISOString()` or `NOW()` in SQL
- `onSnapshot()` → `.on('postgres_changes', ...)`

### Auth:
- `signInWithEmailAndPassword()` → `supabase.auth.signInWithPassword()`
- `signOut()` → `supabase.auth.signOut()`
- `onAuthStateChanged()` → `supabase.auth.onAuthStateChange()`
- `getIdToken()` → `session.access_token`

### Storage:
- `uploadBytes()` → `supabase.storage.from('bucket').upload()`
- `getDownloadURL()` → `supabase.storage.from('bucket').getPublicUrl()`

---

## 🎉 You're Done!

Your app is now running on Supabase! All Firebase dependencies have been removed.

### Benefits of Supabase:
- ✅ Open source
- ✅ PostgreSQL database (more powerful than Firestore)
- ✅ Built-in REST and GraphQL APIs
- ✅ Real-time subscriptions
- ✅ Row Level Security
- ✅ Better pricing for most use cases
- ✅ Self-hostable

### Need Help?
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
