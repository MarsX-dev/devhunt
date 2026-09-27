-- "Top winners" on the home page: a fixed, hand-picked list, sorted by upvotes.
UPDATE public.products SET is_featured = false WHERE is_featured;
UPDATE public.products SET is_featured = true
WHERE NOT deleted AND slug IN ('daytona', 'clerk', 'livecodes', 'memgraph', 'bootstrap', 'toddle', 'huly', 'langfuse');
