import { prisma } from '../config/database.js';
import logger from '../config/logger.js';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

class AdminService {
  // ==================== DASHBOARD STATISTICS ====================
  async getDashboardStats(timeRange = '7d') {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '1d':
        startDate = subDays(now, 1);
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      default:
        startDate = subDays(now, 7);
    }

    // Get all statistics in parallel
    const [
      userStats,
      productStats,
      rentalStats,
      revenueStats,
      platformStats,
      recentActivities,
      vipStats,
      categoryStats,
    ] = await Promise.all([
      this.getUserStats(startDate, now),
      this.getProductStats(startDate, now),
      this.getRentalStats(startDate, now),
      this.getRevenueStats(startDate, now),
      this.getPlatformStats(),
      this.getRecentActivities(),
      this.getVIPStats(startDate, now),
      this.getCategoryStats(),
    ]);

    return {
      overview: {
        totalUsers: userStats.total,
        totalProducts: productStats.total,
        totalRentals: rentalStats.total,
        totalRevenue: revenueStats.total,
        activeRentals: rentalStats.active,
        pendingWithdrawals: platformStats.pendingWithdrawals,
        pendingReports: platformStats.pendingReports,
      },
      trends: {
        userGrowth: userStats.growth,
        rentalGrowth: rentalStats.growth,
        revenueGrowth: revenueStats.growth,
      },
      charts: {
        dailyRevenue: revenueStats.daily,
        userRegistrations: userStats.daily,
        rentalCompletions: rentalStats.daily,
      },
      vip: vipStats,
      categories: categoryStats,
      recentActivities,
      timeRange,
    };
  }

  async getUserStats(startDate, endDate) {
    const [total, newUsers, todayUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay(new Date()),
            lte: endOfDay(new Date()),
          },
        },
      }),
    ]);

    // Previous period for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(endDate);
    const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    previousEndDate.setDate(previousEndDate.getDate() - periodDays);

    const previousUsers = await prisma.user.count({
      where: {
        createdAt: { gte: previousStartDate, lte: previousEndDate },
      },
    });

    // Daily breakdown
    const dailyData = await this.getDailyData('User', startDate, endDate);

    return {
      total,
      new: newUsers,
      today: todayUsers,
      growth: previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers * 100).toFixed(1) : 100,
      daily: dailyData,
    };
  }

  async getProductStats(startDate, endDate) {
    const [total, newProducts, activeProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.product.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const vipProducts = await prisma.product.count({
      where: { vipLevel: { not: 'NONE' } },
    });

    return {
      total,
      new: newProducts,
      active: activeProducts,
      vip: vipProducts,
      inactive: total - activeProducts,
    };
  }

  async getRentalStats(startDate, endDate) {
    const [total, completed, pending, inProgress] = await Promise.all([
      prisma.rental.count(),
      prisma.rental.count({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.rental.count({
        where: { status: 'PENDING' },
      }),
      prisma.rental.count({
        where: { status: 'IN_PROGRESS' },
      }),
    ]);

    const revenue = await prisma.rental.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });

    // Daily breakdown
    const dailyData = await this.getDailyData('Rental', startDate, endDate, { status: 'COMPLETED' });

    // Previous period for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(endDate);
    const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);
    previousEndDate.setDate(previousEndDate.getDate() - periodDays);

    const previousCompleted = await prisma.rental.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: previousStartDate, lte: previousEndDate },
      },
    });

    return {
      total,
      completed,
      pending,
      inProgress,
      active: pending + inProgress,
      revenue: revenue._sum.totalAmount || 0,
      growth: previousCompleted > 0 ? ((completed - previousCompleted) / previousCompleted * 100).toFixed(1) : 100,
      daily: dailyData,
    };
  }

  async getRevenueStats(startDate, endDate) {
    // Platform revenue (commission)
    const platformRevenue = await prisma.rental.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { platformFee: true },
    });

    // VIP revenue
    const vipRevenue = await prisma.vipSubscription.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    // Total transaction volume
    const totalVolume = await prisma.rental.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true },
    });

    // Daily revenue breakdown
    const dailyRevenue = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const dayResult = await prisma.rental.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: dayStart, lte: dayEnd },
        },
        _sum: { platformFee: true },
      });

      dailyRevenue.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        revenue: dayResult._sum.platformFee || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      platform: platformRevenue._sum.platformFee || 0,
      vip: vipRevenue._sum.amount || 0,
      total: (platformRevenue._sum.platformFee || 0) + (vipRevenue._sum.amount || 0),
      volume: totalVolume._sum.totalAmount || 0,
      daily: dailyRevenue,
    };
  }

  async getPlatformStats() {
    const [pendingWithdrawals, pendingReports, disputedRentals] = await Promise.all([
      prisma.transaction.count({
        where: { type: 'WITHDRAWAL_REQUEST', status: 'PENDING' },
      }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.rental.count({ where: { status: 'DISPUTED' } }),
    ]);

    const topCategories = await prisma.product.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Get category names
    const categoriesWithNames = await Promise.all(
      topCategories.map(async (cat) => {
        const category = await prisma.category.findUnique({
          where: { id: cat.categoryId },
          select: { name: true },
        });
        return {
          categoryId: cat.categoryId,
          categoryName: category?.name || 'Unknown',
          count: cat._count.id,
        };
      })
    );

    return {
      pendingWithdrawals,
      pendingReports,
      disputedRentals,
      topCategories: categoriesWithNames,
    };
  }

  async getVIPStats(startDate, endDate) {
    const [totalSubscriptions, activeSubscriptions, revenue] = await Promise.all([
      prisma.vipSubscription.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.vipSubscription.count({
        where: {
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.vipSubscription.aggregate({
        where: { createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
    ]);

    const levelStats = await prisma.vipSubscription.groupBy({
      by: ['level'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
      _sum: { amount: true },
    });

    return {
      total: totalSubscriptions,
      active: activeSubscriptions,
      revenue: revenue._sum.amount || 0,
      levels: levelStats.map(stat => ({
        level: stat.level,
        count: stat._count.id,
        revenue: stat._sum.amount,
      })),
    };
  }

  async getCategoryStats() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    const totalProducts = categories.reduce((sum, cat) => sum + cat._count.products, 0);

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      productCount: cat._count.products,
      percentage: totalProducts > 0 ? ((cat._count.products / totalProducts) * 100).toFixed(1) : 0,
    }));
  }

  async getRecentActivities(limit = 10) {
    const activities = [];

    // Recent registrations
    const recentUsers = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    activities.push(...recentUsers.map(user => ({
      type: 'USER_REGISTERED',
      user: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      timestamp: user.createdAt,
    })));

    // Recent rentals
    const recentRentals = await prisma.rental.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { title: true } },
        renter: { select: { firstName: true, lastName: true } },
      },
      where: { status: 'COMPLETED' },
    });

    activities.push(...recentRentals.map(rental => ({
      type: 'RENTAL_COMPLETED',
      product: rental.product.title,
      renter: `${rental.renter.firstName} ${rental.renter.lastName}`,
      amount: rental.totalAmount,
      timestamp: rental.createdAt,
    })));

    // Recent VIP purchases
    const recentVIP = await prisma.vipSubscription.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { title: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    activities.push(...recentVIP.map(sub => ({
      type: 'VIP_PURCHASED',
      level: sub.level,
      product: sub.product?.title || 'N/A',
      user: `${sub.user.firstName} ${sub.user.lastName}`,
      amount: sub.amount,
      timestamp: sub.createdAt,
    })));

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async getDailyData(model, startDate, endDate, where = {}) {
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const count = await prisma[model.toLowerCase()].count({
        where: {
          ...where,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      dailyData.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyData;
  }

  // ==================== USER MANAGEMENT ====================
  async getUsers(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters.role) {
      where.role = filters.role;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          emailVerified: true,
          rating: true,
          totalReviews: true,
          balance: true,
          createdAt: true,
          lastSeen: true,
          _count: {
            select: {
              products: true,
              rentals: true,
              ownerRentals: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        bio: true,
        role: true,
        status: true,
        emailVerified: true,
        rating: true,
        totalReviews: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        lastSeen: true,
        addresses: true,
        _count: {
          select: {
            products: true,
            rentals: true,
            ownerRentals: true,
            reviews: true,
            transactions: true,
            vipSubscriptions: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get recent activity
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentRentals = await prisma.rental.findMany({
      where: { OR: [{ renterId: userId }, { ownerId: userId }] },
      include: {
        product: { select: { title: true } },
        renter: { select: { firstName: true, lastName: true } },
        owner: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      ...user,
      recentTransactions,
      recentRentals,
    };
  }

  async updateUserStatus(userId, status, reason = '') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot modify admin users');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    // Log the action
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        balance: user.balance,
        description: `User status changed to ${status}`,
        metadata: {
          action: 'STATUS_CHANGE',
          previousStatus: user.status,
          newStatus: status,
          reason,
          adminAction: true,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notification to user
    const notificationService = require('./notification.service');
    await notificationService.createNotification(
      userId,
      'SYSTEM_ALERT',
      'Account Status Updated',
      `Your account status has been changed to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
      { status, reason }
    );

    logger.info(`User ${userId} status updated to ${status} by admin`);
    return updatedUser;
  }

  async updateUserRole(userId, role, reason = '') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      throw new Error('Cannot remove admin role from admin user');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Log the action
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        balance: user.balance,
        description: `User role changed to ${role}`,
        metadata: {
          action: 'ROLE_CHANGE',
          previousRole: user.role,
          newRole: role,
          reason,
          adminAction: true,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    logger.info(`User ${userId} role updated to ${role} by admin`);
    return updatedUser;
  }

  // ==================== PRODUCT MODERATION ====================
  async getProductsForModeration(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    
    const where = {
      status: { in: ['ACTIVE', 'INACTIVE', 'BANNED', 'DRAFT'] },
    };
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: {
            select: { name: true },
          },
          images: {
            take: 1,
          },
          _count: {
            select: {
              rentals: true,
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateProductStatus(productId, status, reason = '') {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { status },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await prisma.transaction.create({
      data: {
        userId: product.ownerId,
        type: 'ADMIN_ACTION',
        amount: 0,
        balance: product.owner.balance || 0,
        description: `Product "${product.title}" status changed to ${status}`,
        metadata: {
          action: 'PRODUCT_STATUS_CHANGE',
          productId,
          previousStatus: product.status,
          newStatus: status,
          reason,
          adminAction: true,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notification to owner
    const notificationService = require('./notification.service');
    await notificationService.createNotification(
      product.ownerId,
      'SYSTEM_ALERT',
      'Product Status Updated',
      `Your product "${product.title}" has been ${status.toLowerCase()}. ${reason ? `Reason: ${reason}` : ''}`,
      { productId, productTitle: product.title, status, reason }
    );

    logger.info(`Product ${productId} status updated to ${status} by admin`);
    return updatedProduct;
  }

  // ==================== REVIEW MODERATION ====================
  async getReviewsForModeration(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (filters.search) {
      where.OR = [
        { comment: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true';
    }
    
    if (filters.rating) {
      where.rating = parseInt(filters.rating);
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          reviewee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          rental: {
            include: {
              product: {
                select: { title: true },
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

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateReviewStatus(reviewId, isActive, reason = '') {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: { select: { id: true, firstName: true } },
        reviewee: { select: { id: true, firstName: true } },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isActive },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update user rating if review is deactivated
    if (!isActive) {
      const reviewService = require('./review.service');
      await reviewService.updateUserRating(review.revieweeId);
    }

    // Log the action
    await prisma.transaction.create({
      data: {
        userId: review.reviewerId,
        type: 'ADMIN_ACTION',
        amount: 0,
        balance: 0,
        description: `Review status changed to ${isActive ? 'active' : 'inactive'}`,
        metadata: {
          action: 'REVIEW_STATUS_CHANGE',
          reviewId,
          previousStatus: review.isActive,
          newStatus: isActive,
          reason,
          adminAction: true,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notification to reviewer
    const notificationService = require('./notification.service');
    await notificationService.createNotification(
      review.reviewerId,
      'SYSTEM_ALERT',
      'Review Status Updated',
      `Your review has been ${isActive ? 'approved' : 'rejected'}. ${reason ? `Reason: ${reason}` : ''}`,
      { reviewId, isActive, reason }
    );

    logger.info(`Review ${reviewId} status updated to ${isActive} by admin`);
    return updatedReview;
  }

  // ==================== REPORT MANAGEMENT ====================
  async getReports(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.targetType) {
      where.targetType = filters.targetType;
    }
    
    if (filters.reporterId) {
      where.reporterId = filters.reporterId;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    // Get target details for each report
    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        let target = null;
        
        switch (report.targetType) {
          case 'USER':
            target = await prisma.user.findUnique({
              where: { id: report.targetId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            });
            break;
          case 'PRODUCT':
            target = await prisma.product.findUnique({
              where: { id: report.targetId },
              select: {
                id: true,
                title: true,
                images: { take: 1 },
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            });
            break;
          case 'REVIEW':
            target = await prisma.review.findUnique({
              where: { id: report.targetId },
              select: {
                id: true,
                rating: true,
                comment: true,
                reviewer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            });
            break;
        }

        return {
          ...report,
          target,
        };
      })
    );

    return {
      reports: reportsWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateReportStatus(reportId, status, resolvedBy, notes = '') {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null,
        resolvedBy,
        description: notes ? `${report.description}\n\nAdmin Notes: ${notes}` : report.description,
      },
    });

    // Log the action
    await prisma.transaction.create({
      data: {
        userId: report.reporterId,
        type: 'ADMIN_ACTION',
        amount: 0,
        balance: 0,
        description: `Report ${reportId} status changed to ${status}`,
        metadata: {
          action: 'REPORT_STATUS_CHANGE',
          reportId,
          previousStatus: report.status,
          newStatus: status,
          notes,
          adminAction: true,
          adminId: resolvedBy,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notification to reporter
    const notificationService = require('./notification.service');
    await notificationService.createNotification(
      report.reporterId,
      'SYSTEM_ALERT',
      'Report Status Updated',
      `Your report has been ${status.toLowerCase()}. ${notes ? `Notes: ${notes}` : ''}`,
      { reportId, status, notes }
    );

    logger.info(`Report ${reportId} status updated to ${status} by admin ${resolvedBy}`);
    return updatedReport;
  }

  // ==================== WITHDRAWAL MANAGEMENT ====================
  async getWithdrawalRequests(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    
    const where = {
      type: 'WITHDRAWAL_REQUEST',
    };
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.startDate) {
      where.createdAt = { gte: new Date(filters.startDate) };
    }
    
    if (filters.endDate) {
      where.createdAt = { lte: new Date(filters.endDate) };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      withdrawals: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async processWithdrawal(transactionId, status, notes = '') {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
      },
    });

    if (!transaction || transaction.type !== 'WITHDRAWAL_REQUEST') {
      throw new Error('Withdrawal request not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error('Withdrawal request has already been processed');
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
    });

    if (status === 'COMPLETED') {
      // Deduct from user balance (already done when creating request)
      // Create payout record
      await prisma.transaction.create({
        data: {
          userId: transaction.userId,
          type: 'WITHDRAWAL_COMPLETED',
          amount: -transaction.amount,
          balance: transaction.user.balance - transaction.amount,
          description: `Withdrawal of ${transaction.amount} MDL processed`,
          metadata: {
            originalTransactionId: transactionId,
            method: transaction.metadata?.method || 'bank_transfer',
            accountDetails: transaction.metadata?.accountDetails,
          },
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update user balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: { decrement: transaction.amount },
        },
      });
    } else if (status === 'FAILED') {
      // Return money to user balance
      await prisma.user.update({
        where: { id: transaction.userId },
        data: {
          balance: { increment: transaction.amount },
        },
      });

      // Create reversal transaction
      await prisma.transaction.create({
        data: {
          userId: transaction.userId,
          type: 'WITHDRAWAL_REVERSAL',
          amount: transaction.amount,
          balance: transaction.user.balance + transaction.amount,
          description: `Withdrawal request failed, amount returned`,
          metadata: {
            originalTransactionId: transactionId,
            reason: notes || 'Withdrawal processing failed',
          },
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Send notification to user
    const notificationService = require('./notification.service');
    await notificationService.createNotification(
      transaction.userId,
      'WITHDRAWAL_PROCESSED',
      'Withdrawal Request Processed',
      `Your withdrawal request for ${transaction.amount} MDL has been ${status.toLowerCase()}. ${notes ? `Notes: ${notes}` : ''}`,
      { transactionId, amount: transaction.amount, status, notes }
    );

    logger.info(`Withdrawal ${transactionId} processed with status ${status}`);
    return updatedTransaction;
  }

  // ==================== PROMO CODE MANAGEMENT ====================
  async getPromoCodes(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (filters.search) {
      where.code = { contains: filters.search, mode: 'insensitive' };
    }
    
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive === 'true';
    }
    
    if (filters.type) {
      where.type = filters.type;
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.promoCode.count({ where }),
    ]);

    return {
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createPromoCode(data) {
    const existingCode = await prisma.promoCode.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      throw new Error('Promo code already exists');
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        ...data,
        isActive: true,
        uses: 0,
      },
    });

    logger.info(`Promo code created: ${data.code}`);
    return promoCode;
  }

  async updatePromoCode(id, data) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promoCode) {
      throw new Error('Promo code not found');
    }

    if (data.code && data.code !== promoCode.code) {
      const existingCode = await prisma.promoCode.findUnique({
        where: { code: data.code },
      });

      if (existingCode) {
        throw new Error('Promo code already exists');
      }
    }

    const updatedPromoCode = await prisma.promoCode.update({
      where: { id },
      data,
    });

    logger.info(`Promo code updated: ${id}`);
    return updatedPromoCode;
  }

  async deletePromoCode(id) {
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
    });

    if (!promoCode) {
      throw new Error('Promo code not found');
    }

    await prisma.promoCode.delete({
      where: { id },
    });

    logger.info(`Promo code deleted: ${id}`);
    return { message: 'Promo code deleted successfully' };
  }

  // ==================== SETTINGS MANAGEMENT ====================
  async getSettings() {
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' },
    });

    // Group settings by category
    const grouped = {
      platform: {},
      pricing: {},
      limits: {},
      features: {},
      email: {},
      payment: {},
    };

    settings.forEach(setting => {
      if (setting.key.startsWith('platform_')) {
        grouped.platform[setting.key.replace('platform_', '')] = setting.value;
      } else if (setting.key.includes('price') || setting.key.includes('commission')) {
        grouped.pricing[setting.key] = setting.value;
      } else if (setting.key.includes('limit') || setting.key.includes('min') || setting.key.includes('max')) {
        grouped.limits[setting.key] = setting.value;
      } else if (setting.key.includes('email')) {
        grouped.email[setting.key] = setting.value;
      } else if (setting.key.includes('stripe') || setting.key.includes('payment')) {
        grouped.payment[setting.key] = setting.value;
      } else {
        grouped.features[setting.key] = setting.value;
      }
    });

    return grouped;
  }

  async updateSettings(updates) {
    const results = [];

    for (const [key, value] of Object.entries(updates)) {
      try {
        const setting = await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: {
            key,
            value,
            description: `Auto-generated setting for ${key}`,
          },
        });
        results.push({ key, success: true, value: setting.value });
      } catch (error) {
        results.push({ key, success: false, error: error.message });
      }
    }

    logger.info('Settings updated by admin');
    return results;
  }

  // ==================== RENTAL MANAGEMENT ====================
  async getRentalsForAdmin(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }
    
    if (filters.productId) {
      where.productId = filters.productId;
    }
    
    if (filters.renterId) {
      where.renterId = filters.renterId;
    }
    
    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }
    
    if (filters.startDate) {
      where.startDate = { gte: new Date(filters.startDate) };
    }
    
    if (filters.endDate) {
      where.endDate = { lte: new Date(filters.endDate) };
    }

    const [rentals, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          renter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rental.count({ where }),
    ]);

    return {
      rentals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateRentalStatus(rentalId, status, reason = '') {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        renter: { select: { id: true, firstName: true } },
        owner: { select: { id: true, firstName: true } },
        product: { select: { title: true } },
      },
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: { status },
    });

    // Log the action
    await prisma.transaction.create({
      data: {
        userId: rental.renterId,
        type: 'ADMIN_ACTION',
        amount: 0,
        balance: 0,
        description: `Rental ${rentalId} status changed to ${status}`,
        metadata: {
          action: 'RENTAL_STATUS_CHANGE',
          rentalId,
          productTitle: rental.product.title,
          previousStatus: rental.status,
          newStatus: status,
          reason,
          adminAction: true,
        },
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Send notifications to both parties
    const notificationService = require('./notification.service');
    
    await notificationService.createNotification(
      rental.renterId,
      'SYSTEM_ALERT',
      'Rental Status Updated',
      `Your rental for "${rental.product.title}" has been ${status.toLowerCase()} by admin. ${reason ? `Reason: ${reason}` : ''}`,
      { rentalId, productTitle: rental.product.title, status, reason }
    );

    await notificationService.createNotification(
      rental.ownerId,
      'SYSTEM_ALERT',
      'Rental Status Updated',
      `Rental for "${rental.product.title}" has been ${status.toLowerCase()} by admin. ${reason ? `Reason: ${reason}` : ''}`,
      { rentalId, productTitle: rental.product.title, status, reason }
    );

    logger.info(`Rental ${rentalId} status updated to ${status} by admin`);
    return updatedRental;
  }
}

const adminService = new AdminService();
export default adminService;