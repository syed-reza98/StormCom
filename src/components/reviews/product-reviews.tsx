// src/components/reviews/product-reviews.tsx
// Product Reviews Component - Display and manage product reviews
// Pattern: shadcn Card + Badge + Avatar + Star rating

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StarIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';

// Types
interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  customerName: string;
  customerAvatar?: string | null;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export function ProductReviews({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
}: Omit<ProductReviewsProps, 'productId'>) {
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  // Sort reviews based on selected option
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'helpful') {
      return b.helpful - a.helpful;
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  // Filter by rating if selected
  const filteredReviews = filterRating
    ? sortedReviews.filter(r => r.rating === filterRating)
    : sortedReviews;

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-2 space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <button
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className="flex items-center gap-1 min-w-[80px] hover:text-primary transition-colors"
                  >
                    <span className="text-sm font-medium">{rating}</span>
                    <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </button>
                  <Progress
                    value={(ratingDistribution[rating as keyof typeof ratingDistribution] / totalReviews) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                    {ratingDistribution[rating as keyof typeof ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter:</span>
          {filterRating && (
            <Badge variant="secondary" className="gap-1">
              {filterRating} <StarIcon className="h-3 w-3 fill-current" />
              <button
                onClick={() => setFilterRating(null)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recent')}
            >
              Most Recent
            </Button>
            <Button
              variant={sortBy === 'helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('helpful')}
            >
              Most Helpful
            </Button>
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              Highest Rating
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {filterRating
                  ? `No ${filterRating}-star reviews yet`
                  : 'No reviews yet. Be the first to review this product!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Review Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {review.customerAvatar ? (
                          <AvatarImage src={review.customerAvatar} alt={review.customerName} />
                        ) : null}
                        <AvatarFallback>
                          {review.customerName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{review.customerName}</p>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="space-y-2">
                    {review.title && (
                      <h4 className="font-medium">{review.title}</h4>
                    )}
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center gap-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                      Was this review helpful?
                    </p>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ThumbsUpIcon className="h-4 w-4" />
                      Helpful ({review.helpful})
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ThumbsDownIcon className="h-4 w-4" />
                      Not Helpful
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Write Review Button */}
      <Card>
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-medium mb-2">Share your thoughts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you have used this product, share your thoughts with other customers
          </p>
          <Button>Write a Review</Button>
        </CardContent>
      </Card>
    </div>
  );
}
