import { prisma } from '../config/database.js';
import logger from '../config/logger.js';
import notificationService from './notification.service.js';

export class ReviewService {
  async createReview(rentalId, reviewerId, reviewData) {
    const { rating, comment } = reviewData;

    // Check if rental exists and reviewer is involved
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            ownerId: true,
          },
        },
        renter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        review: true,
      },
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    // Check if rental is completed
    if (rental.status !== 'COMPLETED') {
      throw new Error('Can only review completed rentals');
    }

    // Determine review type and reviewee
    let type, revieweeId;
    if (reviewerId === rental.renterId) {
      type = 'RENTER_TO_OWNER';
      revieweeId = rental.ownerId;
      
      // Check if renter already reviewed
      if (rental.renterReviewed) {
        throw new Error('You have already reviewed this rental');
      }
    } else if (reviewerId === rental.ownerId) {
      type = 'OWNER_TO_RENTER';
      revieweeId = rental.renterId;
      
      // Check if owner already reviewed
      if (rental.ownerReviewed) {
        throw new Error('You have already reviewed this rental');
      }
    } else {
      throw new Error('You are not involved in this rental');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rentalId,
        reviewerId,
        revieweeId,
        rating,
        comment,
        type,
      },
    });

    // Update rental with review status
    if (type === 'RENTER_TO_OWNER') {
      await prisma.rental.update({
        where: { id: rentalId },
        data: { renterReviewed: true },
      });
    } else {
      await prisma.rental.update({
        where: { id: rentalId },
        data: { ownerReviewed: true },
      });
    }

    // Update user rating
    await this.updateUserRating(revieweeId);

    // Send notification to reviewee
    await notificationService.sendReviewReceivedNotification(
      revieweeId,
      `${rental.renter.firstName} ${rental.renter.lastName}`,
      rating,
      comment
    );

    logger.info(`Review created for rental ${rentalId} by user ${reviewerId}`);
    return review;
  }

  async updateUserRating(userId) {
    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: userId,
        isActive: true,
      },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await prisma.user.update({
      where: { id: userId },
      data: {
        rating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviews.length,
      },
    });
  }

  async getProductReviews(productId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Get all rentals for this product
    const rentals = await prisma.rental.findMany({
      where: {
        productId,
        status: 'COMPLETED',
      },
      select: { id: true },
    });

    const rentalIds = rentals.map(r => r.id);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          rentalId: { in: rentalIds },
          isActive: true,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          rental: {
            select: {
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          rentalId: { in: rentalIds },
          isActive: true,
        },
      }),
    ]);

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Calculate rating distribution
    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return {
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: total,
      distribution,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserReviews(userId, type = 'received', page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where = type === 'received'
      ? { revieweeId: userId, isActive: true }
      : { reviewerId: userId, isActive: true };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          ...(type === 'received' ? {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          } : {
            reviewee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          }),
          rental: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Calculate average rating for received reviews
    let averageRating = 0;
    if (type === 'received') {
      const receivedReviews = await prisma.review.findMany({
        where: { revieweeId: userId, isActive: true },
        select: { rating: true },
      });
      
      if (receivedReviews.length > 0) {
        averageRating = receivedReviews.reduce((sum, review) => sum + review.rating, 0) / receivedReviews.length;
      }
    }

    return {
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateReview(reviewId, userId, updateData) {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        reviewerId: userId,
      },
    });

    if (!review) {
      throw new Error('Review not found or you are not the author');
    }

    // Check if review can be updated (within 24 hours)
    const hoursSinceCreation = (new Date() - new Date(review.createdAt)) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new Error('Reviews can only be updated within 24 hours of creation');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    // Update user rating if rating changed
    if (updateData.rating !== undefined) {
      await this.updateUserRating(review.revieweeId);
    }

    logger.info(`Review updated: ${reviewId} by user ${userId}`);
    return updatedReview;
  }

  async deleteReview(reviewId, userId) {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        reviewerId: userId,
      },
    });

    if (!review) {
      throw new Error('Review not found or you are not the author');
    }

    // Check if review can be deleted (within 24 hours)
    const hoursSinceCreation = (new Date() - new Date(review.createdAt)) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new Error('Reviews can only be deleted within 24 hours of creation');
    }

    // Soft delete by marking as inactive
    await prisma.review.update({
      where: { id: reviewId },
      data: { isActive: false },
    });

    // Update user rating
    await this.updateUserRating(review.revieweeId);

    logger.info(`Review deleted: ${reviewId} by user ${userId}`);
    return { message: 'Review deleted successfully' };
  }

  async reportReview(reviewId, reporterId, reason, description) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    // Check if user already reported this review
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        targetType: 'REVIEW',
        targetId: reviewId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      throw new Error('You have already reported this review');
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType: 'REVIEW',
        targetId: reviewId,
        reason,
        description,
      },
    });

    logger.info(`Review reported: ${reviewId} by user ${reporterId}`);
    return report;
  }

  async getReviewStats(userId) {
    const [
      reviewsGiven,
      reviewsReceived,
      averageRating,
      distribution,
    ] = await Promise.all([
      prisma.review.count({
        where: { reviewerId: userId, isActive: true },
      }),
      prisma.review.count({
        where: { revieweeId: userId, isActive: true },
      }),
      prisma.review.aggregate({
        where: { revieweeId: userId, isActive: true },
        _avg: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { revieweeId: userId, isActive: true },
        _count: { id: true },
      }),
    ]);

    const ratingDistribution = {};
    distribution.forEach(item => {
      ratingDistribution[item.rating] = item._count.id;
    });

    return {
      reviewsGiven,
      reviewsReceived,
      averageRating: reviewsReceived > 0 ? parseFloat(averageRating._avg.rating.toFixed(1)) : 0,
      distribution: ratingDistribution,
    };
  }

  async getRecentReviews(limit = 5) {
    const reviews = await prisma.review.findMany({
      where: { isActive: true },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        rental: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return reviews;
  }
}

const reviewService = new ReviewService();
export default reviewService;