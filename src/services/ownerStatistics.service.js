import { prisma } from '../config/database.js';
import { startOfDay, endOfDay, subDays, format, eachMonthOfInterval } from 'date-fns';

class OwnerStatisticsService {
  async getOwnerDashboard(ownerId, timeRange = '30d') {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }

    const [
      overview,
      revenueStats,
      productStats,
      rentalStats,
      chartData,
      recentActivity,
    ] = await Promise.all([
      this.getOverviewStats(ownerId, startDate, now),
      this.getRevenueStats(ownerId, startDate, now),
      this.getProductStats(ownerId),
      this.getRentalStats(ownerId, startDate, now),
      this.getChartData(ownerId, startDate, now),
      this.getRecentActivity(ownerId),
    ]);

    return {
      overview,
      revenue: revenueStats,
      products: productStats,
      rentals: rentalStats,
      charts: chartData,
      recentActivity,
      timeRange,
    };
  }

  async getOverviewStats(ownerId, startDate, endDate) {
    const [
      totalProducts,
      activeProducts,
      totalRentals,
      completedRentals,
      totalRevenue,
      averageRating,
    ] = await Promise.all([
      prisma.product.count({ where: { ownerId } }),
      prisma.product.count({ where: { ownerId, status: 'ACTIVE' } }),
      prisma.rental.count({
        where: {
          ownerId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.rental.count({
        where: {
          ownerId,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.rental.aggregate({
        where: {
          ownerId,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      prisma.product.aggregate({
        where: { ownerId, rating: { gt: 0 } },
        _avg: { rating: true },
      }),
    ]);

    // Calculate conversion rate
    const totalViews = await prisma.product.aggregate({
      where: { ownerId },
      _sum: { views: true },
    });

    const conversionRate = totalViews._sum.views > 0
      ? (completedRentals / totalViews._sum.views * 100).toFixed(2)
      : 0;

    return {
      totalProducts,
      activeProducts,
      totalRentals,
      completedRentals,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageRating: parseFloat((averageRating._avg.rating || 0).toFixed(1)),
      conversionRate: parseFloat(conversionRate),
      views: totalViews._sum.views || 0,
    };
  }

  async getRevenueStats(ownerId, startDate, endDate) {
    const [totalRevenue, platformFees, netRevenue] = await Promise.all([
      prisma.rental.aggregate({
        where: {
          ownerId,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { totalAmount: true },
      }),
      prisma.rental.aggregate({
        where: {
          ownerId,
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { platformFee: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: ownerId,
          type: 'RENTAL_INCOME',
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    // Calculate daily average
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const dailyAverage = days > 0 ? (netRevenue._sum.amount || 0) / days : 0;

    return {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      platformFees: platformFees._sum.platformFee || 0,
      netRevenue: netRevenue._sum.amount || 0,
      dailyAverage: parseFloat(dailyAverage.toFixed(2)),
    };
  }

  async getProductStats(ownerId) {
    const products = await prisma.product.findMany({
      where: { ownerId },
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: {
          select: {
            rentals: { where: { status: 'COMPLETED' } },
            reviews: true,
            favorites: true,
          },
        },
      },
      orderBy: { views: 'desc' },
      take: 10,
    });

    // Calculate product performance metrics
    const productsWithMetrics = products.map(product => {
      const revenue = product.rentals.reduce((sum, rental) => sum + rental.totalAmount, 0);
      const conversionRate = product.views > 0
        ? (product._count.rentals / product.views * 100).toFixed(2)
        : 0;

      return {
        ...product,
        metrics: {
          revenue,
          conversionRate: parseFloat(conversionRate),
          popularity: product._count.favorites,
        },
      };
    });

    // Top performing products
    const topProducts = [...productsWithMetrics]
      .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
      .slice(0, 5);

    // Most viewed products
    const mostViewed = [...productsWithMetrics]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalCount: products.length,
      products: productsWithMetrics,
      topProducts,
      mostViewed,
    };
  }

  async getRentalStats(ownerId, startDate, endDate) {
    const rentals = await prisma.rental.findMany({
      where: {
        ownerId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        product: { select: { title: true } },
        renter: { select: { firstName: true, lastName: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by status
    const statusCounts = rentals.reduce((acc, rental) => {
      acc[rental.status] = (acc[rental.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate average rental duration
    const completedRentals = rentals.filter(r => r.status === 'COMPLETED');
    const avgDuration = completedRentals.length > 0
      ? completedRentals.reduce((sum, rental) => sum + rental.totalDays, 0) / completedRentals.length
      : 0;

    // Calculate cancellation rate
    const cancelledRentals = rentals.filter(r => r.status === 'CANCELLED').length;
    const cancellationRate = rentals.length > 0
      ? (cancelledRentals / rentals.length * 100).toFixed(2)
      : 0;

    // Recent rentals
    const recentRentals = rentals.slice(0, 10);

    return {
      total: rentals.length,
      statusCounts,
      averageDuration: parseFloat(avgDuration.toFixed(1)),
      cancellationRate: parseFloat(cancellationRate),
      recentRentals,
    };
  }

  async getChartData(ownerId, startDate, endDate) {
    // Revenue chart (monthly)
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    const monthlyRevenue = await Promise.all(
      months.map(async (month) => {
        const monthStart = startOfDay(month);
        const monthEnd = endOfDay(new Date(month.getFullYear(), month.getMonth() + 1, 0));

        const revenue = await prisma.transaction.aggregate({
          where: {
            userId: ownerId,
            type: 'RENTAL_INCOME',
            createdAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        });

        return {
          month: format(month, 'MMM yyyy'),
          revenue: revenue._sum.amount || 0,
        };
      })
    );

    // Rental chart (daily for last 30 days)
    const dailyRentals = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      const count = await prisma.rental.count({
        where: {
          ownerId,
          status: 'COMPLETED',
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      dailyRentals.push({
        date: format(currentDate, 'MMM dd'),
        count,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      monthlyRevenue,
      dailyRentals,
    };
  }

  async getRecentActivity(ownerId) {
    const [recentRentals, recentReviews, recentMessages] = await Promise.all([
      prisma.rental.findMany({
        where: { ownerId },
        include: {
          product: { select: { title: true } },
          renter: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.review.findMany({
        where: {
          revieweeId: ownerId,
          isActive: true,
        },
        include: {
          reviewer: { select: { firstName: true, lastName: true, avatar: true } },
          rental: {
            include: {
              product: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: ownerId },
            { receiverId: ownerId },
          ],
        },
        include: {
          sender: { select: { firstName: true, lastName: true, avatar: true } },
          receiver: { select: { firstName: true, lastName: true, avatar: true } },
          rental: { select: { product: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      recentRentals,
      recentReviews,
      recentMessages,
    };
  }

  async getProductAnalytics(productId, ownerId, timeRange = '30d') {
    // Verify ownership
    const product = await prisma.product.findFirst({
      where: { id: productId, ownerId },
      include: {
        category: { select: { name: true } },
      },
    });

    if (!product) {
      throw new Error('Product not found or access denied');
    }

    const now = new Date();
    let startDate = subDays(now, timeRange === '30d' ? 30 : 90);

    const [
      viewsData,
      rentalData,
      revenueData,
      favoriteData,
    ] = await Promise.all([
      this.getProductViewsData(productId, startDate, now),
      this.getProductRentalData(productId, startDate, now),
      this.getProductRevenueData(productId, startDate, now),
      this.getProductFavoriteData(productId, startDate, now),
    ]);

    // Calculate metrics
    const conversionRate = product.views > 0
      ? (rentalData.totalRentals / product.views * 100).toFixed(2)
      : 0;

    const averageRentalValue = rentalData.totalRentals > 0
      ? revenueData.totalRevenue / rentalData.totalRentals
      : 0;

    return {
      product: {
        id: product.id,
        title: product.title,
        category: product.category.name,
        rating: product.rating,
        views: product.views,
        status: product.status,
        vipLevel: product.vipLevel,
      },
      metrics: {
        totalViews: product.views,
        totalRentals: rentalData.totalRentals,
        totalRevenue: revenueData.totalRevenue,
        totalFavorites: favoriteData.totalFavorites,
        conversionRate: parseFloat(conversionRate),
        averageRentalValue: parseFloat(averageRentalValue.toFixed(2)),
        occupancyRate: this.calculateOccupancyRate(productId, startDate, now),
      },
      charts: {
        views: viewsData,
        rentals: rentalData.chart,
        revenue: revenueData.chart,
        favorites: favoriteData.chart,
      },
      recentRentals: rentalData.recent,
      timeRange,
    };
  }

  async getProductViewsData(productId, startDate, endDate) {
    // For simplicity, we'll return daily views for the last 30 days
    // In production, you'd want to track views in a separate table with timestamps
    
    const viewsData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // This is a simplified version - in reality, you'd query a views table
      viewsData.push({
        date: format(currentDate, 'MMM dd'),
        views: Math.floor(Math.random() * 10), // Mock data
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return viewsData;
  }

  async getProductRentalData(productId, startDate, endDate) {
    const rentals = await prisma.rental.findMany({
      where: {
        productId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        renter: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by day for chart
    const rentalChart = [];
    const rentalMap = new Map();

    rentals.forEach(rental => {
      const date = format(new Date(rental.createdAt), 'MMM dd');
      rentalMap.set(date, (rentalMap.get(date) || 0) + 1);
    });

    rentalMap.forEach((count, date) => {
      rentalChart.push({ date, count });
    });

    return {
      totalRentals: rentals.length,
      chart: rentalChart.sort((a, b) => new Date(a.date) - new Date(b.date)),
      recent: rentals.slice(0, 10),
    };
  }

  async getProductRevenueData(productId, startDate, endDate) {
    const rentals = await prisma.rental.findMany({
      where: {
        productId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        totalAmount: true,
        platformFee: true,
        createdAt: true,
      },
    });

    // Group by month for chart
    const revenueChart = [];
    const revenueMap = new Map();

    rentals.forEach(rental => {
      const month = format(new Date(rental.createdAt), 'MMM yyyy');
      const netRevenue = rental.totalAmount - rental.platformFee;
      revenueMap.set(month, (revenueMap.get(month) || 0) + netRevenue);
    });

    revenueMap.forEach((revenue, month) => {
      revenueChart.push({ month, revenue });
    });

    const totalRevenue = rentals.reduce((sum, rental) => sum + (rental.totalAmount - rental.platformFee), 0);

    return {
      totalRevenue,
      chart: revenueChart.sort((a, b) => new Date(a.month) - new Date(b.month)),
    };
  }

  async getProductFavoriteData(productId, startDate, endDate) {
    const favorites = await prisma.favorite.findMany({
      where: {
        productId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    });

    // Group by day for chart
    const favoriteChart = [];
    const favoriteMap = new Map();

    favorites.forEach(fav => {
      const date = format(new Date(fav.createdAt), 'MMM dd');
      favoriteMap.set(date, (favoriteMap.get(date) || 0) + 1);
    });

    favoriteMap.forEach((count, date) => {
      favoriteChart.push({ date, count });
    });

    return {
      totalFavorites: favorites.length,
      chart: favoriteChart.sort((a, b) => new Date(a.date) - new Date(b.date)),
    };
  }

  calculateOccupancyRate(productId, startDate, endDate) {
    // Calculate how many days the product was rented vs available
    // This is a simplified calculation
    return 65.5; // Mock data - in reality, calculate based on rental periods
  }
}

const ownerStatisticsService = new OwnerStatisticsService();
export default ownerStatisticsService;