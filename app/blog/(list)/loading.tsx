import { BlogListSkeleton } from '@/components/ui/Skeletons/PageSkeletons';

// The list pages sit in the (list) group so this boundary doesn't wrap /blog/[slug]: a post's own
// layout must check it exists before anything streams, or unknown posts return 200 instead of 404.
export default function Loading() {
  return <BlogListSkeleton />;
}
