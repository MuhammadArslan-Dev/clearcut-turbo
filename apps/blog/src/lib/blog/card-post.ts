// The fields a post card (BlogPostCard / FeaturedPostCard) reads. The blog
// listing hands its posts to a client grid, so everything it passes is
// serialized into the page; the CMS docs carry the full `content_html` (and
// attachments, author, ...) of every post, which no card shows.
import type { Post } from "@/types/blog/post";

export function toCardPost(post: Post): Post {
  const exam =
    post.exam && typeof post.exam === "object"
      ? { id: post.exam.id, exam_id: post.exam.exam_id, name: post.exam.name, short_name: post.exam.short_name }
      : post.exam;
  const heroImage =
    post.heroImage && typeof post.heroImage === "object"
      ? { id: post.heroImage.id, url: post.heroImage.url, alt: post.heroImage.alt }
      : post.heroImage;

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    exam,
    heroImage,
    publishedDate: post.publishedDate,
  };
}
