# Supabase Quick Reference

## Environment Variables (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from: Supabase Dashboard → Settings → API

---

## Database Schema

### waitlist table
```sql
- id: UUID (primary key)
- name: TEXT
- email: TEXT (unique)
- createdAt: TIMESTAMPTZ
```

### posts table
```sql
- id: UUID (primary key)
- slug: TEXT (unique)
- title: TEXT
- description: TEXT
- content: TEXT
- coverImage: TEXT
- tags: TEXT[]
- author: JSONB
- status: TEXT ('draft' | 'published')
- publishedAt: TIMESTAMPTZ
- updatedAt: TIMESTAMPTZ
```

---

## Storage Buckets

### blog-images (public)
- Used for blog post cover images
- Public read access
- Upload access for authenticated users

---

## Common Supabase Operations

### Query Data
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .order('publishedAt', { ascending: false });
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('waitlist')
  .insert({ name: 'John', email: 'john@example.com' });
```

### Update Data
```typescript
const { error } = await supabase
  .from('posts')
  .update({ status: 'published' })
  .eq('id', postId);
```

### Delete Data
```typescript
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

### Upload File
```typescript
const { error } = await supabase.storage
  .from('blog-images')
  .upload('path/to/file.jpg', file);
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('blog-images')
  .getPublicUrl('path/to/file.jpg');
```

### Auth - Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Auth - Sign Out
```typescript
await supabase.auth.signOut();
```

### Auth - Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Real-time Subscription
```typescript
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'waitlist' },
    (payload) => console.log(payload)
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

---

## Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [SQL Editor](https://app.supabase.com/project/_/sql)
