import { prisma } from '../config/database.js';
import logger from '../config/logger.js';

export class ProductService {
  async createProduct(userId, productData, images = []) {
    const {
      title,
      description,
      categoryId,
      pricePerDay,
      pricePerWeek,
      pricePerMonth,
      condition,
      brand,
      model,
      year,
      dimensions,
      weight,
      rules,
      deposit,
      maxRentalDays,
      minRentalDays,
    } = productData;

    // Calculate weekly and monthly prices if not provided
    const calculatedPricePerWeek = pricePerWeek || pricePerDay * 5;
    const calculatedPricePerMonth = pricePerMonth || pricePerDay * 20;

    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        description,
        categoryId,
        ownerId: userId,
        pricePerDay,
        pricePerWeek: calculatedPricePerWeek,
        pricePerMonth: calculatedPricePerMonth,
        condition,
        brand,
        model,
        year,
        dimensions,
        weight,
        rules,
        deposit,
        maxRentalDays,
        minRentalDays: minRentalDays || 1,
        status: 'DRAFT',
        availability: [],
      },
    });

    // Add images if provided
    if (images.length > 0) {
      const productImages = images.map((image, index) => ({
        productId: product.id,
        url: image,
        order: index,
        isPrimary: index === 0,
      }));

      await prisma.productImage.createMany({
        data: productImages,
      });
    }

    logger.info(`Product created: ${product.id} by user ${userId}`);
    return product;
  }

  async updateProduct(productId, userId, updateData) {
    // Verify ownership
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    // Calculate prices if needed
    if (updateData.pricePerDay && !updateData.pricePerWeek) {
      updateData.pricePerWeek = updateData.pricePerDay * 5;
    }
    if (updateData.pricePerDay && !updateData.pricePerMonth) {
      updateData.pricePerMonth = updateData.pricePerDay * 20;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    logger.info(`Product updated: ${productId} by user ${userId}`);
    return updatedProduct;
  }

  async getProductById(productId, userId = null) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
            totalReviews: true,
          },
        },
        category: true,
        images: {
          orderBy: { order: 'asc' },
        },
        attributes: true,
        _count: {
          select: {
            rentals: {
              where: { status: 'COMPLETED' },
            },
            reviews: true,
            favorites: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Increment view count
    await this.incrementViewCount(productId, userId);

    // Check if product is favorited by user
    if (userId) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      product.isFavorited = !!favorite;
    }

    return product;
  }

  async incrementViewCount(productId, userId) {
    try {
      await prisma.product.update({
        where: { id: productId },
        data: {
          views: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error('Failed to increment view count:', error);
    }
  }

  async searchProducts(filters = {}, page = 1, limit = 20) {
    const {
      categoryId,
      minPrice,
      maxPrice,
      condition,
      location,
      radius,
      latitude,
      longitude,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      vipOnly,
      availableFrom,
      availableTo,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      status: 'ACTIVE',
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.AND = [];
      if (minPrice !== undefined) {
        where.AND.push({ pricePerDay: { gte: minPrice } });
      }
      if (maxPrice !== undefined) {
        where.AND.push({ pricePerDay: { lte: maxPrice } });
      }
    }

    if (condition) {
      where.condition = condition;
    }

    if (vipOnly) {
      where.vipLevel = { not: 'NONE' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Handle availability filtering
    if (availableFrom && availableTo) {
      const startDate = new Date(availableFrom);
      const endDate = new Date(availableTo);

      // This is simplified - in production you'd need to check against availability JSON
      where.NOT = {
        rentals: {
          some: {
            status: { in: ['CONFIRMED', 'PAID', 'IN_PROGRESS'] },
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
            ],
          },
        },
      };
    }

    // Build orderBy
    const orderBy = {};
    if (sortBy === 'price') {
      orderBy.pricePerDay = sortOrder;
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'views') {
      orderBy.views = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Add VIP boost
    const orderByWithVIP = [
      { vipLevel: 'desc' },
      orderBy,
    ];

    // Execute query
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              rating: true,
            },
          },
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
            },
          },
        },
        orderBy: orderByWithVIP,
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

  async getUserProducts(userId, status = null) {
    const where = { ownerId: userId };
    if (status) {
      where.status = status;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            rentals: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products;
  }

  async toggleFavorite(userId, productId) {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      return { favorited: false };
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          productId,
        },
      });
      return { favorited: true };
    }
  }

  async getUserFavorites(userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
              },
            },
            category: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map(fav => fav.product);
  }

  async updateProductStatus(productId, userId, status) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { status },
    });

    logger.info(`Product ${productId} status updated to ${status} by user ${userId}`);
    return updatedProduct;
  }

  async deleteProduct(productId, userId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    // Check if there are active rentals
    const activeRentals = await prisma.rental.findFirst({
      where: {
        productId,
        status: { in: ['CONFIRMED', 'PAID', 'IN_PROGRESS'] },
      },
    });

    if (activeRentals) {
      throw new Error('Cannot delete product with active rentals');
    }

    // Soft delete by archiving
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED' },
    });

    logger.info(`Product ${productId} archived by user ${userId}`);
    return { message: 'Product deleted successfully' };
  }

  async addProductImages(productId, userId, imageUrls) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
      include: {
        images: true,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    // Check max images (5)
    if (product.images.length + imageUrls.length > 5) {
      throw new Error('Maximum 5 images allowed per product');
    }

    const currentMaxOrder = product.images.length > 0 
      ? Math.max(...product.images.map(img => img.order))
      : -1;

    const imagesToCreate = imageUrls.map((url, index) => ({
      productId,
      url,
      order: currentMaxOrder + index + 1,
      isPrimary: product.images.length === 0 && index === 0,
    }));

    await prisma.productImage.createMany({
      data: imagesToCreate,
    });

    return { message: 'Images added successfully' };
  }

  async updateImageOrder(productId, userId, imageOrders) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    // Update each image
    const updatePromises = imageOrders.map(({ imageId, order, isPrimary }) =>
      prisma.productImage.update({
        where: {
          id: imageId,
          productId,
        },
        data: {
          order,
          isPrimary,
        },
      })
    );

    await Promise.all(updatePromises);

    return { message: 'Image order updated successfully' };
  }

  async deleteProductImage(productId, userId, imageId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
      include: {
        images: true,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    if (product.images.length <= 1) {
      throw new Error('Product must have at least one image');
    }

    const imageToDelete = product.images.find(img => img.id === imageId);
    if (!imageToDelete) {
      throw new Error('Image not found');
    }

    await prisma.productImage.delete({
      where: {
        id: imageId,
        productId,
      },
    });

    // If deleted image was primary, set first image as primary
    if (imageToDelete.isPrimary && product.images.length > 1) {
      const remainingImages = product.images.filter(img => img.id !== imageId);
      if (remainingImages.length > 0) {
        await prisma.productImage.update({
          where: {
            id: remainingImages[0].id,
          },
          data: {
            isPrimary: true,
          },
        });
      }
    }

    return { message: 'Image deleted successfully' };
  }

  async getProductStatistics(productId, userId) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
      include: {
        _count: {
          select: {
            rentals: {
              where: {
                status: { in: ['COMPLETED', 'IN_PROGRESS'] },
              },
            },
            favorites: true,
            reviews: true,
          },
        },
        rentals: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            totalAmount: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    // Calculate total revenue
    const totalRevenue = product.rentals.reduce(
      (sum, rental) => sum + rental.totalAmount,
      0
    );

    // Calculate monthly revenue
    const monthlyRevenue = {};
    product.rentals.forEach(rental => {
      const month = rental.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + rental.totalAmount;
    });

    return {
      views: product.views,
      totalRentals: product._count.rentals,
      totalFavorites: product._count.favorites,
      totalReviews: product._count.reviews,
      totalRevenue,
      monthlyRevenue,
      recentRentals: product.rentals,
    };
  }

  async updateAvailability(productId, userId, unavailableDates) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      },
    });

    if (!product) {
      throw new Error('Product not found or you are not the owner');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        availability: unavailableDates,
      },
    });

    return updatedProduct;
  }

  async activateProduct(productId, userId) {
    return this.updateProductStatus(productId, userId, 'ACTIVE');
  }

  async deactivateProduct(productId, userId) {
    return this.updateProductStatus(productId, userId, 'INACTIVE');
  }

  async getCategories() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    // Build tree structure
    const buildTree = (parentId = null) => {
      return categories
        .filter(category => category.parentId === parentId)
        .map(category => ({
          ...category,
          children: buildTree(category.id),
        }));
    };

    return buildTree();
  }

  async getRelatedProducts(productId, limit = 4) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true },
    });

    if (!product) {
      return [];
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
        status: 'ACTIVE',
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            rating: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: limit,
      orderBy: {
        views: 'desc',
      },
    });

    return relatedProducts;
  }

  async checkAvailability(productId, startDate, endDate) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        availability: true,
        rentals: {
          where: {
            status: { in: ['CONFIRMED', 'PAID', 'IN_PROGRESS'] },
          },
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check against manually set unavailable dates
    const unavailableDates = product.availability || [];
    for (const dateStr of unavailableDates) {
      const date = new Date(dateStr);
      if (date >= start && date <= end) {
        return false;
      }
    }

    // Check against existing rentals
    for (const rental of product.rentals) {
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.endDate);

      if (
        (start >= rentalStart && start <= rentalEnd) ||
        (end >= rentalStart && end <= rentalEnd) ||
        (start <= rentalStart && end >= rentalEnd)
      ) {
        return false;
      }
    }

    return true;
  }
}

const productService = new ProductService();
export default productService;