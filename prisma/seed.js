import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter
});
const { hash } = bcrypt;
async function main() {
  console.log('🌱 Начало сидирования базы данных...')

  try {
    // Очистка базы данных (осторожно! удаляет все данные)
    console.log('🧹 Очистка существующих данных...')
    await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE;`
    // Для других таблиц можно добавить аналогичные команды

    // Хеширование паролей
    const password = await hash('password123', 10)
    const adminPassword = await hash('admin123', 10)

    // 1. Создаем администратора
    console.log('👑 Создание администратора...')
    const admin = await prisma.user.create({
      data: {
        email: 'admin@rental.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'System',
        phone: '+37360000000',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        isVerified: true,
        verificationLevel: 'PREMIUM',
        balance: 10000,
        phoneVerified: true,
        phoneVerifiedAt: new Date(),
        addresses: {
          create: {
            country: 'Moldova',
            city: 'Chisinau',
            street: 'str. Stefan cel Mare',
            building: '1',
            isPrimary: true,
            postalCode: '2001'
          }
        }
      }
    })

    // 2. Создаем обычных пользователей
    console.log('👥 Создание пользователей...')
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'owner@rental.com',
          password: password,
          firstName: 'Ion',
          lastName: 'Popescu',
          phone: '+37360000001',
          role: 'OWNER',
          status: 'ACTIVE',
          emailVerified: true,
          isVerified: true,
          verificationLevel: 'VERIFIED',
          balance: 5000,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          addresses: {
            create: {
              country: 'Moldova',
              city: 'Chisinau',
              street: 'str. Mihai Eminescu',
              building: '15',
              apartment: '3',
              isPrimary: true,
              postalCode: '2005'
            }
          }
        }
      }),
      prisma.user.create({
        data: {
          email: 'renter@rental.com',
          password: password,
          firstName: 'Maria',
          lastName: 'Ionescu',
          phone: '+37360000002',
          role: 'USER',
          status: 'ACTIVE',
          emailVerified: true,
          isVerified: true,
          verificationLevel: 'BASIC',
          balance: 3000,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          addresses: {
            create: {
              country: 'Moldova',
              city: 'Chisinau',
              street: 'str. Alexandru cel Bun',
              building: '22',
              apartment: '7',
              isPrimary: true,
              postalCode: '2012'
            }
          }
        }
      })
    ])

    const owner = users[0]
    const renter = users[1]

    // 3. Создаем категории
    console.log('📁 Создание категорий...')
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Электроника',
          description: 'Техника и электронные устройства',
          icon: '📱',
          order: 1,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          name: 'Инструменты',
          description: 'Ручные и электроинструменты',
          icon: '🔧',
          order: 2,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          name: 'Спорт',
          description: 'Спортивный инвентарь',
          icon: '⚽',
          order: 3,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          name: 'Для мероприятий',
          description: 'Оборудование для праздников и мероприятий',
          icon: '🎉',
          order: 4,
          isActive: true
        }
      }),
      prisma.category.create({
        data: {
          name: 'Авто и мото',
          description: 'Автомобильные и мотоциклетные аксессуары',
          icon: '🚗',
          order: 5,
          isActive: true
        }
      })
    ])

    // 4. Создаем продукты
    console.log('🛒 Создание продуктов...')
    const products = await Promise.all([
      // Продукт 1: Дрель
      prisma.product.create({
        data: {
          title: 'Дрель Bosch Professional',
          description: 'Мощная дрель для домашнего и профессионального использования. Комплект: дрель, 2 аккумулятора, зарядное устройство, кейс.',
          categoryId: categories[1].id,
          ownerId: owner.id,
          pricePerDay: 15.99,
          pricePerWeek: 99.99,
          pricePerMonth: 299.99,
          status: 'ACTIVE',
          condition: 'Отличное',
          brand: 'Bosch',
          model: 'GSB 18V-55',
          year: 2023,
          dimensions: '25x20x8 cm',
          weight: 2.5,
          rules: 'Только для совершеннолетних. Возврат в чистом состоянии.',
          deposit: 50,
          maxRentalDays: 30,
          maxRentalDuration: 90,
          requiresDeposit: true,
          depositAmount: 50,
          depositPercentage: 50,
          isHighValue: false,
          insuranceRequired: true,
          minRentalDays: 1,
          availability: JSON.stringify([]),
          views: 124,
          rating: 4.8,
          totalReviews: 15,
          vipLevel: 'STANDARD',
          vipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
          images: {
            create: [
              { url: 'https://example.com/images/drill1.jpg', order: 1, isPrimary: true },
              { url: 'https://example.com/images/drill2.jpg', order: 2 },
              { url: 'https://example.com/images/drill3.jpg', order: 3 }
            ]
          },
          attributes: {
            create: [
              { key: 'Мощность', value: '550 Вт' },
              { key: 'Тип аккумулятора', value: 'Li-Ion 18V' },
              { key: 'Скорость вращения', value: '0-1300 об/мин' },
              { key: 'Патрон', value: '13 мм' },
              { key: 'Гарантия', value: '2 года' }
            ]
          }
        }
      }),

      // Продукт 2: Велосипед
      prisma.product.create({
        data: {
          title: 'Горный велосипед Trek',
          description: 'Горный велосипед для активного отдыха. 21 скорость, амортизационная вилка, дисковые тормоза.',
          categoryId: categories[2].id,
          ownerId: owner.id,
          pricePerDay: 12.50,
          pricePerWeek: 75.00,
          pricePerMonth: 220.00,
          status: 'ACTIVE',
          condition: 'Хорошее',
          brand: 'Trek',
          model: 'Marlin 5',
          year: 2022,
          dimensions: '180x60x100 cm',
          weight: 14.2,
          rules: 'Обязательно использование шлема. Запрещено для экстремального спорта.',
          deposit: 100,
          maxRentalDays: 14,
          maxRentalDuration: 60,
          requiresDeposit: true,
          depositAmount: 100,
          depositPercentage: 100,
          isHighValue: true,
          insuranceRequired: true,
          minRentalDays: 2,
          availability: JSON.stringify(['2024-12-25', '2024-12-26']),
          views: 89,
          rating: 4.6,
          totalReviews: 8,
          vipLevel: 'NONE',
          images: {
            create: [
              { url: 'https://example.com/images/bike1.jpg', order: 1, isPrimary: true },
              { url: 'https://example.com/images/bike2.jpg', order: 2 },
              { url: 'https://example.com/images/bike3.jpg', order: 3 }
            ]
          },
          attributes: {
            create: [
              { key: 'Размер рамы', value: '19"' },
              { key: 'Количество скоростей', value: '21' },
              { key: 'Тормоза', value: 'Дисковые механические' },
              { key: 'Вес', value: '14.2 кг' },
              { key: 'Размер колес', value: '29"' }
            ]
          }
        }
      }),

      // Продукт 3: Фотоаппарат
      prisma.product.create({
        data: {
          title: 'Зеркальный фотоаппарат Canon EOS',
          description: 'Профессиональная камера для фотографии и видеосъемки. В комплекте: объектив 18-55mm, карта памяти 32GB, сумка.',
          categoryId: categories[0].id,
          ownerId: admin.id,
          pricePerDay: 25.00,
          pricePerWeek: 150.00,
          pricePerMonth: 450.00,
          status: 'ACTIVE',
          condition: 'Отличное',
          brand: 'Canon',
          model: 'EOS 250D',
          year: 2023,
          dimensions: '12x9x7 cm',
          weight: 0.9,
          rules: 'Только для опытных пользователей. Обязательный осмотр при передаче.',
          deposit: 200,
          maxRentalDays: 7,
          maxRentalDuration: 30,
          requiresDeposit: true,
          depositAmount: 200,
          depositPercentage: 100,
          isHighValue: true,
          insuranceRequired: true,
          minRentalDays: 1,
          availability: JSON.stringify([]),
          views: 156,
          rating: 4.9,
          totalReviews: 22,
          vipLevel: 'PREMIUM',
          vipExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 дней
          images: {
            create: [
              { url: 'https://example.com/images/camera1.jpg', order: 1, isPrimary: true },
              { url: 'https://example.com/images/camera2.jpg', order: 2 },
              { url: 'https://example.com/images/camera3.jpg', order: 3 }
            ]
          },
          attributes: {
            create: [
              { key: 'Разрешение', value: '24.1 Мп' },
              { key: 'Тип матрицы', value: 'APS-C CMOS' },
              { key: 'Видео', value: '4K 25fps' },
              { key: 'ISO', value: '100-25600' },
              { key: 'Стабилизация', value: 'Цифровая' }
            ]
          }
        }
      })
    ])

    const drill = products[0]
    const bike = products[1]
    const camera = products[2]

    // 5. Создаем аренды
    console.log('📅 Создание аренд...')
    const rentals = await Promise.all([
      // Активная аренда
      prisma.rental.create({
        data: {
          productId: drill.id,
          renterId: renter.id,
          ownerId: owner.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 дня
          totalDays: 3,
          baseAmount: 47.97, // 15.99 * 3
          insuranceAmount: 5.00,
          platformFee: 4.80,
          totalAmount: 57.77,
          depositAmount: 50,
          depositStatus: 'HELD',
          insuranceLevel: 'BASIC',
          status: 'IN_PROGRESS',
          paymentStatus: 'COMPLETED',
          confirmedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          startedAt: new Date()
        }
      }),

      // Завершенная аренда
      prisma.rental.create({
        data: {
          productId: bike.id,
          renterId: renter.id,
          ownerId: owner.id,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 дней назад
          endDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 дня назад
          totalDays: 3,
          baseAmount: 37.50, // 12.50 * 3
          insuranceAmount: 3.75,
          platformFee: 3.75,
          totalAmount: 45.00,
          depositAmount: 100,
          depositStatus: 'REFUNDED',
          depositRefundedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          insuranceLevel: 'PREMIUM',
          status: 'COMPLETED',
          paymentStatus: 'COMPLETED',
          confirmedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          ownerReviewed: true,
          renterReviewed: true,
          review: {
            create: {
              reviewerId: renter.id,
              revieweeId: owner.id,
              rating: 5,
              comment: 'Отличный велосипед, все как в описании! Владелец ответственный.',
              type: 'RENTER_TO_OWNER',
              isActive: true
            }
          }
        }
      })
    ])

    const activeRental = rentals[0]
    const completedRental = rentals[1]

    // 6. Создаем отзывы
    console.log('⭐ Создание отзывов...')
    await prisma.review.create({
      data: {
        rentalId: activeRental.id,
        reviewerId: owner.id,
        revieweeId: renter.id,
        rating: 4,
        comment: 'Арендатор аккуратный, вернул инструмент вовремя и в хорошем состоянии.',
        type: 'OWNER_TO_RENTER',
        isActive: true
      }
    })

    // 7. Создаем избранное
    console.log('❤️ Создание избранных...')
    await prisma.favorite.create({
      data: {
        userId: renter.id,
        productId: camera.id
      }
    })

    // 8. Создаем сообщения
    console.log('💬 Создание сообщений...')
    await prisma.message.createMany({
      data: [
        {
          senderId: renter.id,
          receiverId: owner.id,
          rentalId: activeRental.id,
          content: 'Здравствуйте! Интересует дрель на завтра. Она доступна?',
          isRead: true,
          readAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 часа назад
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 часа назад
        },
        {
          senderId: owner.id,
          receiverId: renter.id,
          rentalId: activeRental.id,
          content: 'Да, доступна. Могу передать с 10:00 до 18:00.',
          isRead: true,
          readAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 час назад
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 часа назад
        },
        {
          senderId: renter.id,
          receiverId: owner.id,
          rentalId: activeRental.id,
          content: 'Отлично! Заберу в 11:00. Спасибо!',
          isRead: true,
          readAt: new Date(Date.now() - 30 * 60 * 1000), // 30 минут назад
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 час назад
        }
      ]
    })

    // 9. Создаем транзакции
    console.log('💰 Создание транзакций...')
    await prisma.transaction.createMany({
      data: [
        {
          userId: renter.id,
          type: 'RENTAL_INCOME',
          amount: -57.77,
          balance: 2942.23, // 3000 - 57.77
          description: 'Оплата аренды дрели Bosch Professional',
          status: 'COMPLETED',
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          userId: owner.id,
          type: 'RENTAL_INCOME',
          amount: 43.17, // 47.97 - 4.80 (платформа)
          balance: 5043.17, // 5000 + 43.17
          description: 'Доход от аренды дрели Bosch Professional',
          status: 'COMPLETED',
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ]
    })

    // 10. Создаем верификацию пользователя
    console.log('🆔 Создание верификации...')
    await prisma.userVerification.create({
      data: {
        userId: renter.id,
        documentType: 'ID_CARD',
        documentFront: 'https://example.com/docs/id_front.jpg',
        documentBack: 'https://example.com/docs/id_back.jpg',
        selfiePhoto: 'https://example.com/docs/selfie.jpg',
        status: 'VERIFIED',
        verifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        verifiedBy: admin.id
      }
    })

    // 11. Создаем промокоды
    console.log('🎫 Создание промокодов...')
    await prisma.promoCode.createMany({
      data: [
        {
          code: 'WELCOME10',
          type: 'PERCENTAGE',
          value: 10,
          maxUses: 100,
          uses: 25,
          minAmount: 20,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        {
          code: 'FIRST5',
          type: 'FIXED',
          value: 5,
          maxUses: 50,
          uses: 12,
          minAmount: 15,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      ]
    })

    // 12. Создаем уведомления
    console.log('🔔 Создание уведомлений...')
    await prisma.notification.createMany({
      data: [
        {
          userId: renter.id,
          type: 'RENTAL_CONFIRMED',
          title: 'Аренда подтверждена',
          message: 'Ваша аренда дрели Bosch Professional подтверждена владельцем.',
          data: JSON.stringify({ rentalId: activeRental.id }),
          isRead: true,
          readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          userId: owner.id,
          type: 'RENTAL_REQUEST',
          title: 'Новый запрос на аренду',
          message: 'Maria Ionescu хочет арендовать ваш велосипед Trek.',
          data: JSON.stringify({ rentalId: completedRental.id }),
          isRead: true,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        },
        {
          userId: renter.id,
          type: 'REVIEW_RECEIVED',
          title: 'Новый отзыв',
          message: 'Ion Popescu оставил вам отзыв.',
          data: JSON.stringify({ reviewId: '1' }),
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ]
    })

    console.log('✅ Сидирование успешно завершено!')
    console.log('📊 Статистика:')
    console.log(`   👤 Пользователей: 3`)
    console.log(`   🛒 Продуктов: ${products.length}`)
    console.log(`   📅 Аренд: ${rentals.length}`)
    console.log(`   ⭐ Отзывов: 2`)
    console.log(`   💬 Сообщений: 3`)
    console.log(`   🔔 Уведомлений: 3`)

  } catch (error) {
    console.error('❌ Ошибка при сидировании:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('❌ Критическая ошибка:', error)
    await prisma.$disconnect()
    process.exit(1)
  })