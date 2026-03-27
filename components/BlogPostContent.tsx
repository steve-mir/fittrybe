// components/BlogPostContent.tsx
// Renders Tiptap-generated HTML safely. Content comes from our own admin, so it's trusted.

interface BlogPostContentProps {
  html: string;
}

export default function BlogPostContent({ html }: BlogPostContentProps) {
  return (
    <div
      className="prose-fittrybe"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
